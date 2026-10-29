// Connexions des commandes avec d'autres applications (réglages du dashboard, voir public/api/admin/integrations.php).

export type Integrations = {
  /** dops lit les commandes comme une boutique WooCommerce et est prévenue à chaque commande */
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
  dops: { enabled: false, key: "", secret: "", webhook: "", lastSuccess: "", lastError: "" },
  webhook: "",
};
