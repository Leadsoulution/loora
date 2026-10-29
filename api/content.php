<?php
// GET /api/content : contenu public du site (textes, prix, images, couleurs).
define('LOORA', 1);
require __DIR__ . '/_lib.php';

only_methods(['GET']);
raw_json_out(load_store_json());
