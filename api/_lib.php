<?php
// Fonctions partagées par l'API PHP du site (hébergement web Hostinger).
// Équivalent en ligne des routes src/app/**/route.dev.ts utilisées en local.

if (!defined('LOORA')) {
    http_response_code(404);
    exit;
}

require __DIR__ . '/config.php';

/** Les 3 produits du site (voir src/lib/products.ts) */
const LOORA_PRODUCTS = ['bague-aube', 'collier-lune-dor', 'boucles-goutte'];

const METAL_LABEL = [
    'or' => 'Acier inoxydable doré',
    'argent' => 'Acier inoxydable argenté',
    'rose' => 'Acier inoxydable or rose',
];

const ORDER_STATUSES = [
    'a_confirmer' => 'À confirmer',
    'confirmee' => 'Confirmée',
    'expediee' => 'Expédiée',
    'livree' => 'Livrée',
    'annulee' => 'Annulée',
    'retour' => 'Retour',
];

/* ------------------------------------------------------------ Réponses */

function json_out($data, $status = 200)
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Réponse JSON déjà encodée (contenu enregistré, renvoyé tel quel) */
function raw_json_out($json, $status = 200)
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo $json;
    exit;
}

function method()
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function only_methods(array $allowed)
{
    if (!in_array(method(), $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        json_out(['error' => 'Méthode non autorisée.'], 405);
    }
}

/** Corps JSON de la requête (tableau associatif), ou null s'il est invalide */
function read_json_body()
{
    $data = json_decode((string) file_get_contents('php://input'), true);
    return is_array($data) ? $data : null;
}

function str_val($value, $max = 200)
{
    return is_scalar($value) ? mb_substr(trim((string) $value), 0, $max) : '';
}

/* ------------------------------------------------------------ Données */

/**
 * Dossier des données (contenu, images envoyées, commandes).
 * De préférence à côté du site (hors public_html) pour ne jamais être touché par un déploiement,
 * sinon dans le site, protégé par .htaccess.
 */
function data_dir()
{
    static $dir = null;
    if ($dir !== null) {
        return $dir;
    }
    $site = dirname(__DIR__);
    foreach ([dirname($site) . '/loora-data', $site . '/_data'] as $candidate) {
        if ((is_dir($candidate) || @mkdir($candidate, 0755, true)) && is_writable($candidate)) {
            if ($candidate === $site . '/_data' && !is_file($candidate . '/.htaccess')) {
                @file_put_contents($candidate . '/.htaccess', "Require all denied\nDeny from all\n");
            }
            return $dir = $candidate;
        }
    }
    json_out(['error' => 'Dossier de données inaccessible sur le serveur.'], 500);
}

function write_atomic($file, $content)
{
    $tmp = $file . '.tmp';
    if (file_put_contents($tmp, $content, LOCK_EX) === false || !rename($tmp, $file)) {
        json_out(['error' => "L'enregistrement a échoué sur le serveur."], 500);
    }
}

/** Contenu du site en JSON : celui enregistré depuis le dashboard, sinon le contenu de départ */
function load_store_json()
{
    $file = data_dir() . '/content.json';
    if (is_file($file)) {
        $json = file_get_contents($file);
        if ($json !== false && is_array(json_decode($json, true))) {
            return $json;
        }
    }
    $seed = @file_get_contents(__DIR__ . '/seed.json');
    return $seed !== false ? $seed : '{}';
}

function load_store()
{
    $store = json_decode(load_store_json(), true);
    return is_array($store) ? $store : [];
}

/* ------------------------------------------------------------ Dashboard */

function admin_token()
{
    return hash_hmac('sha256', 'loora-admin-session-v1', ADMIN_HASH);
}

function is_admin()
{
    $cookie = $_COOKIE['loora_admin'] ?? '';
    return ADMIN_HASH !== '' && is_string($cookie) && $cookie !== '' && hash_equals(admin_token(), $cookie);
}

function require_admin()
{
    if (!is_admin()) {
        json_out(['error' => 'Non autorisé.'], 401);
    }
}

function check_password($password)
{
    if (ADMIN_HASH === '') {
        return false;
    }
    return hash_equals(ADMIN_HASH, hash_pbkdf2('sha256', $password, ADMIN_SALT, ADMIN_ITERATIONS, 64));
}

function set_admin_cookie($value, $expires)
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    setcookie('loora_admin', $value, [
        'expires' => $expires,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => $https,
    ]);
}

