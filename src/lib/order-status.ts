// Statuts des commandes (utilisables côté client et serveur).

export const ORDER_STATUSES = [
  { value: "a_confirmer", label: "À confirmer", color: "#b7791f" },
  { value: "confirmee", label: "Confirmée", color: "#2b6cb0" },
  { value: "expediee", label: "Expédiée", color: "#6b46c1" },
  { value: "livree", label: "Livrée", color: "#2f855a" },
  { value: "annulee", label: "Annulée", color: "#9b2c2c" },
  { value: "retour", label: "Retour", color: "#718096" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];
