<?php
// Sert les images envoyées depuis le dashboard (stockées dans le dossier des données).
define('LOORA', 1);
require __DIR__ . '/_lib.php';

const MIME = [
    'jpg' => 'image/jpeg',
    'png' => 'image/png',
    'webp' => 'image/webp',
    'gif' => 'image/gif',
    'avif' => 'image/avif',
];

$name = is_string($_GET['f'] ?? null) ? $_GET['f'] : '';
$file = data_dir() . '/uploads/' . $name;
if (!preg_match('/^[\w-]+\.(jpg|png|webp|gif|avif)$/', $name, $match) || !is_file($file)) {
    http_response_code(404);
    exit('Not found');
}

header('Content-Type: ' . MIME[$match[1]]);
header('Content-Length: ' . filesize($file));
// Noms de fichiers uniques : on peut mettre en cache longtemps
header('Cache-Control: public, max-age=31536000, immutable');
readfile($file);