/* ------------------------------------------------------------ Commandes */

/** Les écritures passent une par une pour ne jamais perdre de commande */
function with_orders_lock($task)
{
    $lock = fopen(data_dir() . '/orders.lock', 'c');
    flock($lock, LOCK_EX);
    try {
        return $task();
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

function read_orders()
{
    $file = data_dir() . '/orders.jsonl';
    $orders = [];
    if (!is_file($file)) {
        return $orders;
    }
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $order = json_decode($line, true);
        if (!is_array($order)) {
            continue;
        }
        if (!isset(ORDER_STATUSES[$order['status'] ?? ''])) {
            $order['status'] = 'a_confirmer';
        }
        $orders[] = $order;
    }
    return $orders;
}

function encode_order($order)
{
    return json_encode($order, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function write_orders(array $orders)
{
    $lines = array_map('encode_order', $orders);
    write_atomic(data_dir() . '/orders.jsonl', $orders ? implode("\n", $lines) . "\n" : '');
}

/* ------------------------------------------------------------ Connexions (dops, webhook) */

function default_settings()
{
    return [
        // Orderly (dops) par « formulaire web » : chaque commande est envoyée à son adresse (clé incluse)
        'orderly' => ['url' => '', 'lastSuccess' => '', 'lastError' => ''],
        // Ancienne méthode : dops lit les commandes comme une boutique WooCommerce (api/wc.php)
        'dops' => ['enabled' => false, 'key' => '', 'secret' => '', 'webhook' => '', 'lastSuccess' => '', 'lastError' => ''],
        // Autre application : reçoit chaque commande en JSON
        'webhook' => '',
    ];
}

function load_settings()
{
    $settings = default_settings();
    $saved = json_decode((string) @file_get_contents(data_dir() . '/settings.json'), true);
    foreach (['orderly', 'dops'] as $group) {
        if (!is_array($saved[$group] ?? null)) {
            continue;
        }
        foreach ($settings[$group] as $k => $v) {
            if (isset($saved[$group][$k]) && gettype($saved[$group][$k]) === gettype($v)) {
                $settings[$group][$k] = $saved[$group][$k];
            }
        }
    }
    if (is_string($saved['webhook'] ?? null)) {
        $settings['webhook'] = $saved['webhook'];
    }
    return $settings;
}

function save_settings(array $settings)
{
    write_atomic(data_dir() . '/settings.json', json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
}

/** Adresse du site (https://loora.ma) */
function site_url()
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    return ($https ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
}

/** Envoie un JSON en POST. Retourne [succès, code HTTP, corps ou message d'erreur]. */
function post_json($url, $payload, $timeout = 10)
{
    $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'User-Agent: LOORA'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => $timeout,
        ]);
        $response = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        if ($response === false) {
            return [false, 0, $error ?: 'Adresse injoignable.'];
        }
        return [$status >= 200 && $status < 300, $status, (string) $response];
    }
    $response = @file_get_contents($url, false, stream_context_create(['http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\nUser-Agent: LOORA\r\n",
        'content' => $body,
        'timeout' => $timeout,
        'ignore_errors' => true,
    ]]));
    $status = preg_match('#^HTTP/\S+ (\d+)#', $http_response_header[0] ?? '', $m) ? (int) $m[1] : 0;
    if ($response === false) {
        return [false, 0, 'Adresse injoignable.'];
    }
    return [$status >= 200 && $status < 300, $status, $response];
}

/**
 * Prévient dops qu'une commande est arrivée (son adresse « webhook WooCommerce »).
 * dops relit alors les commandes récentes via api/wc.php. Résultat gardé pour le dashboard.
 */
