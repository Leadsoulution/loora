<?php
// GET /api/admin/orders : liste (JSON, ou CSV avec ?format=csv). PATCH : statut/note. DELETE : suppression.
define('LOORA', 1);
require __DIR__ . '/../_lib.php';

only_methods(['GET', 'PATCH', 'DELETE']);
require_admin();

if (method() === 'GET') {
    $orders = array_reverse(with_orders_lock('read_orders'));
    if (($_GET['format'] ?? '') !== 'csv') {
        json_out($orders);
    }

    // Export CSV (séparateur « ; » et BOM UTF-8 pour Excel)
    $cell = function ($v) {
        return '"' . str_replace('"', '""', (string) $v) . '"';
    };
    $date = function ($iso) {
        try {
            $d = new DateTime((string) $iso);
            $d->setTimezone(new DateTimeZone('Africa/Casablanca'));
            return $d->format('d/m/Y H:i:s');
        } catch (Exception $e) {
            return (string) $iso;
        }
    };
    $extra = function ($o) {
        $parts = [];
        foreach (is_array($o['extra'] ?? null) ? $o['extra'] : [] as $x) {
            $parts[] = ($x['label'] ?? '') . ': ' . ($x['value'] ?? '');
        }
        return implode(' | ', $parts);
    };
    $headers = ['Référence', 'Date', 'Statut', 'Nom', 'Téléphone', 'Ville', 'Adresse', 'Produit', 'Métal', 'Taille', 'Quantité', 'Total (DH)', 'Autres champs', 'Note'];
    $rows = [implode(';', array_map($cell, $headers))];
    foreach ($orders as $o) {
        $rows[] = implode(';', array_map($cell, [
            $o['ref'] ?? '',
            $date($o['createdAt'] ?? ''),
            ORDER_STATUSES[$o['status']],
            $o['name'] ?? '',
            $o['phone'] ?? '',
            $o['city'] ?? '',
            $o['address'] ?? '',
            $o['product'] ?? '',
            $o['metal'] ?? '',
            $o['size'] ?? '',
            $o['qty'] ?? '',
            $o['total'] ?? '',
            $extra($o),
            $o['note'] ?? '',
        ]));
    }

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="commandes-loora.csv"');
    header('Cache-Control: no-store');
    echo "\xEF\xBB\xBF" . implode("\r\n", $rows);
    exit;
}

$body = read_json_body() ?? [];
$ref = str_val($body['ref'] ?? '', 100);

if (method() === 'PATCH') {
    $order = with_orders_lock(function () use ($ref, $body) {
        $orders = read_orders();
        foreach ($orders as $i => $o) {
            if (($o['ref'] ?? null) !== $ref) {
                continue;
            }
            if (is_string($body['status'] ?? null) && isset(ORDER_STATUSES[$body['status']])) {
                $orders[$i]['status'] = $body['status'];
            }
            if (array_key_exists('note', $body) && (is_scalar($body['note']) || $body['note'] === null)) {
                $orders[$i]['note'] = mb_substr((string) $body['note'], 0, 2000);
            }
            $orders[$i]['updatedAt'] = iso_now();
            write_orders($orders);
            return $orders[$i];
        }
        return null;
    });
    if ($order === null) {
        json_out(['error' => 'Commande introuvable.'], 404);
    }
    json_out($order);
}

// DELETE
$deleted = with_orders_lock(function () use ($ref) {
    $orders = read_orders();
    $next = array_values(array_filter($orders, function ($o) use ($ref) {
        return ($o['ref'] ?? null) !== $ref;
    }));
    if (count($next) === count($orders)) {
        return false;
    }
    write_orders($next);
    return true;
});
if (!$deleted) {
    json_out(['error' => 'Commande introuvable.'], 404);
}
json_out(['ok' => true]);
