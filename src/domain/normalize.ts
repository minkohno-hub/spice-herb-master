
export function normalizeText(s: string): string {
  let t = s.normalize("NFKC").toLowerCase().trim();
  t = t.replace(/[\s　]+/g, "");
  t = t.replace(/[。、,.・:：;；!！?？「」『』（）()\[\]"'’]/g, "");
  // カタカナ長音・表記揺れの軽い吸収（過剰な同一視はしない）
  t = t.replace(/ー/g, "");
  return t;
}
export function includesNormalized(haystack: string, needle: string): boolean {
  if (!needle) return false; return normalizeText(haystack).includes(normalizeText(needle));
}
