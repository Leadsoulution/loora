<?php
// POST /api/admin/login : connexion au dashboard. DELETE : déconnexion.
define('LOORA', 1);
require __DIR__ . '/../_lib.php';

only_methods(['POST', 'DELETE']);

if (method() === 'DELETE') {
    set_admin_cookie('', time() - 3600);
    json_out(['ok' => true]);
}

if (ADMIN_HASH === '') {
    json_out(['error' => 'Aucun mot de passe défini : lancez « npm run password » puis republiez le site.'], 503);
}

$body = read_json_body() ?? [];
$password = is_string($body['password'] ?? null) ? $body['password'] : '';
if (!check_password($password)) {
    // Petit délai pour freiner les essais en série
    usleep(600000);
    json_out(['error' => 'Mot de passe incorrect.'], 401);
}

set_admin_cookie(admin_token(), time() + 60 * 60 * 24 * 7);
json_out(['ok' => true]);
