// Connexions des commandes avec d'autres applications (réglages du dashboard, voir public/api/admin/integrations.php).

export type Integrations = {
  /** Orderly (dops) par « formulaire web » : chaque commande est envoyée à cette adresse (clé incluse) */
  orderly: {
    url: string;
    /** Dernier envoi réussi / dernière erreur (date ISO — message) */
    lastSuccess: string;
    lastError: string;
    /** Secret du webhook créé dans Orderly → Paramètres → Webhooks : Orderly renvoie les statuts à LOORA */
    hookSecret: string;
    /** Dernier statut reçu / dernière erreur (date ISO — message) */
    hookLast: string;
    hookError: string;
  };
  /** Ancienne méthode : dops lit les commandes comme une boutique WooCommerce et est prévenue à chaque commande */
  dops: {
    enabled: boolean;
    /** Clé client (ck_…) et clé secrète (cs_…) à coller dans dops */
    key: string;
    secret: string;
    /** Adresse « webhook WooCommerce » de dops */
    webhook: string;
    /** Dernier envoi réussi / dernière erreur (date ISO, suivie du message) */
    lastSuccess: string;
    lastError: string;
  };
  /** Autre application : reçoit chaque commande en JSON (vide = désactivé) */
  webhook: string;
};

export const DEFAULT_INTEGRATIONS: Integrations = {
  orderly: { url: "", lastSuccess: "", lastError: "", hookSecret: "", hookLast: "", hookError: "" },
  dops: { enabled: false, key: "", secret: "", webhook: "", lastSuccess: "", lastError: "" },
  webhook: "",
};
