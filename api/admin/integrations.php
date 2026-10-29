<?php
// Connexions du dashboard (dops, webhook).
//   GET  : réglages
//   PUT  : { dopsEnabled, dopsWebhook, webhook }
//   POST : { action: "regenerate" } nouvelles clés dops, { action: "test" } notification d'essai à dops
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
    $dopsWebhook = str_val($body['dopsWebhook'] ?? '', 500);
    $webhook = str_val($body['webhook'] ?? '', 500);
    if (!valid_url($dopsWebhook) || !valid_url($webhook)) {
        json_out(['error' => "L'adresse doit commencer par https://"], 400);
    }
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
    if ($action === 'test') {
        list($ok, $message) = notify_dops();
        json_out(['ok' => $ok, 'message' => $message, 'settings' => load_settings()]);
    }
    json_out(['error' => 'Action inconnue.'], 400);
}

json_out($settings);
