// 間隔反復: SM-2 を簡略化したもの。式が単純で挙動を説明しやすいことから採用(docs/DECISIONS.md D-006)。
export interface CardState {
  ease: number; // 易しさ係数 1.3〜
  interval: number; // 次回までの日数
  reps: number; // 連続正答回数
  due: number; // 次回予定(epoch ms)
  lapses: number; // 誤答回数
  last: number;
}

export const DAY = 86_400_000;

export function initialCard(now: number): CardState {
  return { ease: 2.5, interval: 0, reps: 0, due: now, lapses: 0, last: 0 };
}

/**
 * grade: 0=不正解, 1=難しかった, 2=普通, 3=簡単
 * 記述式は自動判定の得点率や自己評価をこの4段階に換算して渡す。
 */
export function review(card: CardState, grade: 0 | 1 | 2 | 3, now: number): CardState {
  const c = { ...card, last: now };
  if (grade === 0) {
    c.reps = 0;
    c.lapses += 1;
    c.interval = 0;
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.due = now + 10 * 60_000; // 10分後に再出題
    return c;
  }
  c.reps += 1;
  const q = grade + 2; // SM-2 の 3..5 に対応
  c.ease = Math.max(1.3, c.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  if (c.reps === 1) c.interval = grade === 3 ? 3 : 1;
  else if (c.reps === 2) c.interval = grade === 1 ? 3 : 6;
  else c.interval = Math.round(c.interval * c.ease * (grade === 1 ? 0.8 : grade === 3 ? 1.2 : 1));
  c.due = now + c.interval * DAY;
  return c;
}

/** 習得済みとみなす推定条件(実測ではなく推定値) */
export function isMastered(c: CardState | undefined): boolean {
  return Boolean(c && c.reps >= 3 && c.interval >= 14);
}

export function essayToGrade(score: number): 0 | 1 | 2 | 3 {
  if (score >= 0.95) return 3;
  if (score >= 0.7) return 2;
  if (score >= 0.4) return 1;
  return 0;
}
