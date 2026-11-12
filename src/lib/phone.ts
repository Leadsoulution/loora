/** Numéro marocain : chiffres arabes acceptés, 06/07/05 + 8 chiffres ; null si invalide */
export function normalizePhone(value: string) {
  const v = value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\s\-.()]/g, "");
  const m = /^(?:\+212|00212|212|0)([5-7]\d{8})$/.exec(v);
  if (!m) return null;
  const rest = m[1].slice(1);
  if (/^(\d)\1+$/.test(rest) || rest === "12345678" || rest === "87654321") return null;
  return `0${m[1]}`;
}
