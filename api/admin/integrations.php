<?php
// Connexions du dashboard (dops, webhook).
//   GET  : réglages
//   PUT  : { orderlyUrl, orderlyHookSecret, dopsEnabled, dopsWebhook, webhook }
//   POST : { action: "test-orderly" } commande d'essai envoyée à Orderly,
//          { action: "regenerate" } nouvelles clés dops, { action: "test" } notification d'essai à dops
define('LOORA', 1);
require __DIR__ . '/../_lib.php';

only_methods(['GET', 'PUT', 'POST']);
require_admin();

function valid_url($url)
{
    return $url === '' || (bool) preg_match('#^https?://[^\s]+$#i', $url);
}

function new_keys(array $settings)
{
    $settings['dops']['key'] = 'ck_' . bin2hex(random_bytes(20));
    $settings['dops']['secret'] = 'cs_' . bin2hex(random_bytes(20));
    return $settings;
}

$settings = load_settings();

if (method() === 'PUT') {
    $body = read_json_body() ?? [];
    $orderlyUrl = str_val($body['orderlyUrl'] ?? '', 500);
    $dopsWebhook = str_val($body['dopsWebhook'] ?? '', 500);
    $webhook = str_val($body['webhook'] ?? '', 500);
    $hookSecret = str_val($body['orderlyHookSecret'] ?? '', 200);
    if (!preg_match('/^[\w-]*$/', $hookSecret)) {
        json_out(['error' => 'Le secret du webhook ne doit contenir que des lettres, des chiffres, _ ou -.'], 400);
    }
    if (!valid_url($orderlyUrl) || !valid_url($dopsWebhook) || !valid_url($webhook)) {
        json_out(['error' => "L'adresse doit commencer par https://"], 400);
    }
    $settings['orderly']['url'] = $orderlyUrl;
    // Nouveau secret : les messages de l'ancien ne veulent plus rien dire
    if ($hookSecret !== $settings['orderly']['hookSecret']) {
        $settings['orderly']['hookLast'] = '';
        $settings['orderly']['hookError'] = '';
    }
    $settings['orderly']['hookSecret'] = $hookSecret;
    $settings['dops']['enabled'] = !empty($body['dopsEnabled']);
    $settings['dops']['webhook'] = $dopsWebhook;
    $settings['webhook'] = $webhook;
    // Première activation : les clés sont créées automatiquement
    if ($settings['dops']['enabled'] && $settings['dops']['key'] === '') {
        $settings = new_keys($settings);
    }
    save_settings($settings);
    json_out($settings);
}

if (method() === 'POST') {
    $action = (read_json_body() ?? [])['action'] ?? '';
    if ($action === 'regenerate') {
        $settings = new_keys($settings);
        save_settings($settings);
        json_out($settings);
    }
    if ($action === 'test-orderly') {
        // Vraie commande créée dans Orderly, clairement marquée comme essai
        list($ok, $message) = notify_orderly([
            'reference' => 'LO-TEST-' . strtoupper(base_convert((string) time(), 10, 36)),
            'name' => 'Test LOORA',
            'phone' => '0612345678',
            'city' => 'Casablanca',
            'address' => 'Commande de test',
            'product' => 'Test de connexion LOORA',
            'quantity' => 1,
            'total' => 0,
            'note' => 'Commande de test envoyée depuis le dashboard LOORA : à supprimer.',
        ]);
        json_out(['ok' => $ok, 'message' => $message, 'settings' => load_settings()]);
    }
    if ($action === 'test') {
        list($ok, $message) = notify_dops();
        json_out(['ok' => $ok, 'message' => $message, 'settings' => load_settings()]);
    }
    json_out(['error' => 'Action inconnue.'], 400);
}

json_out($settings);
