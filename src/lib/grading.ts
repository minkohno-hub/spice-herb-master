import type { Question, RubricPoint } from './types';

// 表記揺れの正規化(全角半角・カタカナ/ひらがな・記号・空白)。scripts/generate.mjs の norm と同じ規則。
export function norm(s: string): string {
  return String(s)
    .normalize('NFKC')
    .replace(/[\s・、。,.()()「」『』〜~ー-]/g, '')
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .toLowerCase();
}

/** 用語入力: 正答または別解と正規化後に一致すれば正解 */
export function gradeInput(q: Pick<Question, 'answer' | 'alt'>, input: string): boolean {
  const v = norm(input);
  if (!v) return false;
  return [q.answer, ...(q.alt ?? [])].some((a) => norm(a) === v);
}

export interface EssayResult {
  points: { label: string; hit: boolean; matched?: string; src: string }[];
  score: number; // 0..1(自動判定の推定値。確定値ではない)
  empty: boolean;
}

/** 記述式: 要点ごとにキーワードを含むかを判定する。意味理解はしないため推定値として扱う。 */
export function gradeEssay(rubric: RubricPoint[], text: string): EssayResult {
  const t = norm(text);
  const points = rubric.map((r) => {
    const matched = r.keywords.find((k) => k && t.includes(norm(k)));
    return { label: r.label, hit: Boolean(matched), matched, src: r.src };
  });
  const hit = points.filter((p) => p.hit).length;
  return { points, score: rubric.length ? hit / rubric.length : 0, empty: t.length === 0 };
}

export function gradeChoice(q: Pick<Question, 'answer'>, choice: string): boolean {
  return norm(choice) === norm(q.answer);
}

export function gradeMatch(q: Question, picks: string[]): boolean {
  return (q.pairs ?? []).every((p, i) => picks[i] === p.right);
}

export function gradeOrder(q: Question, ids: string[]): boolean {
  return ids.join(',') === q.answer;
}
