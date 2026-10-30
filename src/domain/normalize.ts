
export function normalizeText(s: string): string {
  let t = s.normalize("NFKC").toLowerCase().trim();
  // 監査B-06是正: カタカナをひらがなへ畳み込み、かな表記の違いで正しい回答が
  // 誤答と断定される事態を防ぐ（濁点は合成済みコードポイントのまま移る）。
  t = t.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  t = t.replace(/[\s　]+/g, "");
  t = t.replace(/[。、,.・:：;；!！?？「」『』（）()\[\]"'’]/g, "");
  // カタカナ長音・表記揺れの軽い吸収（過剰な同一視はしない）
  t = t.replace(/ー/g, "");
  return t;
}
export function includesNormalized(haystack: string, needle: string): boolean {
  if (!needle) return false; return normalizeText(haystack).includes(normalizeText(needle));
}
