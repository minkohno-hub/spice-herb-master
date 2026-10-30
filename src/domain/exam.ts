import { gradeQuestion, type GradeResult } from "./grading";
import { seededShuffle } from "./shuffle";
import type { Question, QuestionFormat } from "./types";

/**
 * 模擬試験の純粋ロジック（FIX1で実働化、DECISIONS #34）。
 * 模試は演習の即時採点フローとは分離し、終了時に gradeQuestion を一括適用する。
 *
 * 対象形式: 記述系4形式（short-essay / long-essay / compare-essay / composite）は
 * 採点に自己採点分離の仕様（DECISIONS #6）が絡むため、時間制の自動採点模試には
 * 含めない。それ以外の形式は全て対象（写真識別・フラッシュカードは正式問題が
 * 存在しないため自然に対象外）。
 * 問題数: 制限時間（分）×2問、上限100問、プール件数が上限。
 */
export const EXAM_EXCLUDED_FORMATS: readonly QuestionFormat[] = ["short-essay", "long-essay", "compare-essay", "composite"];
export const EXAM_MAX_QUESTIONS = 100;
export const EXAM_QUESTIONS_PER_MINUTE = 2;

export function examQuestionCount(minutes: number, poolSize: number): number {
  const byTime = Math.max(1, Math.floor(minutes) * EXAM_QUESTIONS_PER_MINUTE);
  return Math.max(0, Math.min(byTime, EXAM_MAX_QUESTIONS, poolSize));
}

/** 模試の対象プール（verified かつ対象形式のみ）。入力順は保持する。 */
export function examPool(questions: readonly Question[]): Question[] {
  return questions.filter((q) => q.status === "verified" && !EXAM_EXCLUDED_FORMATS.includes(q.format));
}

/** 制限時間に見合う問題数を決定的にシャッフル抽出する。 */
export function buildExam(questions: readonly Question[], minutes: number, seed: string): Question[] {
  const pool = examPool(questions);
  const count = examQuestionCount(minutes, pool.length);
  return seededShuffle(pool, seed).slice(0, count);
}

export interface ExamGradedItem {
  question: Question;
  answer: unknown;
  answered: boolean;
  result: GradeResult;
}

export interface ExamGradeSummary {
  items: ExamGradedItem[];
  total: number;
  answeredCount: number;
  correctCount: number;
  /** 正答率（0〜1）。correct が null（採点保留）の問題は不正解として数える。 */
  accuracy: number;
  /** scoreRatio の平均（0〜1）。 */
  averageScoreRatio: number;
  wrongItems: ExamGradedItem[];
}

/**
 * 終了時の一括採点。未回答（answers にキーがない、または値が undefined）は
 * gradeQuestion を呼ばず不正解（scoreRatio 0、note「未回答」）として扱う。
 */
export function gradeExam(questions: readonly Question[], answers: Record<string, unknown>): ExamGradeSummary {
  const items: ExamGradedItem[] = questions.map((question) => {
    const has = Object.prototype.hasOwnProperty.call(answers, question.id) && answers[question.id] !== undefined;
    if (!has) {
      return {
        question,
        answer: undefined,
        answered: false,
        result: { correct: false, scoreRatio: 0, autoScoreRatio: 0, matchedPointIds: [], missedRequiredIds: [], note: "未回答" },
      };
    }
    return { question, answer: answers[question.id], answered: true, result: gradeQuestion(question, answers[question.id]) };
  });
  const total = items.length;
  const correctCount = items.filter((i) => i.result.correct === true).length;
  const ratioSum = items.reduce((s, i) => s + i.result.scoreRatio, 0);
  return {
    items,
    total,
    answeredCount: items.filter((i) => i.answered).length,
    correctCount,
    accuracy: total ? correctCount / total : 0,
    averageScoreRatio: total ? ratioSum / total : 0,
    wrongItems: items.filter((i) => i.result.correct !== true),
  };
}
