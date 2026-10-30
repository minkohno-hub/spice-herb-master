import type { AnswerRecord, Question, QuestionFormat, SrsState } from "./types";
import { isDue } from "./srs";

/**
 * 演習プールの生成（監査C-01是正）。従来は「全verifiedの逐次再生」しかなく、
 * 章別・節別・難易度別・形式別の絞り込みも、未回答・誤答・苦手・ブックマーク・
 * 復習期限・記述式といった学習フォーカスも演習画面に存在しなかった。
 * 苦手フォーカスはユーザー要望対応（2026-10-30、DECISIONS #35）で追加した:
 * 1回だけの間違い（誤答フォーカス）と区別し、繰り返し間違えている問題を指す。
 * ここは純粋関数として切り出し、演習画面とテストで共有する。
 */
export type PracticeFocus = "all" | "unanswered" | "wrong" | "weak" | "favorites" | "due" | "essay";

export const FOCUS_LABELS: Record<PracticeFocus, string> = {
  all: "すべて",
  unanswered: "未回答のみ",
  wrong: "誤答の復習（直近の回答が不正解）",
  weak: "苦手（2回以上回答し正答率50%未満）",
  favorites: "ブックマークのみ",
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
  // 苦手フォーカス用に、問題ごとの通算（回答回数・正解数）も数える。
  // 記述式など自動採点で correct が null の記録は「回答したが正解ではない」として扱う。
  const totalsByQuestion = new Map<string, { attempts: number; correct: number }>();
  for (const r of ctx.records) {
    const t = totalsByQuestion.get(r.questionId) ?? { attempts: 0, correct: 0 };
    t.attempts += 1;
    if (r.correct === true) t.correct += 1;
    totalsByQuestion.set(r.questionId, t);
  }
  return questions.filter((q) => {
    if (filters.chapterIds.length > 0 && !filters.chapterIds.includes(q.chapterId)) return false;
    if (filters.sectionId && q.sectionId !== filters.sectionId) return false;
    if (filters.difficulties.length > 0 && !filters.difficulties.includes(q.difficulty)) return false;
    if (filters.formats.length > 0 && !filters.formats.includes(q.format)) return false;
    switch (filters.focus) {
      case "unanswered": return !lastByQuestion.has(q.id);
      case "wrong": return lastByQuestion.get(q.id)?.correct === false;
      case "weak": { const t = totalsByQuestion.get(q.id); return !!t && t.attempts >= 2 && t.correct / t.attempts < 0.5; }
      case "favorites": return ctx.favorites.includes(q.id);
      case "due": { const s = ctx.srs[q.id]; return !!s && isDue(s); }
      case "essay": return ESSAY_FORMATS.includes(q.format);
      default: return true;
    }
  });
}
