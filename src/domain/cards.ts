import type { Flashcard, FlashcardKind } from "./types";

/**
 * フラッシュカードの種別判定と絞り込み（FIX1、DECISIONS #34）。
 * kind が設定済みのカードはその値を、未設定の既存カード（サンプル等）は
 * ID 接頭辞から判定する（後方互換）。
 * - "card-term-" → term（用語: 表=名称、裏=要点）
 * - "card-rev-" → reverse（逆引き: 表=事実、裏=名称）
 * - "card-profile-" → profile（プロフィール全文）
 * - それ以外 → qa（一問一答）
 */
export function cardKindOf(card: Flashcard): FlashcardKind {
  if (card.kind) return card.kind;
  if (card.id.startsWith("card-term-")) return "term";
  if (card.id.startsWith("card-rev-")) return "reverse";
  if (card.id.startsWith("card-profile-")) return "profile";
  return "qa";
}

export const CARD_KIND_LABELS: Record<FlashcardKind, string> = {
  qa: "一問一答",
  profile: "プロフィール",
  term: "用語",
  reverse: "逆引き",
};

export interface CardFilter {
  /** null = 全種別 */
  kind: FlashcardKind | null;
  /** null = 全章 */
  chapterId: string | null;
}

/** 種別・章で絞り込む。入力の並び順は保持する（シャッフルは呼び出し側の責務）。 */
export function filterCards(cards: readonly Flashcard[], filter: CardFilter): Flashcard[] {
  return cards.filter((c) =>
    (filter.kind === null || cardKindOf(c) === filter.kind) &&
    (filter.chapterId === null || c.chapterId === filter.chapterId));
}

/** カード群の種別別件数（フィルタの選択肢表示用）。 */
export function countCardsByKind(cards: readonly Flashcard[]): Record<FlashcardKind, number> {
  const counts: Record<FlashcardKind, number> = { qa: 0, profile: 0, term: 0, reverse: 0 };
  for (const c of cards) counts[cardKindOf(c)]++;
  return counts;
}
