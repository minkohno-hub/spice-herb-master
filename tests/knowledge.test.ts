
import { describe, it, expect } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { IMPORTED_KNOWLEDGE_UNITS as U, KNOWLEDGE_IMPORT_META as META } from "../src/data/knowledge";
import { QUESTIONS } from "../src/data/questions";

const OVERRIDES = JSON.parse(readFileSync(new URL("../scripts/collation-overrides.json", import.meta.url), "utf8")) as {
  overrides: Record<string, { status?: string; needsReview?: boolean; batch?: string }>;
};

const knowledgeDir = new URL("../src/data/knowledge/", import.meta.url);

// 番号付きページ範囲（Claude版 source-manifest の書誌情報に基づく）
const inNumberedRange = (p: number) =>
  (p >= 6 && p <= 16) || (p >= 18 && p <= 50) || (p >= 52 && p <= 108) || (p >= 110 && p <= 147);

describe("Claude版データ取り込み（フェーズ2統合）", () => {
  it("実測件数がメタ情報と一致する（Claude自己申告545と照合済み）", () => {
    expect(U.length).toBe(545);
    expect(META.totalUnits).toBe(545);
    expect(META.fromUnitFiles).toBe(248);      // data/units/*.json の units[]
    expect(META.spiceFacts).toBe(217);          // data/spices/*.json の facts[]
    expect(META.spiceProfiles).toBe(80);        // profileOf を持たない図鑑エントリのプロフィール単位
    expect(META.spiceEntries).toBe(82);          // 図鑑エントリ総数（profileOf の続きページ2件を含む）
    expect(META.draftQaTotal).toBe(379);         // q/a付き（units 241 + spice facts 138）
    // 248 + 217 + 80 = 545 で Claude版 DEVELOPMENT_STATE の自己申告「知識単位545」と一致する
    expect(META.fromUnitFiles + META.spiceFacts + META.spiceProfiles).toBe(545);
  });
  it("status は unverified か、照合 overrides 経由の verified のみ（偽装なし）", () => {
    for (const u of U) {
      expect(["unverified", "verified"], u.id).toContain(u.status);
      if (u.status === "unverified") expect(u.collation?.needsReview ?? false, u.id).toBe(false);
    }
  });
  it("原文照合バッチ1+2+3+4+5+6+7+8+9+10+11+12+13+14+15+16+17+18+19+20+21+22+23+24+25+26+27+28（p.6-16, 18-23, 25-29, 31-33, 35-38, 52-63, 70-85, 87-108, 110-135）: verified 件数が照合記録と一致する", () => {
    // docs/COLLATION_BATCH1.md: 対象22件（一致20・軽微な表現差2・誤り0・根拠なし0）→ verified 22件
    // docs/COLLATION_BATCH2.md: 対象24件（一致24・軽微な表現差0・誤り0・根拠なし0）→ verified 24件
    // docs/COLLATION_BATCH3.md: 対象20件（一致20・軽微な表現差0・誤り0・根拠なし0）→ verified 20件
    // docs/COLLATION_BATCH4.md: 対象24件（一致23・軽微な表現差0・誤り1［paprika-4 人名表記を修正して昇格］・根拠なし0）→ verified 24件
    // docs/COLLATION_BATCH5.md: 対象14件（一致14・軽微な表現差0・誤り0・根拠なし0）→ verified 14件
    // docs/COLLATION_BATCH6.md: 対象20件（一致20・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 20件
    // docs/COLLATION_BATCH7.md: 対象21件（一致21・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 21件
    // docs/COLLATION_BATCH8.md: 対象24件（一致24・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 24件
    // docs/COLLATION_BATCH9.md: 対象27件（一致27・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 27件
    // docs/COLLATION_BATCH10.md: 対象21件（一致20・軽微な表現差1・誤り0・根拠なし0・範囲外で未照合0）→ verified 21件
    // docs/COLLATION_BATCH11.md: 対象14件（一致14・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 14件
    // docs/COLLATION_BATCH12.md: 対象9件（一致9・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 9件
    // docs/COLLATION_BATCH13.md: 対象9件（一致9・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 9件
    // docs/COLLATION_BATCH14.md: 対象10件（一致10・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 10件
    // docs/COLLATION_BATCH15.md: 対象14件（一致13・軽微な表現差0・誤り1［m-nikuzuku 漢方名の漢字表記を修正して昇格］・根拠なし0・範囲外で未照合0）→ verified 14件
    // docs/COLLATION_BATCH16.md: 対象9件（一致9・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 9件
    // docs/COLLATION_BATCH17.md: 対象18件（一致18・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 18件
    // docs/COLLATION_BATCH18.md: 対象19件（一致19・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 19件
    // docs/COLLATION_BATCH19.md: 対象19件（一致19・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 19件
    // docs/COLLATION_BATCH20.md: 対象19件（一致19・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 19件
    // docs/COLLATION_BATCH21.md: 対象11件（一致9・軽微な表現差1・誤り1［staranise-profile 別名のカナ表記を修正して昇格］・根拠なし0・範囲外で未照合0）→ verified 11件
    // docs/COLLATION_BATCH22.md: 対象34件（一致33・軽微な表現差1・誤り0・根拠なし0・範囲外で未照合0）→ verified 34件
    // docs/COLLATION_BATCH23.md: 対象31件（一致31・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 31件
    // docs/COLLATION_BATCH24.md: 対象28件（一致28・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 28件
    // docs/COLLATION_BATCH25.md: 対象18件（一致18・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 18件
    // docs/COLLATION_BATCH26.md: 対象20件（一致20・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 20件（p.24 は扉ページで対象単位なし）
    // docs/COLLATION_BATCH27.md: 対象19件（一致19・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 19件（p.30 は扉ページで対象単位なし）
    // docs/COLLATION_BATCH28.md: 対象7件（一致7・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 7件（p.32・34 は料理写真のみのページで対象単位なし）
    // docs/COLLATION_BATCH29.md: 対象9件（一致9・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 9件（p.40 は対象単位なし。c-flavor-oil の根拠は p.46〜47）
    // docs/COLLATION_BATCH30.md: 対象11件（一致11・軽微な表現差0・誤り0・根拠なし0・範囲外で未照合0）→ verified 11件（最終バッチ。全545件の照合が完結）
    const collatedPages = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23, 25, 26, 27, 28, 29, 31, 33, 35, 36, 37, 38, 39, 41, 42, 43, 44, 45, 46, 48, 49, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137];
    const verified = U.filter((u) => u.status === "verified");
    expect(verified.length).toBe(545);
    expect(META.verifiedTotal).toBe(545);
    expect(verified.every((u) => collatedPages.includes(u.source.page))).toBe(true);
    expect(verified.filter((u) => u.collation?.batch === "batch1").length).toBe(22);
    expect(verified.filter((u) => u.collation?.batch === "batch2").length).toBe(24);
    expect(verified.filter((u) => u.collation?.batch === "batch3").length).toBe(20);
    expect(verified.filter((u) => u.collation?.batch === "batch4").length).toBe(24);
    expect(verified.filter((u) => u.collation?.batch === "batch5").length).toBe(14);
    expect(verified.filter((u) => u.collation?.batch === "batch6").length).toBe(20);
    expect(verified.filter((u) => u.collation?.batch === "batch7").length).toBe(21);
    expect(verified.filter((u) => u.collation?.batch === "batch8").length).toBe(24);
    expect(verified.filter((u) => u.collation?.batch === "batch9").length).toBe(27);
    expect(verified.filter((u) => u.collation?.batch === "batch10").length).toBe(21);
    expect(verified.filter((u) => u.collation?.batch === "batch11").length).toBe(14);
    expect(verified.filter((u) => u.collation?.batch === "batch12").length).toBe(9);
    expect(verified.filter((u) => u.collation?.batch === "batch13").length).toBe(9);
    expect(verified.filter((u) => u.collation?.batch === "batch14").length).toBe(10);
    expect(verified.filter((u) => u.collation?.batch === "batch15").length).toBe(14);
    expect(verified.filter((u) => u.collation?.batch === "batch16").length).toBe(9);
    expect(verified.filter((u) => u.collation?.batch === "batch17").length).toBe(18);
    expect(verified.filter((u) => u.collation?.batch === "batch18").length).toBe(19);
    expect(verified.filter((u) => u.collation?.batch === "batch19").length).toBe(19);
    expect(verified.filter((u) => u.collation?.batch === "batch20").length).toBe(19);
    expect(verified.filter((u) => u.collation?.batch === "batch21").length).toBe(11);
    expect(verified.filter((u) => u.collation?.batch === "batch22").length).toBe(34);
    expect(verified.filter((u) => u.collation?.batch === "batch23").length).toBe(31);
    expect(verified.filter((u) => u.collation?.batch === "batch24").length).toBe(28);
    expect(verified.filter((u) => u.collation?.batch === "batch25").length).toBe(18);
    expect(verified.filter((u) => u.collation?.batch === "batch26").length).toBe(20);
    expect(verified.filter((u) => u.collation?.batch === "batch27").length).toBe(19);
    expect(verified.filter((u) => u.collation?.batch === "batch28").length).toBe(7);
    expect(verified.filter((u) => u.collation?.batch === "batch29").length).toBe(9);
    expect(verified.filter((u) => u.collation?.batch === "batch30").length).toBe(11);
    // バッチ4で修正した paprika-4: 人名表記が原文「スザント・ゲオルギー」に修正されていること
    const paprika4 = U.find((u) => u.id === "paprika-4")!;
    expect(paprika4.content).toContain("スザント・ゲオルギー博士");
    expect(paprika4.content).not.toContain("セント・ジェルジ");
    expect(paprika4.draftQa?.a).toBe("スザント・ゲオルギー");
    // バッチ15で修正した m-nikuzuku: 漢方名が原文「肉豆蔲」に修正されていること
    const nikuzuku = U.find((u) => u.id === "m-nikuzuku")!;
    expect(nikuzuku.content).toContain("肉豆蔲");
    expect(nikuzuku.content).not.toContain("肉豆蔻");
    expect(nikuzuku.draftQa?.a).toBe("肉豆蔲");
    // バッチ21で修正した staranise-profile: 別名が原文「ポイカッ」に修正されていること
    const staraniseProfile = U.find((u) => u.id === "staranise-profile")!;
    expect(staraniseProfile.content).toContain("ポイカッ");
    expect(staraniseProfile.content).not.toContain("ボイカッ");
    // 照合済みページの対象単位は全件 verified（対象で未照合の取りこぼしがない）
    const targets = U.filter((u) => collatedPages.includes(u.source.page));
    expect(targets.length).toBe(545);
    expect(targets.every((u) => u.status === "verified")).toBe(true);
    // 全単位のページが照合済みページに含まれる（未照合ページの単位は残っていない）
    expect(U.filter((u) => !collatedPages.includes(u.source.page)).every((u) => u.status === "unverified")).toBe(true);
    expect(META.needsReviewTotal).toBe(0);
  });
  it("collation-overrides の ID がすべて実在し、verified 指定と実データが一致する", () => {
    const ids = new Set(U.map((u) => u.id));
    const entries = Object.entries(OVERRIDES.overrides);
    expect(entries.length).toBe(545);
    expect(META.overridesApplied).toBe(entries.length);
    for (const [oid, ov] of entries) {
      expect(ids.has(oid), oid).toBe(true);
      const u = U.find((x) => x.id === oid)!;
      expect(u.collation, oid).toBeTruthy();
      expect(u.collation!.batch, oid).toBe(ov.batch);
      if (ov.needsReview) expect(u.status, oid).toBe("unverified"); // 要確認は昇格させない
      else if (ov.status === "verified") expect(u.status, oid).toBe("verified");
    }
    // overrides に無い単位が verified になっていないこと
    expect(U.filter((u) => u.status === "verified").every((u) => u.id in OVERRIDES.overrides)).toBe(true);
  });
  it("全件に出典ページと元IDがあり、origin が明示される", () => {
    for (const u of U) {
      expect(typeof u.source.page, u.id).toBe("number");
      expect(u.source.sourceUnitId, u.id).toBe(u.id);
      expect(u.source.origin).toBe("claude/build-learning-app");
      expect(u.content.trim().length, u.id).toBeGreaterThan(0);
    }
  });
  it("IDに重複がない", () => {
    expect(new Set(U.map((u) => u.id)).size).toBe(U.length);
  });
  it("図鑑由来は親spiceの id/name/page を保持する", () => {
    const spiceUnits = U.filter((u) => u.kind !== "unit");
    expect(spiceUnits.length).toBe(297);
    for (const u of spiceUnits) {
      expect(u.spice?.id, u.id).toBeTruthy();
      expect(u.spice?.name, u.id).toBeTruthy();
      expect(u.chapterId).toBe("ch2");
      expect(u.source.page).toBeGreaterThanOrEqual(52);
      expect(u.source.page).toBeLessThanOrEqual(108);
    }
  });
  it("ページ範囲外は警告リストとして可視化する（失敗にしない設計・現データでは0件）", () => {
    // 判断記録: 範囲外ページは変換ミスとは限らない（目次等の番号なしページ由来の可能性）ため、
    // ハード失敗ではなく警告リストで可視化する。現在の取り込みでは0件であることをここで固定する。
    const warnings = U.filter((u) => !inNumberedRange(u.source.page)).map((u) => `${u.id}: p.${u.source.page}`);
    expect(warnings).toEqual([]);
  });
  it("データ本体は取り込み元ファイル単位の分割JSON（11ファイル・全て128KB未満）で、合計が545件と一致する", () => {
    // 分割単位は取り込み元ファイル（units 7 + spices 4 = 11）。フェーズ2.1で knowledge.ts 単一生成から移行。
    expect(META.files).toEqual([
      "units/ch0-basics.json", "units/ch0-history.json", "units/ch1-recipes.json",
      "units/ch1-usage.json", "units/ch1-world.json", "units/ch3-health.json", "units/ch3-life.json",
      "spices/a.json", "spices/b.json", "spices/c.json", "spices/d.json",
    ]);
    let total = 0;
    for (const rel of META.files) {
      const url = new URL(rel, knowledgeDir);
      // GitHubコネクタの1ファイルあたりサイズ制約への適合を実測で固定する
      expect(statSync(url).size, rel).toBeLessThan(128 * 1024);
      const arr = JSON.parse(readFileSync(url, "utf8")) as typeof U;
      expect(Array.isArray(arr), rel).toBe(true);
      expect(arr.length, rel).toBeGreaterThan(0);
      for (const u of arr) {
        expect(["unverified", "verified"], `${rel}:${u.id}`).toContain(u.status);
        if (u.status === "verified") expect(u.collation, `${rel}:${u.id}`).toBeTruthy();
        expect(u.source.origin, `${rel}:${u.id}`).toBe("claude/build-learning-app");
        expect(typeof u.source.page, `${rel}:${u.id}`).toBe("number");
      }
      total += arr.length;
    }
    expect(total).toBe(545);
    // 集約モジュール経由の一覧と、分割JSONの単純連結が同じ件数・同じID順になること
    expect(U.map((u) => u.id)).toEqual(
      META.files.flatMap((rel) => (JSON.parse(readFileSync(new URL(rel, knowledgeDir), "utf8")) as typeof U).map((u) => u.id)),
    );
  });
  it("q/a は下書き参照であり、正式問題は照合済み単位からのみ生成される（フェーズ4）", () => {
    const withQa = U.filter((u) => u.draftQa);
    expect(withQa.length).toBe(379);
    for (const u of withQa) {
      expect(u.draftQa!.q.trim().length, u.id).toBeGreaterThan(0);
      expect(u.draftQa!.a.trim().length, u.id).toBeGreaterThan(0);
    }
    // 正式問題（フェーズ4で生成開始）の参照先は全件 verified の取り込み単位でなければならない
    expect(QUESTIONS.length).toBeGreaterThan(0);
    const byId = new Map(U.map((u) => [u.id, u]));
    for (const q of QUESTIONS) {
      expect(q.status).toBe("verified");
      for (const uid of q.knowledgeUnitIds) expect(byId.get(uid)?.status, q.id).toBe("verified");
    }
  });
});