function notify_dops($order = null)
{
    $settings = load_settings();
    $dops = $settings['dops'];
    if (!$dops['enabled'] || $dops['webhook'] === '') {
        return [false, 'Connexion dops désactivée ou adresse du webhook manquante.'];
    }
    list($ok, $status, $body) = post_json($dops['webhook'], $order ? woo_order($order) : ['test' => true]);
    // dops répond toujours 200 et met l'éventuelle erreur d'import dans le corps
    $reply = json_decode($body, true);
    if ($ok && is_array($reply) && !empty($reply['error'])) {
        $ok = false;
        $message = 'dops : ' . $reply['error'];
    } elseif ($ok) {
        $message = is_array($reply) && isset($reply['importees'])
            ? "dops a répondu : {$reply['importees']} nouvelle(s) commande(s) importée(s)."
            : 'dops a bien reçu la notification.';
    } else {
        $message = $status ? "dops a répondu avec l'erreur $status." : "dops injoignable : $body";
    }
    // Relu juste avant d'écrire : les réglages ont pu changer pendant l'envoi
    $settings = load_settings();
    $settings['dops'][$ok ? 'lastSuccess' : 'lastError'] = iso_now() . ($ok ? '' : " — $message");
    save_settings($settings);
    return [$ok, $message];
}

/**
 * Commande au format « formulaire web » d'Orderly : noms de champs qu'il reconnaît
 * (name, phone, city, address, product, quantity, total, reference).
 */
function orderly_payload(array $o)
{
    $slug = (string) ($o['slug'] ?? '');
    $store = load_store();
    $content = is_array($store['products'][$slug] ?? null) ? $store['products'][$slug] : [];
    // Orderly reconnaît le produit par son nom exact dans son catalogue ; une virgule y ferait deux produits
    $orderlyName = trim((string) ($content['orderlyName'] ?? ''));
    $product = $orderlyName !== '' ? $orderlyName : trim(($content['type'] ?? '') . ' ' . ($o['product'] ?? $slug));
    $product = str_replace(',', ' ', $product);
    $city = trim((string) ($o['city'] ?? ''));
    $address = trim((string) ($o['address'] ?? ''));
    // Pas de note : dans Orderly elle est réservée au service de confirmation
    return [
        'reference' => (string) ($o['ref'] ?? ''),
        'name' => (string) ($o['name'] ?? ''),
        'phone' => (string) ($o['phone'] ?? ''),
        // Formulaire sans case ville : l'adresse en tient lieu, pour qu'Orderly ait toujours une ville à afficher
        'city' => $city !== '' ? $city : $address,
        'address' => $address,
        'product' => $product,
        'quantity' => (int) ($o['qty'] ?? 1),
        'total' => $o['total'] ?? 0,
    ];
}

/** Envoie une commande à Orderly ; le résultat est gardé pour le dashboard (page Connexions) */
function notify_orderly(array $payload)
{
    $url = load_settings()['orderly']['url'];
    if ($url === '') {
        return [false, "Adresse d'Orderly manquante."];
    }
    list($ok, $status, $body) = post_json($url, $payload);
    $reply = json_decode($body, true);
    if ($ok && is_array($reply) && !empty($reply['ok'])) {
        $message = 'Orderly a enregistré la commande' . (!empty($reply['reference']) ? " ({$reply['reference']})." : '.');
    } else {
        $ok = false;
        $message = is_array($reply) && !empty($reply['error'])
            ? 'Orderly : ' . $reply['error']
            : ($status ? "Orderly a répondu avec l'erreur $status." : "Orderly injoignable : $body");
    }
    $settings = load_settings();
    $settings['orderly'][$ok ? 'lastSuccess' : 'lastError'] = iso_now() . " — $message";
    save_settings($settings);
    return [$ok, $message];
}

/** Prévient les applications reliées d'une nouvelle commande */
function notify_integrations(array $order)
{
    $settings = load_settings();
    if ($settings['orderly']['url'] !== '') {
        notify_orderly(orderly_payload($order));
    }
    if ($settings['dops']['enabled'] && $settings['dops']['webhook'] !== '') {
        notify_dops($order);
    }
    $webhook = $settings['webhook'] !== '' ? $settings['webhook'] : ORDER_WEBHOOK_URL;
    if ($webhook !== '') {
        post_json($webhook, $order);
    }
}

