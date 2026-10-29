<?php
// POST /api/admin/upload : image envoyée depuis le dashboard.
define('LOORA', 1);
require __DIR__ . '/../_lib.php';

only_methods(['POST']);
require_admin();

const TYPES = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
    'image/avif' => 'avif',
];
const MAX_SIZE = 8 * 1024 * 1024; // 8 Mo

$file = $_FILES['file'] ?? null;
if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
    json_out(['error' => 'Aucun fichier reçu.'], 400);
}
if (in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) || $file['size'] > MAX_SIZE) {
    json_out(['error' => 'Image trop lourde (8 Mo maximum).'], 413);
}
if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
    json_out(['error' => "L'envoi a échoué. Réessayez."], 400);
}

// Type lu dans le fichier lui-même, pas celui annoncé par le navigateur
$type = '';
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $type = (string) finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
} else {
    $info = @getimagesize($file['tmp_name']);
    $type = $info['mime'] ?? '';
}
$ext = TYPES[$type] ?? null;
if ($ext === null) {
    json_out(['error' => 'Format accepté : JPG, PNG, WEBP, GIF ou AVIF.'], 415);
}

$dir = data_dir() . '/uploads';
if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
    json_out(['error' => "Impossible d'enregistrer l'image sur le serveur."], 500);
}
$name = (int) round(microtime(true) * 1000) . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
if (!move_uploaded_file($file['tmp_name'], "$dir/$name")) {
    json_out(['error' => "Impossible d'enregistrer l'image sur le serveur."], 500);
}

json_out(['url' => "/uploads/$name"]);
