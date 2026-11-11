<?php
// POST /api/orderly-hook : Orderly (dops) prévient LOORA qu'une commande a bougé
// (Orderly → Paramètres → Webhooks). Le statut de confirmation et celui de la livraison
// sont recopiés sur la commande du site, retrouvée par sa référence LO-….
// Signature : en-tête X-Dops-Signature = HMAC-SHA256(secret, "<X-Dops-Timestamp>.<corps>") en hexadécimal.
define('LOORA', 1);
require __DIR__ . '/_lib.php';

only_methods(['POST']);

/** Garde la trace du dernier appel pour la page Connexions, puis répond */
function hook_reply($ok, $message, $status = 200)
{
    $settings = load_settings();
    $settings['orderly'][$ok ? 'hookLast' : 'hookError'] = iso_now() . " — $message";
    save_settings($settings);
    json_out(['ok' => $ok, 'message' => $message], $status);
}

/** Statut LOORA correspondant ; null = garder celui de la commande */
function loora_status($status, $delivery)
{
    // La livraison passe devant : un colis livré ou retourné dit le dernier mot
    $delivery = mb_strtolower(trim($delivery));
    if ($delivery !== '' && preg_match('/retour|refus/u', $delivery)) {
        return 'retour';
    }
    if ($delivery !== '' && preg_match('/^livr/u', $delivery)) {
        return 'livree';
    }
    if ($status === 'Confirme') {
        return 'confirmee';
    }
    if ($status === 'EXPIDER') {
        return 'expediee';
    }
    if (in_array($status, ['Annulee', 'Faux numero', 'Non commandee', 'Expiree', 'En double'], true)) {
        return 'annulee';
    }
    if ($status === 'TESTE' || $status === '') {
        return null;
    }
    // Nouveau, Pas de rep, Injoignable, En attente, Reportee, Rappel… : encore à confirmer
    return 'a_confirmer';
}

$secret = load_settings()['orderly']['hookSecret'];
if ($secret === '') {
    json_out(['ok' => false, 'error' => 'Secret du webhook non enregistré dans LOORA.'], 503);
}

$raw = (string) file_get_contents('php://input');
$timestamp = (string) ($_SERVER['HTTP_X_DOPS_TIMESTAMP'] ?? '');
$signature = (string) ($_SERVER['HTTP_X_DOPS_SIGNATURE'] ?? '');
if ($signature === '' || !hash_equals(hash_hmac('sha256', "$timestamp.$raw", $secret), $signature)) {
    hook_reply(false, 'Signature invalide : vérifiez le secret copié depuis Orderly.', 401);
}
// Un appel capté ne doit pas pouvoir être rejoué plus tard
if (abs(time() - intdiv((int) $timestamp, 1000)) > 3600) {
    hook_reply(false, 'Appel trop ancien, ignoré.', 401);
}

$payload = json_decode($raw, true);
$order = is_array($payload['order'] ?? null) ? $payload['order'] : null;
if ($order === null) {
    hook_reply(false, 'Contenu illisible.', 400);
}

// Commande importée par la méthode WooCommerce : « WC-LO-… »
$ref = preg_replace('/^WC-/', '', (string) ($order['reference'] ?? ''));
$status = (string) ($order['status'] ?? '');
$delivery = (string) ($order['delivery_status'] ?? '');

$found = with_orders_lock(function () use ($ref, $status, $delivery) {
    $orders = read_orders();
    foreach ($orders as $i => $o) {
        if (($o['ref'] ?? null) !== $ref) {
            continue;
        }
        $orders[$i]['orderlyStatus'] = $status;
        $orders[$i]['orderlyDelivery'] = $delivery;
        $next = loora_status($status, $delivery);
        if ($next !== null) {
            $orders[$i]['status'] = $next;
        }
        $orders[$i]['updatedAt'] = iso_now();
        write_orders($orders);
        return true;
    }
    return false;
});

// Orderly prévient pour toutes ses commandes, y compris celles d'autres boutiques :
// une référence inconnue n'est pas une erreur (sinon Orderly réessaierait en boucle)
if (!$found) {
    json_out(['ok' => true, 'ignored' => true]);
}
hook_reply(true, "$ref → $status" . ($delivery !== '' ? " / $delivery" : ''));
