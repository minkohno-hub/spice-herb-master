import { describe, it, expect } from "vitest";
import { APP_DATA_SUMMARY as S } from "../src/data/summary";
import { QUESTIONS, CARDS, SAMPLE_QUESTIONS, SAMPLE_CARDS, KNOWLEDGE_UNITS } from "../src/data/questions";
import { IMPORTED_KNOWLEDGE_UNITS, KNOWLEDGE_IMPORT_META } from "../src/data/knowledge";
import { TRANSCRIPT_BY_PAGE, TRANSCRIPT_PAGES } from "../src/data/transcripts";
import manifest from "../src/data/source-manifest.json";

// バンドル分割バッチE1（docs/DECISIONS.md #23）: 初期表示用の軽量サマリが
// 実データと常に一致することを固定する。データ側が変わればここが失敗する。
describe("軽量サマリ（E1: 初期表示の件数表示）", () => {
  it("問題・カード件数が実データと一致する", () => {
    expect(S.formalQuestions).toBe(QUESTIONS.length);
    expect(S.formalCards).toBe(CARDS.length);
    expect(S.sampleQuestions).toBe(SAMPLE_QUESTIONS.length);
    expect(S.sampleCards).toBe(SAMPLE_CARDS.length);
  });
  it("知識単位の件数・照合状態が実データと一致する", () => {
    expect(S.importedKnowledgeUnits).toBe(IMPORTED_KNOWLEDGE_UNITS.length);
    expect(S.verifiedImportedKnowledgeUnits).toBe(IMPORTED_KNOWLEDGE_UNITS.filter((u) => u.status === "verified").length);
    expect(S.unverifiedImportedKnowledgeUnits).toBe(IMPORTED_KNOWLEDGE_UNITS.filter((u) => u.status === "unverified").length);
    expect(S.draftQaTotal).toBe(KNOWLEDGE_IMPORT_META.draftQaTotal);
    expect(S.knowledgeImportOrigin).toBe(KNOWLEDGE_IMPORT_META.origin);
    expect(S.verifiedKnowledgeUnits).toBe(KNOWLEDGE_UNITS.length);
  });
  it("転記ページ数と manifest 件数が実データと一致する", () => {
    // 転記ページ数は重複を除いたページ数（レコード数は同ページ開始の節の分割で増える）
    expect(S.transcribedPages).toBe(TRANSCRIPT_BY_PAGE.size);
    expect(TRANSCRIPT_PAGES.length).toBeGreaterThanOrEqual(S.transcribedPages);
    expect(S.presentImages).toBe(manifest.totalPresent);
    expect(S.missingImages).toBe(manifest.totalMissing);
  });
});
