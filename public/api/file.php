<?php
// Sert les images envoyées depuis le dashboard (stockées dans le dossier des données).
// Variante « .m.webp » / « .t.webp » absente : renvoie l'image d'origine.
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
if (!preg_match('/^([\w-]+)(\.[mt])?\.(jpg|png|webp|gif|avif)$/', $name, $match)) {
    http_response_code(404);
    exit('Not found');
}

$dirs = [data_dir() . '/uploads', dirname(__DIR__) . '/uploads'];
$file = null;
foreach ($dirs as $dir) {
    if (is_file("$dir/$name")) {
        $file = "$dir/$name";
        break;
    }
}
if ($file === null && $match[2] !== '') {
    foreach ($dirs as $dir) {
        foreach (glob("$dir/{$match[1]}.*") ?: [] as $candidate) {
            if (preg_match('/^[\w-]+\.(jpg|png|webp|gif|avif)$/', basename($candidate))) {
                $file = $candidate;
                break 2;
            }
        }
    }
}
if ($file === null) {
    http_response_code(404);
    exit('Not found');
}

header('Content-Type: ' . MIME[pathinfo($file, PATHINFO_EXTENSION)]);
header('Content-Length: ' . filesize($file));
// Noms de fichiers uniques : on peut mettre en cache longtemps
header('Cache-Control: public, max-age=31536000, immutable');
readfile($file);
