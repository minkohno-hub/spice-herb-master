import type { AnswerRecord, Question, QuestionFormat, SrsState } from "./types";
import { isDue } from "./srs";

/**
 * 演習プールの生成（監査C-01是正）。従来は「全verifiedの逐次再生」しかなく、
 * 章別・節別・難易度別・形式別の絞り込みも、未回答・誤答・お気に入り・復習期限・
 * 記述式といった学習フォーカスも演習画面に存在しなかった。
 * ここは純粋関数として切り出し、演習画面とテストで共有する。
 */
export type PracticeFocus = "all" | "unanswered" | "wrong" | "favorites" | "due" | "essay";

export const FOCUS_LABELS: Record<PracticeFocus, string> = {
  all: "すべて",
  unanswered: "未回答のみ",
  wrong: "誤答の復習（直近の回答が不正解）",
  favorites: "お気に入りのみ",
  due: "復習期限が来たもののみ",
  essay: "記述式のみ",
};

export const ESSAY_FORMATS: readonly QuestionFormat[] = ["short-essay", "long-essay", "compare-essay", "composite"];
export const PRACTICE_DIFFICULTIES: readonly number[] = [1, 2, 3, 4];

export interface PracticeFilters {
  chapterIds: string[];
  sectionId: string | null;
  difficulties: number[];
  formats: QuestionFormat[];
  focus: PracticeFocus;
}

export const DEFAULT_PRACTICE_FILTERS: PracticeFilters = {
  chapterIds: [],
  sectionId: null,
  difficulties: [],
  formats: [],
  focus: "all",
};

export interface PracticeContext {
  records: readonly AnswerRecord[];
  srs: Readonly<Record<string, SrsState>>;
  favorites: readonly string[];
}

export function buildPracticePool(
  questions: readonly Question[],
  filters: PracticeFilters,
  ctx: PracticeContext,
): Question[] {
  // records は時系列の追記順である前提で、問題ごとの直近の記録を取る。
  const lastByQuestion = new Map<string, AnswerRecord>();
  for (const r of ctx.records) lastByQuestion.set(r.questionId, r);
  return questions.filter((q) => {
    if (filters.chapterIds.length > 0 && !filters.chapterIds.includes(q.chapterId)) return false;
    if (filters.sectionId && q.sectionId !== filters.sectionId) return false;
    if (filters.difficulties.length > 0 && !filters.difficulties.includes(q.difficulty)) return false;
    if (filters.formats.length > 0 && !filters.formats.includes(q.format)) return false;
    switch (filters.focus) {
      case "unanswered": return !lastByQuestion.has(q.id);
      case "wrong": return lastByQuestion.get(q.id)?.correct === false;
      case "favorites": return ctx.favorites.includes(q.id);
      case "due": { const s = ctx.srs[q.id]; return !!s && isDue(s); }
      case "essay": return ESSAY_FORMATS.includes(q.format);
      default: return true;
    }
  });
}
