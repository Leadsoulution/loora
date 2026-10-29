<?php
// POST /api/orders : commande depuis le formulaire d'une fiche produit (voir src/lib/order.ts).
define('LOORA', 1);
require __DIR__ . '/_lib.php';

only_methods(['POST']);

/** Champs qui ont leur propre colonne dans la commande */
const BASE_FIELDS = ['name', 'phone', 'city', 'address'];

const PHONE_ERROR = 'رقم الهاتف غير صحيح. المرجو إدخال رقم مغربي صحيح مثل 06XXXXXXXX.';
const REQUIRED_ERROR = [
    'name' => 'المرجو إدخال الاسم الكامل.',
    'city' => 'المرجو إدخال المدينة.',
    'address' => 'المرجو إدخال العنوان.',
];

/** Numéro marocain : 05/06/07 + 8 chiffres, ou +212 / 00212 */
function is_valid_phone($phone)
{
    $compact = preg_replace('/[\s.\-]/u', '', $phone);
    return (bool) preg_match('/^(?:\+212|00212|0)[5-7]\d{8}$/', $compact);
}

function field_max_length($field)
{
    $kind = $field['kind'] ?? '';
    return $kind === 'phone' ? 17 : ($kind === 'long' ? 1000 : 200);
}

$body = read_json_body();
if ($body === null) {
    json_out(['errors' => ['form' => 'طلب غير صالح.']], 400);
}

// Champ piège anti-robot : rempli = robot, on fait semblant d'accepter
if (!empty($body['website'])) {
    json_out(['ref' => 'LO-OK', 'total' => 0]);
}

$slug = str_val($body['slug'] ?? '', 100);
$store = load_store();
$content = in_array($slug, LOORA_PRODUCTS, true) ? ($store['products'][$slug] ?? null) : null;
if (!is_array($content)) {
    json_out(['errors' => ['form' => 'المنتج غير موجود.']], 422);
}

$fields = is_array($content['fields'] ?? null) ? $content['fields'] : [];
$offers = is_array($content['offers'] ?? null) ? $content['offers'] : [];
$sizes = is_array($content['sizes'] ?? null) ? $content['sizes'] : [];

// On ne garde que les champs configurés dans le dashboard
$raw = is_array($body['values'] ?? null) ? $body['values'] : [];
$values = [];
foreach ($fields as $field) {
    $id = (string) ($field['id'] ?? '');
    $values[$id] = is_string($raw[$id] ?? null) ? mb_substr(trim($raw[$id]), 0, field_max_length($field)) : '';
}

$metal = is_string($body['metal'] ?? null) ? $body['metal'] : '';
$size = !empty($body['size']) ? str_val($body['size'], 20) : '';
$offerId = str_val($body['offer'] ?? '', 100);
$offer = null;
foreach ($offers as $o) {
    if (($o['id'] ?? null) === $offerId) {
        $offer = $o;
        break;
    }
}

// Même validation que le formulaire (src/lib/order.ts)
$errors = [];
if (!isset(METAL_LABEL[$metal]) || $offer === null) {
    $errors['form'] = 'العرض غير صالح.';
} elseif (count($sizes) > 0 && !in_array($size, $sizes, true)) {
    $errors['size'] = 'المرجو اختيار المقاس.';
}
foreach ($fields as $field) {
    $id = (string) ($field['id'] ?? '');
    $value = $values[$id];
    if (($field['kind'] ?? '') === 'phone') {
        if ((!empty($field['required']) || $value !== '') && !is_valid_phone($value)) {
            $errors[$id] = PHONE_ERROR;
        }
    } elseif (!empty($field['required']) && mb_strlen($value) < 2) {
        $errors[$id] = REQUIRED_ERROR[$id] ?? 'المرجو ملء هذا الحقل.';
    }
}
if ($errors) {
    json_out(['errors' => $errors], 422);
}

// Quantité et prix viennent de l'offre enregistrée dans le dashboard, jamais du client
$ref = 'LO-' . strtoupper(base_convert((string) (int) round(microtime(true) * 1000), 10, 36));
$extra = [];
foreach ($fields as $field) {
    $id = (string) ($field['id'] ?? '');
    if (!in_array($id, BASE_FIELDS, true) && $values[$id] !== '') {
        $extra[] = ['label' => (string) ($field['label'] ?? $id), 'value' => $values[$id]];
    }
}

$order = [
    'ref' => $ref,
    'createdAt' => iso_now(),
    'status' => 'a_confirmer',
    'payment' => 'paiement à la livraison',
    'product' => (string) ($content['name'] ?? $slug),
    'slug' => $slug,
];
if ($size !== '') {
    $order['size'] = $size;
}
$order += [
    'name' => $values['name'] ?? '',
    'phone' => $values['phone'] ?? '',
    'city' => $values['city'] ?? '',
    'address' => $values['address'] ?? '',
];
if ($extra) {
    $order['extra'] = $extra;
}
$order += [
    'offer' => (string) ($offer['label'] ?? ''),
    'qty' => $offer['qty'] ?? 1,
    'metal' => METAL_LABEL[$metal],
    'total' => $offer['price'] ?? 0,
];

// 1. Sauvegarde (visible dans le dashboard, onglet Commandes)
$line = encode_order($order) . "\n";
with_orders_lock(function () use ($line) {
    if (file_put_contents(data_dir() . '/orders.jsonl', $line, FILE_APPEND) === false) {
        json_out(['errors' => ['form' => 'حدث خطأ، المرجو المحاولة مرة أخرى.']], 500);
    }
});

// 2. Réponse immédiate au client, puis on prévient les applications reliées (dops, webhook)
respond_early(['ref' => $ref, 'total' => $order['total']]);
notify_integrations($order);
