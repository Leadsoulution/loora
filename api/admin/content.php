<?php
// GET /api/admin/content : contenu à modifier. PUT : enregistre et publie.
define('LOORA', 1);
require __DIR__ . '/../_lib.php';

only_methods(['GET', 'PUT']);
require_admin();

if (method() === 'GET') {
    raw_json_out(load_store_json());
}

// Le dashboard envoie un contenu déjà nettoyé (cleanStore) : on vérifie juste que c'est un JSON valide
$json = (string) file_get_contents('php://input');
if (strlen($json) > 5 * 1024 * 1024 || !is_array(json_decode($json, true))) {
    json_out(['error' => 'Données invalides.'], 400);
}
write_atomic(data_dir() . '/content.json', $json);
raw_json_out($json);
