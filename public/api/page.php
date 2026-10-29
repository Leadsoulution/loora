<?php
// Fiche produit (appelé par le .htaccess pour /produit/<slug>/).
//  - Contenu inchangé depuis la dernière compilation : page HTML complète déjà générée (la plus rapide).
//  - Contenu modifié depuis dans le dashboard : version /s/<slug>/ avec le contenu enregistré injecté.
define('LOORA', 1);
require __DIR__ . '/_lib.php';

$slug = is_string($_GET['slug'] ?? null) ? $_GET['slug'] : '';
$site = dirname(__DIR__);
if (!in_array($slug, LOORA_PRODUCTS, true)) {
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    readfile("$site/404.html");
    exit;
}

$live = load_store_json();
$built = @file_get_contents(__DIR__ . '/built.json');
$prerendered = "$site/produit/$slug/index.html";

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');

if ($built !== false && hash_equals(md5($built), md5($live)) && is_file($prerendered)) {
    readfile($prerendered);
    exit;
}

$html = @file_get_contents("$site/s/$slug/index.html");
if ($html === false) {
    http_response_code(404);
    readfile("$site/404.html");
    exit;
}

$store = json_decode($live);
// JSON_HEX_TAG : aucun « </script> » possible dans les textes
$json = json_encode($store ?: new stdClass(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP);
$head = "<script>window.__LOORA_STORE__=$json;</script>";

// Photo principale et fond de l'en-tête : téléchargés dès la lecture de la page
$product = $store->products->{$slug} ?? null;
$first = $product->images[0] ?? '';
if (is_string($first) && preg_match('#^/uploads/([\w-]+)\.\w+$#', $first, $m)) {
    $set = htmlspecialchars("/uploads/$m[1].m.webp 800w, $first 1600w", ENT_QUOTES, 'UTF-8');
    $head .= "<link rel=\"preload\" as=\"image\" fetchpriority=\"high\" imagesrcset=\"$set\" imagesizes=\"(max-width: 960px) 100vw, 600px\">";
}
$bg = ($store->logo->bgType ?? '') === 'image' ? ($store->logo->bgImage ?? '') : '';
foreach ([$bg, $store->logo->image ?? ''] as $img) {
    if (is_string($img) && preg_match('#^/uploads/[\w.-]+$#', $img)) {
        $head .= '<link rel="preload" as="image" href="' . htmlspecialchars($img, ENT_QUOTES, 'UTF-8') . '">';
    }
}
$html = str_replace('</head>', "$head</head>", $html);

if ($product && isset($product->type, $product->name)) {
    $title = htmlspecialchars("$product->type $product->name · LOORA", ENT_QUOTES, 'UTF-8');
    $html = preg_replace_callback('#<title>.*?</title>#s', function () use ($title) {
        return "<title>$title</title>";
    }, $html, 1);
}
echo $html;
