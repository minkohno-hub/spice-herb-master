// 改訂ポイントの「該当ページを読む」ジャンプの回帰テスト（DECISIONS #51）。
// 改訂データのページ番号（4訂版）が、そのページの転記を含む節へ解決されることを固定する。
// あわせて、節の開始ページ表（structure.ts）と転記レコードの対応も検証する。
import { describe, expect, it } from "vitest";
import { sectionIdForBookPage } from "../src/screens/Revision";
import {
  REVISION_BROAD,
  REVISION_ENTRIES,
  REVISION_LEVEL1_ADDED,
  REVISION_LEVEL1_REMOVED,
  REVISION_RENAMED,
} from "../src/data/revision";
import { transcriptPagesForSection } from "../src/data/transcripts";
import { ALL_SECTIONS } from "../src/data/structure";

function allRevisionPages(): number[] {
  const pages: number[] = [];
  for (const e of REVISION_ENTRIES) if (e.bookPage) pages.push(e.bookPage);
  for (const e of REVISION_LEVEL1_ADDED) if (e.bookPage) pages.push(e.bookPage);
  for (const e of REVISION_LEVEL1_REMOVED) if (e.bookPage) pages.push(e.bookPage);
  for (const e of REVISION_RENAMED) if (e.bookPage) pages.push(e.bookPage);
  for (const e of REVISION_BROAD) pages.push(e.bookPage);
  return pages;
}

describe("改訂ポイントのページジャンプ（DECISIONS #51）", () => {
  it("全改訂項目のページが、そのページの転記を含む節へ解決される", () => {
    const pages = allRevisionPages();
    expect(pages.length).toBeGreaterThan(40);
    for (const p of pages) {
      const sid = sectionIdForBookPage(p);
      const contained = transcriptPagesForSection(sid).some((tp) => tp.bookPage === p);
      expect(contained, `p.${p} → ${sid} に p.${p} の転記が含まれない`).toBe(true);
    }
  });

  it("代表例: タイム p.71 は item-thyme、その他の品目は item-others に解決される", () => {
    expect(sectionIdForBookPage(71)).toBe("item-thyme");
    expect(sectionIdForBookPage(102)).toBe("item-others");
    expect(sectionIdForBookPage(106)).toBe("item-others");
    expect(sectionIdForBookPage(8)).toBe("history-world");
  });

  it("全節の開始ページは、その節の転記ページ範囲内にある（±1ページの境界共有を除く）", () => {
    for (const s of ALL_SECTIONS) {
      const pages = transcriptPagesForSection(s.id).map((p) => p.bookPage);
      if (pages.length === 0) continue;
      const min = Math.min(...pages);
      const max = Math.max(...pages);
      expect(
        s.bookPage >= min - 1 && s.bookPage <= max,
        `${s.id}: 開始ページ ${s.bookPage} が転記範囲 ${min}〜${max} から外れている`,
      ).toBe(true);
    }
  });
});
