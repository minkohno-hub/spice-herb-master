/**
 * 第3回監査（2026-10-30）の回帰テスト: 記述式採点の全件自己整合性。
 * 監査用プロンプト §7 のテストケースを実データ（正式問題の記述式全23問）で固定する。
 * - 全記述式の模範解答は自問のルーブリックで満点（ratio 1）になること
 * - 空白のみの回答は0点であること
 * - 模範解答に改行を挟んでも満点のままであること
 * - 自動採点は correct を断定しない（AD-1: 満点でも correct は null、自己採点で確定）
 */
import { describe, it, expect } from "vitest";
import { FORMAL_QUESTIONS } from "../src/data/formal-questions";
import { gradeEssayRubric } from "../src/domain/grading";

const ESSAYS = FORMAL_QUESTIONS.filter(
  (q) => q.format === "short-essay" || q.format === "long-essay" || q.format === "compare-essay",
);

describe("第3回監査: 記述式の全件自己整合性", () => {
  it("記述式は23問ある", () => {
    expect(ESSAYS.length).toBe(23);
  });

  it("全記述式の模範解答が自問のルーブリックで満点になる", () => {
    for (const q of ESSAYS) {
      const r = gradeEssayRubric(q.rubric!, q.modelAnswer!);
      expect(r.scoreRatio, q.id).toBe(1);
      expect(r.missedRequiredIds, q.id).toEqual([]);
    }
  });

  it("空白のみの回答は全記述式で0点", () => {
    for (const q of ESSAYS) {
      expect(gradeEssayRubric(q.rubric!, " 　 ").scoreRatio, q.id).toBe(0);
    }
  });

  it("模範解答に改行を挟んでも満点のまま", () => {
    for (const q of ESSAYS) {
      const withNewlines = q.modelAnswer!.split("。").join("。\n");
      expect(gradeEssayRubric(q.rubric!, withNewlines).scoreRatio, q.id).toBe(1);
    }
  });

  it("満点でも自動採点は correct を断定しない（AD-1）", () => {
    for (const q of ESSAYS) {
      expect(gradeEssayRubric(q.rubric!, q.modelAnswer!).correct, q.id).toBeNull();
    }
  });
});
