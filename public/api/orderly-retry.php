<?php
// GET /api/orderly-retry : renvoie à Orderly les commandes dont le nouvel essai est arrivé à échéance.
// Appelé toutes les 10 minutes par une tâche planifiée (GitHub Actions). Sans paramètre : chaque
// commande garde son propre calendrier d'essais, l'appeler plus souvent ne crée aucun doublon.
define('LOORA', 1);
require __DIR__ . '/_lib.php';

only_methods(['GET', 'POST']);
json_out(['ok' => true, 'resent' => orderly_retry_due()]);
