import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PAGE_IMAGES, FRONT_MATTER_IMAGES, imageForBookPage } from "../src/data/pageImages";
import { TRANSCRIPT_PAGES, imageIdForBookPage } from "../src/data/transcripts";

// UX3（DECISIONS #38）: 原画の収録範囲と実ファイルの整合を固定する。
// 原画は public/pages-b64/<imageId>.b64（中身は WebP の Base64 テキスト）。
const PUBLIC_DIR = join(process.cwd(), "public", "pages-b64");

describe("ページ原画の目録（UX3）", () => {
  it("原本画像139件すべてが目録にあり、本書 p.6〜140 の135ページに欠けがない", () => {
    expect(PAGE_IMAGES.length).toBe(139);
    const pages = PAGE_IMAGES.filter((e) => e.bookPage != null).map((e) => e.bookPage as number).sort((a, b) => a - b);
    expect(pages).toEqual(Array.from({ length: 135 }, (_, i) => i + 6));
    expect(FRONT_MATTER_IMAGES.map((e) => e.imageId)).toEqual(["IMG_9577", "IMG_9578", "IMG_9579", "IMG_9580"]);
  });

  it("ページ→画像IDが転記データ側の対応（imageIdForBookPage）と全ページで一致する", () => {
    for (let p = 6; p <= 140; p++) {
      expect(imageForBookPage(p)?.imageId).toBe(imageIdForBookPage(p));
    }
  });

  it("転記ページの出典画像はすべて目録に存在する", () => {
    const ids = new Set(PAGE_IMAGES.map((e) => e.imageId));
    for (const tp of TRANSCRIPT_PAGES) expect(ids.has(tp.imageId)).toBe(true);
  });

  it("実ファイルが存在し、Base64 を戻すと WebP になり、大きさも上限内である", () => {
    let total = 0;
    for (const e of PAGE_IMAGES) {
      const path = join(PUBLIC_DIR, `${e.imageId}.b64`);
      expect(existsSync(path)).toBe(true);
      const raw = Buffer.from(readFileSync(path, "utf8"), "base64");
      expect(raw.length).toBe(e.webpBytes);
      expect(raw.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(raw.subarray(8, 12).toString("ascii")).toBe("WEBP");
      expect(raw.length).toBeLessThanOrEqual(200 * 1024);
      total += raw.length;
    }
    expect(total).toBeLessThanOrEqual(20 * 1024 * 1024);
  });
});
