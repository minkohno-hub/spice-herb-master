
import type { SrsState } from "./types";
export function initSrs(itemId: string, now = new Date()): SrsState { return { itemId, easeFactor: 2.5, intervalDays: 0, repetitions: 0, dueAt: now.toISOString(), lastReviewedAt: null }; }
/** SM-2系: quality 0-5。不正解(quality<3)で repetitions リセット・翌日、ease は下限1.3。説明可能性のため古典的SM-2式をそのまま使う。 */
export function reviewSrs(state: SrsState, quality: number, now = new Date()): SrsState {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  let { easeFactor, intervalDays, repetitions } = state;
  if (q < 3) { repetitions = 0; intervalDays = 1; }
  else { repetitions += 1; intervalDays = repetitions===1 ? 1 : repetitions===2 ? 6 : Math.round(intervalDays * easeFactor); easeFactor = Math.max(1.3, easeFactor + (0.1 - (5-q)*(0.08 + (5-q)*0.02))); }
  const due = new Date(now); due.setDate(due.getDate() + intervalDays);
  return { itemId: state.itemId, easeFactor, intervalDays, repetitions, dueAt: due.toISOString(), lastReviewedAt: now.toISOString() };
}
export function qualityFromResult(correct: boolean|null, scoreRatio: number|null, selfEval?: string|null): number {
  if (selfEval==="known") return 5; if (selfEval==="unknown") return 1;
  if (correct) return 5; if (scoreRatio!=null && scoreRatio>=0.5) return 3; return 1;
}
export function isDue(s: SrsState, now = new Date()): boolean { return new Date(s.dueAt) <= now; }
