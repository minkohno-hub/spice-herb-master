
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
/** 自己評価の語彙（AnswerRecord.selfEval と同一）。フラッシュカードの自己評価UIが使う（docs/DECISIONS.md #32）。 */
export type CardSelfEval = "known" | "unsure" | "unknown";
/** 自己評価→SM-2 quality の写像: 分かった=5（完全想起）/ あいまい=3（困難を伴う想起。下限の合格品質）/ 分からない=1（不正解相当）。 */
export function qualityFromSelfEval(selfEval: CardSelfEval): number { return selfEval==="known" ? 5 : selfEval==="unsure" ? 3 : 1; }
export function qualityFromResult(correct: boolean|null, scoreRatio: number|null, selfEval?: string|null): number {
  if (selfEval==="known"||selfEval==="unsure"||selfEval==="unknown") return qualityFromSelfEval(selfEval);
  if (correct) return 5; if (scoreRatio!=null && scoreRatio>=0.5) return 3; return 1;
}
/**
 * フラッシュカードの自己評価を SRS 状態へ反映する（docs/DECISIONS.md #32）。
 * 保存先は演習と共通の store.srs で、キーはカードID（全件 "card-" 接頭辞で問題IDと名前空間が分離され、
 * 演習由来の状態と競合・上書きしない）。解答記録（records）には追加しない
 * （分析の総解答数・正答率は演習の解答だけから決まるため、カード評価で歪めない）。
 */
export function applyCardReview(current: SrsState|undefined, cardId: string, selfEval: CardSelfEval, now = new Date()): SrsState {
  return reviewSrs(current ?? initSrs(cardId, now), qualityFromSelfEval(selfEval), now);
}
export function isDue(s: SrsState, now = new Date()): boolean { return new Date(s.dueAt) <= now; }
