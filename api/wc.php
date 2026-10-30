<?php
// Connexion dops : LOORA répond comme une boutique WooCommerce (API REST v3, lecture seule).
// Appelé par le .htaccess pour /wp-json/wc/v3/… ; clés à créer dans le dashboard (Connexions).
//   GET /wp-json/wc/v3/orders        commandes récentes (per_page, page, after, order)
//   GET /wp-json/wc/v3/orders/<id>
//   GET /wp-json/wc/v3/products      les 3 produits (SKU = identifiant de la page)
//   GET /wp-json/wc/v3/products/<id>
define('LOORA', 1);
require __DIR__ . '/_lib.php';

function woo_error($code, $message, $status)
{
    json_out(['code' => $code, 'message' => $message, 'data' => ['status' => $status]], $status);
}

/** Clé client / clé secrète : en Basic HTTP (comme dops) ou en paramètres d'URL */
function woo_credentials()
{
    $user = (string) ($_SERVER['PHP_AUTH_USER'] ?? '');
    $pass = (string) ($_SERVER['PHP_AUTH_PW'] ?? '');
    if ($user === '') {
        $header = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
        if (stripos($header, 'basic ') === 0) {
            $pair = explode(':', (string) base64_decode(substr($header, 6)), 2);
            $user = $pair[0];
            $pass = $pair[1] ?? '';
        }
    }
    if ($user === '') {
        $user = is_string($_GET['consumer_key'] ?? null) ? $_GET['consumer_key'] : '';
        $pass = is_string($_GET['consumer_secret'] ?? null) ? $_GET['consumer_secret'] : '';
    }
    return [$user, $pass];
}

$dops = load_settings()['dops'];
list($key, $secret) = woo_credentials();
if (!$dops['enabled'] || $dops['key'] === '' || !hash_equals($dops['key'], $key) || !hash_equals($dops['secret'], $secret)) {
    usleep(300000);
    woo_error('woocommerce_rest_cannot_view', 'Clés API invalides ou connexion désactivée dans le dashboard LOORA.', 401);
}
if (method() !== 'GET') {
    woo_error('rest_no_route', 'Lecture seule.', 405);
}

$route = trim(is_string($_GET['route'] ?? null) ? $_GET['route'] : '', '/');

/* ------------------------------------------------------------ Produits */

function woo_products()
{
    $store = load_store();
    $products = [];
    foreach (LOORA_PRODUCTS as $i => $slug) {
        $p = is_array($store['products'][$slug] ?? null) ? $store['products'][$slug] : [];
        $images = [];
        foreach (is_array($p['images'] ?? null) ? $p['images'] : [] as $src) {
            if (is_string($src) && strpos($src, '/uploads/') === 0) {
                $images[] = ['src' => site_url() . $src];
            } elseif (is_string($src) && strpos($src, 'https://') === 0) {
                $images[] = ['src' => $src];
            }
        }
        $products[] = [
            'id' => $i + 1,
            'name' => trim(($p['type'] ?? '') . ' ' . ($p['name'] ?? $slug)),
            'slug' => $slug,
            'sku' => !empty($p['sku']) && is_string($p['sku']) ? $p['sku'] : $slug,
            'permalink' => site_url() . "/produit/$slug/",
            'type' => 'simple',
            'status' => 'publish',
            'price' => (string) ($p['price'] ?? ''),
            'regular_price' => (string) ($p['compareAt'] ?? $p['price'] ?? ''),
            'sale_price' => (string) ($p['price'] ?? ''),
            'stock_quantity' => null,
            'images' => $images,
        ];
    }
    return $products;
}

if ($route === 'products' || preg_match('#^products/(\d+)$#', $route, $m)) {
    $products = woo_products();
    if (isset($m[1])) {
        foreach ($products as $p) {
            if ($p['id'] === (int) $m[1]) {
                json_out($p);
            }
        }
        woo_error('woocommerce_rest_product_invalid_id', 'Produit introuvable.', 404);
    }
    // Les 3 produits tiennent sur la première page
    $page = max(1, (int) ($_GET['page'] ?? 1));
    header('X-WP-Total: ' . count($products));
    header('X-WP-TotalPages: 1');
    json_out($page === 1 ? $products : []);
}

/* ------------------------------------------------------------ Commandes */

if ($route === 'orders' || preg_match('#^orders/(\d+)$#', $route, $m)) {
    $orders = array_map('woo_order', with_orders_lock('read_orders'));
    if (isset($m[1])) {
        foreach ($orders as $o) {
            if ($o['id'] === (int) $m[1]) {
                json_out($o);
            }
        }
        woo_error('woocommerce_rest_shop_order_invalid_id', 'Commande introuvable.', 404);
    }

    $after = is_string($_GET['after'] ?? null) ? strtotime($_GET['after']) : false;
    if ($after !== false) {
        $orders = array_values(array_filter($orders, function ($o) use ($after) {
            return strtotime($o['date_created']) > $after;
        }));
    }
    // Le fichier est déjà dans l'ordre d'arrivée
    if (strtolower((string) ($_GET['order'] ?? 'desc')) !== 'asc') {
        $orders = array_reverse($orders);
    }
    $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 10)));
    $page = max(1, (int) ($_GET['page'] ?? 1));
    header('X-WP-Total: ' . count($orders));
    header('X-WP-TotalPages: ' . max(1, (int) ceil(count($orders) / $perPage)));
    json_out(array_slice($orders, ($page - 1) * $perPage, $perPage));
}

woo_error('rest_no_route', 'Aucune route ne correspond.', 404);
