<?php
// Réglages du serveur PHP.

if (!defined('LOORA')) {
    http_response_code(404);
    exit;
}

// Mot de passe du dashboard (empreinte, jamais en clair) : à changer avec  npm run password -- "nouveau mot de passe"
const ADMIN_SALT = 'ffb9343d3473fb99a1082339f9b680b5';
const ADMIN_HASH = 'f782516e3bccd7a4c57da934ade6f581c43241d0bcc853c9984b2f97b85a80cc';
const ADMIN_ITERATIONS = 100000;

// Optionnel : URL qui reçoit chaque commande (Google Sheets via Apps Script, Zapier, Make…). Vide = désactivé.
const ORDER_WEBHOOK_URL = '';
