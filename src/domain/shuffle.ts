/**
 * 決定的シャッフル（FIX1、DECISIONS #34）。
 * 文字列シードから FNV-1a ハッシュ → mulberry32 PRNG で Fisher-Yates を行う。
 * 同じシード・同じ入力順なら常に同じ結果になる（テストで再現可能）。
 * 入力配列は変更しない。
 */
export function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const out = [...items];
  let state = fnv1a(seed) || 1;
  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}
