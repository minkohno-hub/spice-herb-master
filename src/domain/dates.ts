/**
 * 端末ローカルの日付キー（YYYY-MM-DD）。監査C-09是正:
 * answeredAt は UTC の ISO 文字列のため、toISOString().slice(0,10) で「今日」を
 * 求めると JST では午前9時に日付が切り替わってしまう。集計は端末のローカル日付で揃える。
 */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function dateKeyOfIso(iso: string): string { return localDateKey(new Date(iso)); }
export function todayKey(): string { return localDateKey(new Date()); }
