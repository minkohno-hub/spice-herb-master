import { describe, it, expect } from "vitest";
import { buildPracticePool, DEFAULT_PRACTICE_FILTERS, type PracticeFilters } from "../src/domain/practice";
import type { AnswerRecord, Question, SrsState } from "../src/domain/types";
import { initSrs } from "../src/domain/srs";

const mkQ = (id: string, patch: Partial<Question> = {}): Question => ({
  id, version: 1, format: "one-answer", status: "verified",
  chapterId: "ch1", sectionId: "ch1-1", difficulty: 1,
  prompt: id, explanation: "x", knowledgeUnitIds: [], sourceRefs: [],
  ...patch,
});
const rec = (questionId: string, correct: boolean | null): AnswerRecord => ({
  questionId, answeredAt: "2026-10-30T00:00:00.000Z", correct, scoreRatio: correct ? 1 : 0,
  autoScoreRatio: correct ? 1 : 0, selfScoreRatio: null, responseMs: 1000,
});
const F = (patch: Partial<PracticeFilters> = {}): PracticeFilters => ({ ...DEFAULT_PRACTICE_FILTERS, ...patch });
const CTX = { records: [] as AnswerRecord[], srs: {} as Record<string, SrsState>, favorites: [] as string[] };

describe("buildPracticePool (C-01)", () => {
  const qs = [
    mkQ("a"),
    mkQ("b", { chapterId: "ch2", sectionId: "ch2-1", difficulty: 3, format: "single-choice" }),
    mkQ("c", { format: "short-essay" }),
    mkQ("d", { difficulty: 2 }),
  ];
  it("条件なしでは全件を入力順で返す", () => {
    expect(buildPracticePool(qs, F(), CTX).map((q) => q.id)).toEqual(["a", "b", "c", "d"]);
  });
  it("章・節・難易度・形式は次元内OR／次元間ANDで絞る", () => {
    expect(buildPracticePool(qs, F({ chapterIds: ["ch2"] }), CTX).map((q) => q.id)).toEqual(["b"]);
    expect(buildPracticePool(qs, F({ sectionId: "ch1-1", difficulties: [1, 2] }), CTX).map((q) => q.id)).toEqual(["a", "c", "d"]);
    expect(buildPracticePool(qs, F({ formats: ["single-choice", "short-essay"] }), CTX).map((q) => q.id)).toEqual(["b", "c"]);
  });
  it("未回答フォーカスは記録のない問題だけ", () => {
    const ctx = { ...CTX, records: [rec("a", true)] };
    expect(buildPracticePool(qs, F({ focus: "unanswered" }), ctx).map((q) => q.id)).toEqual(["b", "c", "d"]);
  });
  it("誤答フォーカスは直近の記録が不正解の問題だけ（再正解した問題は外れる）", () => {
    const ctx = { ...CTX, records: [rec("a", false), rec("b", false), rec("b", true), rec("c", null)] };
    expect(buildPracticePool(qs, F({ focus: "wrong" }), ctx).map((q) => q.id)).toEqual(["a"]);
  });
  it("お気に入り・記述式フォーカス", () => {
    const ctx = { ...CTX, favorites: ["d", "b"] };
    expect(buildPracticePool(qs, F({ focus: "favorites" }), ctx).map((q) => q.id)).toEqual(["b", "d"]);
    expect(buildPracticePool(qs, F({ focus: "essay" }), CTX).map((q) => q.id)).toEqual(["c"]);
  });
  it("復習期限フォーカスは期限到来のSRSがある問題だけ", () => {
    const due = initSrs("a"); due.dueAt = "2020-01-01T00:00:00.000Z";
    const notDue = initSrs("b"); notDue.dueAt = "2999-01-01T00:00:00.000Z";
    const ctx = { ...CTX, srs: { a: due, b: notDue } };
    expect(buildPracticePool(qs, F({ focus: "due" }), ctx).map((q) => q.id)).toEqual(["a"]);
  });
});
