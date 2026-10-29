<?php
// Fiche produit : renvoie la page HTML générée avec le contenu enregistré déjà inclus,
// pour un affichage immédiat (appelé par le .htaccess pour /produit/<slug>/).
define('LOORA', 1);
require __DIR__ . '/_lib.php';

$slug = is_string($_GET['slug'] ?? null) ? $_GET['slug'] : '';
$html = in_array($slug, LOORA_PRODUCTS, true) ? @file_get_contents(dirname(__DIR__) . "/produit/$slug/index.html") : false;
if ($html === false) {
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    readfile(dirname(__DIR__) . '/404.html');
    exit;
}

$store = json_decode(load_store_json());
// JSON_HEX_TAG : aucun « </script> » possible dans les textes
$json = json_encode($store ?: new stdClass(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP);
$html = str_replace('</head>', "<script>window.__LOORA_STORE__=$json;</script></head>", $html);

$product = $store->products->{$slug} ?? null;
if ($product && isset($product->type, $product->name)) {
    $title = htmlspecialchars("$product->type $product->name · LOORA", ENT_QUOTES, 'UTF-8');
    $html = preg_replace_callback('#<title>.*?</title>#s', function () use ($title) {
        return "<title>$title</title>";
    }, $html, 1);
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');
echo $html;