/** Répond tout de suite au navigateur, puis le script continue (envois aux applications reliées) */
function respond_early($data)
{
    ignore_user_abort(true);
    $body = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('Content-Length: ' . strlen($body));
    header('Connection: close');
    echo $body;
    if (function_exists('litespeed_finish_request')) {
        litespeed_finish_request();
    } elseif (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    } else {
        while (ob_get_level() > 0) {
            ob_end_flush();
        }
        flush();
    }
}

/* ------------------------------------------------------------ Format WooCommerce (pour dops) */

const WOO_STATUS = [
    'a_confirmer' => 'processing',
    'confirmee' => 'processing',
    'expediee' => 'processing',
    'livree' => 'completed',
    'annulee' => 'cancelled',
    'retour' => 'refunded',
];

/** Numéro de commande WooCommerce : la référence LO-XXXX lue en base 36 (heure de la commande en ms) */
function woo_order_id($ref)
{
    return (int) base_convert(substr((string) $ref, 3), 36, 10);
}

/** Commande LOORA au format de l'API REST WooCommerce v3 (ce que dops lit) */
function woo_order(array $o)
{
    $slug = (string) ($o['slug'] ?? '');
    $index = array_search($slug, LOORA_PRODUCTS, true);
    // Nom complet, comme sur la page : type + nom (« طقم الفراشة الذهبية + أقراط … »)
    static $store = null;
    $store = $store ?? load_store();
    $type = (string) ($store['products'][$slug]['type'] ?? '');
    // Code article choisi dans le dashboard (sinon l'identifiant de la page) : dops relie la commande au produit
    $sku = (string) ($store['products'][$slug]['sku'] ?? '');
    $name = trim($type . ' ' . (string) ($o['product'] ?? $slug));
    if (!empty($o['size'])) {
        $name .= ' — taille ' . $o['size'];
    }
    $notes = [];
    foreach (is_array($o['extra'] ?? null) ? $o['extra'] : [] as $x) {
        $notes[] = ($x['label'] ?? '') . ' : ' . ($x['value'] ?? '');
    }
    $address = ['address_1' => (string) ($o['address'] ?? ''), 'city' => (string) ($o['city'] ?? ''), 'country' => 'MA'];
    $total = (string) ($o['total'] ?? 0);
    return [
        'id' => woo_order_id($o['ref'] ?? ''),
        'number' => (string) ($o['ref'] ?? ''),
        'status' => WOO_STATUS[$o['status'] ?? ''] ?? 'processing',
        'currency' => 'MAD',
        'date_created' => (string) ($o['createdAt'] ?? ''),
        'date_created_gmt' => rtrim((string) ($o['createdAt'] ?? ''), 'Z'),
        'date_modified' => (string) ($o['updatedAt'] ?? $o['createdAt'] ?? ''),
        'total' => $total,
        'payment_method' => 'cod',
        'payment_method_title' => 'Paiement à la livraison',
        'customer_note' => implode("\n", $notes),
        'billing' => ['first_name' => (string) ($o['name'] ?? ''), 'last_name' => '', 'phone' => (string) ($o['phone'] ?? '')] + $address,
        'shipping' => ['first_name' => (string) ($o['name'] ?? ''), 'last_name' => ''] + $address,
        'line_items' => [[
            'id' => 1,
            'product_id' => $index === false ? 0 : $index + 1,
            'variation_id' => 0,
            'name' => $name,
            'sku' => $sku !== '' ? $sku : $slug,
            'quantity' => (int) ($o['qty'] ?? 1),
            'total' => $total,
            'meta_data' => array_values(array_filter([
                !empty($o['offer']) ? ['key' => 'Offre', 'value' => $o['offer']] : null,
                !empty($o['metal']) ? ['key' => 'Métal', 'value' => $o['metal']] : null,
                !empty($o['size']) ? ['key' => 'Taille', 'value' => $o['size']] : null,
            ])),
        ]],
        'meta_data' => [],
    ];
}

/** Date ISO 8601 en UTC avec millisecondes, comme new Date().toISOString() */
function iso_now()
{
    $date = DateTime::createFromFormat('U.u', sprintf('%.6F', microtime(true)));
    $date->setTimezone(new DateTimeZone('UTC'));
    return $date->format('Y-m-d\TH:i:s.v\Z');
}
