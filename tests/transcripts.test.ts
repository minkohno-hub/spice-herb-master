import { describe, it, expect } from "vitest";
import manifest from "../src/data/source-manifest.json";
import { ALL_SECTIONS } from "../src/data/structure";
import { TRANSCRIPT_PAGES, TRANSCRIPT_BY_PAGE, TRANSCRIPT_META, transcriptPagesForSection, imageIdForBookPage } from "../src/data/transcripts";

const manifestById = new Map((manifest.entries as any[]).map(e => [e.imageId, e]));
const sectionById = new Map(ALL_SECTIONS.map(s => [s.id, s]));

function pageChars(p: (typeof TRANSCRIPT_PAGES)[number]): number {
  let n = 0;
  for (const b of p.blocks) {
    if (b.text) n += b.text.length;
    if (b.title) n += b.title.length;
    if (b.caption) n += b.caption.length;
    if (b.rows) for (const r of b.rows) for (const c of r) n += c.length;
  }
  return n;
}

describe("transcripts (原文層・本文転記)", () => {
  it("対象は p.6〜16、章扉 p.17、p.18〜31、p.33、p.35〜50、章扉 p.51、p.52〜108、章扉 p.109、p.110〜140 の133ページ（重複なし・昇順。p.32・p.34 は写真のみでテキストがないため対象外。p.141 以降は Drive に原本画像が存在しないため対象外で、転記は Drive 実在範囲で完了。章扉3葉は監査A-02で実物を確認して追加した）", () => {
    expect(TRANSCRIPT_PAGES.map(p => p.bookPage)).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140]);
    expect(TRANSCRIPT_META.transcribedPages).toBe(TRANSCRIPT_PAGES.length);
    expect(TRANSCRIPT_BY_PAGE.size).toBe(TRANSCRIPT_PAGES.length);
  });
  it("出典（画像ID）が manifest に実在し、欠落画像ではない", () => {
    for (const p of TRANSCRIPT_PAGES) {
      const entry = manifestById.get(p.imageId);
      expect(entry, p.imageId).toBeDefined();
      expect(entry.extractionStatus).not.toBe("欠落");
      expect(entry.driveFileId).not.toBeNull();
    }
  });
  it("画像IDは実測対応（p.71以下 +9575 / p.72以上 +9576）と一致する", () => {
    for (const p of TRANSCRIPT_PAGES) expect(p.imageId).toBe(imageIdForBookPage(p.bookPage));
  });
  it("章・節の参照先が構造データに実在し、節の開始ページと矛盾しない", () => {
    // 例外: 章扉3葉（p.17・p.51・p.109、監査A-02）は、その章の最初の節の
    // 開始ページの1つ前に位置する（節IDは最初の節に付けてある）
    const DOOR_PAGES = new Set([17, 51, 109]);
    for (const p of TRANSCRIPT_PAGES) {
      const sec = sectionById.get(p.sectionId);
      expect(sec, p.sectionId).toBeDefined();
      expect(sec!.chapterId).toBe(p.chapterId);
      expect(p.bookPage).toBeGreaterThanOrEqual(sec!.bookPage - (DOOR_PAGES.has(p.bookPage) ? 1 : 0));
    }
    // history-world は p.6 開始で次節（history-japan, p.10）の前まで
    expect(transcriptPagesForSection("history-world").map(p => p.bookPage)).toEqual([6, 7, 8, 9]);
    // バッチT2: 序章の残り4節（p.12 は定義のレコードに分類の見出し・導入を含む）
    expect(transcriptPagesForSection("history-japan").map(p => p.bookPage)).toEqual([10, 11]);
    expect(transcriptPagesForSection("definition").map(p => p.bookPage)).toEqual([12]);
    expect(transcriptPagesForSection("classification").map(p => p.bookPage)).toEqual([13, 14, 15]);
    expect(transcriptPagesForSection("preservation").map(p => p.bookPage)).toEqual([16]);
    // バッチT3: 第一章の4節（p.24 は世界の料理の扉ページで basic-compat のレコードに含む）
    expect(transcriptPagesForSection("basic-aroma").map(p => p.bookPage)).toEqual([17, 18, 19, 20]); // p.17 は第一章の章扉
    expect(transcriptPagesForSection("basic-timing").map(p => p.bookPage)).toEqual([21, 22]);
    expect(transcriptPagesForSection("basic-compat").map(p => p.bookPage)).toEqual([23, 24]);
    expect(transcriptPagesForSection("world-africa").map(p => p.bookPage)).toEqual([25]);
    // バッチT4: 世界の料理の残り3節＋定番料理2節（p.29 は world-america のレコードに world-drink の全文を含む。
    // p.30 は定番料理パートの扉ページで dish-curry のレコードに含む。p.32 は写真のみでレコードなし）
    expect(transcriptPagesForSection("world-europe").map(p => p.bookPage)).toEqual([26, 27]);
    expect(transcriptPagesForSection("world-asia").map(p => p.bookPage)).toEqual([28]);
    expect(transcriptPagesForSection("world-america").map(p => p.bookPage)).toEqual([29]);
    expect(transcriptPagesForSection("world-drink").map(p => p.bookPage)).toEqual([]);
    expect(transcriptPagesForSection("dish-curry").map(p => p.bookPage)).toEqual([30, 31]);
    expect(transcriptPagesForSection("dish-genovese").map(p => p.bookPage)).toEqual([33]);
    // バッチT5: 定番料理の残り6節（p.34 はパエリアの写真のみでレコードなし。ラムの煮込みとクスクスは材料 p.40＋作り方 p.41 の2ページ）
    expect(transcriptPagesForSection("dish-paella").map(p => p.bookPage)).toEqual([35]);
    expect(transcriptPagesForSection("dish-chili").map(p => p.bookPage)).toEqual([36]);
    expect(transcriptPagesForSection("dish-kakuni").map(p => p.bookPage)).toEqual([37]);
    expect(transcriptPagesForSection("dish-ceviche").map(p => p.bookPage)).toEqual([38]);
    expect(transcriptPagesForSection("dish-hummus").map(p => p.bookPage)).toEqual([39]);
    expect(transcriptPagesForSection("dish-lamb").map(p => p.bookPage)).toEqual([40, 41]);
    // バッチT6: 定番料理の残り4節＋手作り調味料6節（p.46 は season-oil のレコードにパートタイトルと帯見出し「1」を含む。
    // p.47 は season-vinegar のレコードに season-soy の全文を含むため season-soy は自節レコードを持たない）
    expect(transcriptPagesForSection("dish-currywurst").map(p => p.bookPage)).toEqual([42]);
    expect(transcriptPagesForSection("dish-cumin-potato").map(p => p.bookPage)).toEqual([43]);
    expect(transcriptPagesForSection("dish-chai").map(p => p.bookPage)).toEqual([44]);
    expect(transcriptPagesForSection("dish-apple").map(p => p.bookPage)).toEqual([45]);
    expect(transcriptPagesForSection("season-oil").map(p => p.bookPage)).toEqual([46]);
    expect(transcriptPagesForSection("season-vinegar").map(p => p.bookPage)).toEqual([47]);
    expect(transcriptPagesForSection("season-soy").map(p => p.bookPage)).toEqual([]);
    expect(transcriptPagesForSection("season-paste").map(p => p.bookPage)).toEqual([48]);
    expect(transcriptPagesForSection("season-dressing").map(p => p.bookPage)).toEqual([49]);
    expect(transcriptPagesForSection("season-plus").map(p => p.bookPage)).toEqual([50]);
    // バッチT7: 第二章・図鑑の開始8品目（各1ページ。プロフィール表は table ブロックで構造を保持）
    expect(transcriptPagesForSection("item-anise").map(p => p.bookPage)).toEqual([51, 52]); // p.51 は第二章の章扉
    expect(transcriptPagesForSection("item-allspice").map(p => p.bookPage)).toEqual([53]);
    expect(transcriptPagesForSection("item-oregano").map(p => p.bookPage)).toEqual([54]);
    expect(transcriptPagesForSection("item-garlic").map(p => p.bookPage)).toEqual([55]);
    expect(transcriptPagesForSection("item-cardamom").map(p => p.bookPage)).toEqual([56]);
    expect(transcriptPagesForSection("item-caraway").map(p => p.bookPage)).toEqual([57]);
    expect(transcriptPagesForSection("item-kuchinashi").map(p => p.bookPage)).toEqual([58]);
    expect(transcriptPagesForSection("item-cumin").map(p => p.bookPage)).toEqual([59]);
    // バッチT8: 第二章・図鑑の6品目（こしょう・山椒／花椒は各2ページ。文のページまたぎは両ページに印刷どおり保持）
    expect(transcriptPagesForSection("item-clove").map(p => p.bookPage)).toEqual([60]);
    expect(transcriptPagesForSection("item-pepper").map(p => p.bookPage)).toEqual([61, 62]);
    expect(transcriptPagesForSection("item-coriander").map(p => p.bookPage)).toEqual([63]);
    expect(transcriptPagesForSection("item-saffron").map(p => p.bookPage)).toEqual([64]);
    expect(transcriptPagesForSection("item-sansho").map(p => p.bookPage)).toEqual([65, 66]);
    expect(transcriptPagesForSection("item-cinnamon").map(p => p.bookPage)).toEqual([67]);
    // バッチT9: 第二章・図鑑の8節（各1ページ。p.70 はセージとターメリックの2品目が同居するため1レコードに両品目を転記。
    // p.72 以降はファイル番号=ページ+9576 の対応で、オフセットの切り替わりを跨ぐ）
    expect(transcriptPagesForSection("item-ginger").map(p => p.bookPage)).toEqual([68]);
    expect(transcriptPagesForSection("item-staranise").map(p => p.bookPage)).toEqual([69]);
    expect(transcriptPagesForSection("item-sage-turmeric").map(p => p.bookPage)).toEqual([70]);
    expect(transcriptPagesForSection("item-thyme").map(p => p.bookPage)).toEqual([71]);
    expect(transcriptPagesForSection("item-tarragon").map(p => p.bookPage)).toEqual([72]);
    expect(transcriptPagesForSection("item-chervil").map(p => p.bookPage)).toEqual([73]);
    expect(transcriptPagesForSection("item-chive").map(p => p.bookPage)).toEqual([74]);
    expect(transcriptPagesForSection("item-dill").map(p => p.bookPage)).toEqual([75]);
    // バッチT10: 第二章・図鑑の7節（唐辛子は2ページ。p.77 はプロフィール表のない2ページ目で世界の唐辛子ペースト8種を転記）
    expect(transcriptPagesForSection("item-chili").map(p => p.bookPage)).toEqual([76, 77]);
    expect(transcriptPagesForSection("item-nutmeg").map(p => p.bookPage)).toEqual([78]);
    expect(transcriptPagesForSection("item-basil").map(p => p.bookPage)).toEqual([79]);
    expect(transcriptPagesForSection("item-parsley").map(p => p.bookPage)).toEqual([80]);
    expect(transcriptPagesForSection("item-vanilla").map(p => p.bookPage)).toEqual([81]);
    expect(transcriptPagesForSection("item-paprika").map(p => p.bookPage)).toEqual([82]);
    expect(transcriptPagesForSection("item-fennel").map(p => p.bookPage)).toEqual([83]);
    // バッチT11: 第二章・図鑑の7節（p.85 はマジョラムとマスタードの2品目が同居し1レコードに両品目を転記。マスタードは p.86 まで続く2ページ品目。
    // 第二章の転記ファイルは本バッチで ch2-1.json（p.52〜67）と ch2-2.json（p.68〜）に分割した）
    expect(transcriptPagesForSection("item-horseradish").map(p => p.bookPage)).toEqual([84]);
    expect(transcriptPagesForSection("item-marjoram-mustard").map(p => p.bookPage)).toEqual([85, 86]);
    expect(transcriptPagesForSection("item-mint").map(p => p.bookPage)).toEqual([87]);
    expect(transcriptPagesForSection("item-rucola").map(p => p.bookPage)).toEqual([88]);
    expect(transcriptPagesForSection("item-lemongrass").map(p => p.bookPage)).toEqual([89]);
    expect(transcriptPagesForSection("item-rosemary").map(p => p.bookPage)).toEqual([90]);
    expect(transcriptPagesForSection("item-laurel").map(p => p.bookPage)).toEqual([91]);
    // バッチT12: 第二章・図鑑の3節（わさび／ミックススパイス・ハーブ〈5ページに6品目〉／その他のプロ級〈p.98〜99 は開始6品目のみで節は部分転記〉。
    // 第二章の転記ファイルは本バッチで ch2-3.json（p.92〜）を新設した）
    // バッチT13: その他のプロ級の残り p.100〜108 を追加し、本節（p.98〜108）と第二章の転記が完了した
    expect(transcriptPagesForSection("item-wasabi").map(p => p.bookPage)).toEqual([92]);
    expect(transcriptPagesForSection("item-mix").map(p => p.bookPage)).toEqual([93, 94, 95, 96, 97]);
    expect(transcriptPagesForSection("item-others").map(p => p.bookPage)).toEqual([98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108]);
    // バッチT14: 第三章の開始3節（好みで楽しむハーブティー〈p.110〜114 で完了〉／ヘルス＆ビューティー〈p.115〜116 で完了〉／
    // ハウスキーピング〈p.117 のみで部分転記。第三章の転記ファイルとして ch3.json を新設した〉。全ページがファイル番号=ページ+9576 の範囲）
    expect(transcriptPagesForSection("life-tea").map(p => p.bookPage)).toEqual([109, 110, 111, 112, 113, 114]); // p.109 は第三章の章扉
    expect(transcriptPagesForSection("life-beauty").map(p => p.bookPage)).toEqual([115, 116]);
    // バッチT15: 第三章の続き3節（ハウスキーピング〈p.118 で完了〉／ハンドメイド〈p.119〜121 で完了〉／
    // ハーブの栽培〈p.122〜125 のみで部分転記。節の範囲は p.122〜127〉。全ページがファイル番号=ページ+9576 の範囲）
    expect(transcriptPagesForSection("life-house").map(p => p.bookPage)).toEqual([117, 118]);
    expect(transcriptPagesForSection("life-handmade").map(p => p.bookPage)).toEqual([119, 120, 121]);
    // バッチT16: 第三章の残り2節（ハーブの栽培〈p.126〜127 で完了〉／スパイス＆ハーブと健康〈p.128〜135 で完了〉。
    // 本バッチで第三章の転記が完了した。全ページがファイル番号=ページ+9576 の範囲）
    expect(transcriptPagesForSection("life-grow").map(p => p.bookPage)).toEqual([122, 123, 124, 125, 126, 127]);
    expect(transcriptPagesForSection("life-health").map(p => p.bookPage)).toEqual([128, 129, 130, 131, 132, 133, 134, 135]);
    // バッチT17: 検定情報の4節（検定について／試験概要／対象スパイス＆ハーブ／予想問題〈3級用 Q01〜Q20＋解答のみで節は部分転記〉。
    // 本バッチで Drive の原本画像の実在範囲 p.140 までの転記が完了した。索引（p.145〜）は画像がないため転記データなし）
    expect(transcriptPagesForSection("exam-about").map(p => p.bookPage)).toEqual([136]);
    expect(transcriptPagesForSection("exam-outline").map(p => p.bookPage)).toEqual([137]);
    expect(transcriptPagesForSection("exam-target").map(p => p.bookPage)).toEqual([138]);
    expect(transcriptPagesForSection("exam-sample").map(p => p.bookPage)).toEqual([139, 140]);
    expect(transcriptPagesForSection("index").map(p => p.bookPage)).toEqual([]);
  });
  it("各ページの転記が空でなく、全ブロックに内容がある", () => {
    for (const p of TRANSCRIPT_PAGES) {
      expect(p.status).toBe("転記済み");
      expect(p.blocks.length).toBeGreaterThan(0);
      // 下限は300文字: 節扉ページ（p.12）や表中心のページ（p.14）は本文量が少ないため。
      // 例外: 章扉3葉（p.17 実測83文字・p.51 実測122文字・p.109 実測90文字。章タイトルと導入文のみ）は80/120/90文字、
      // p.24（世界の料理の扉ページ、導入文と地図の地域名のみで実測225文字）は200文字、
      // p.30（定番料理パートの扉ページ、タイトルと導入文のみで実測96文字）は90文字、
      // p.44（チャイ、写真が大きくテキスト量が少ないレシピページで実測274文字）は270文字、
      // p.45（焼きりんご、同じく実測286文字）は280文字、
      // p.133（減塩メニュー例、写真とラベル中心のページで実測234文字）は230文字、
      // p.136（検定情報パートの開始ページ、タイトルと導入文のみで実測242文字）は240文字とする
      const minChars = p.bookPage === 17 ? 80 : p.bookPage === 51 ? 120 : p.bookPage === 109 ? 90 : p.bookPage === 24 ? 200 : p.bookPage === 30 ? 90 : p.bookPage === 44 ? 270 : p.bookPage === 45 ? 280 : p.bookPage === 133 ? 230 : p.bookPage === 136 ? 240 : 300;
      expect(pageChars(p)).toBeGreaterThanOrEqual(minChars);
      for (const b of p.blocks) {
        if (b.type === "table") {
          expect((b.rows ?? []).length).toBeGreaterThan(0);
          for (const r of b.rows!) for (const c of r) expect(c.trim().length).toBeGreaterThan(0);
        } else {
          expect((b.text ?? "").trim().length, `p.${p.bookPage} ${b.type}`).toBeGreaterThan(0);
        }
      }
    }
  });
  it("転記総文字数が実測どおり（バッチT1〜T17＋監査A-02の章扉3葉: 85,586文字）", () => {
    expect(TRANSCRIPT_PAGES.reduce((acc, p) => acc + pageChars(p), 0)).toBe(85586);
  });
  it("structure の転記ステータスと実データが一致する（転記済み節は序章の5節＋第一章の24節＋第二章の39節＋第三章の6節＋検定情報の4節）", () => {
    const withData = new Set(TRANSCRIPT_PAGES.map(p => p.sectionId));
    for (const s of ALL_SECTIONS) {
      if (withData.has(s.id)) expect(s.transcriptionStatus, s.id).toBe("転記済み");
      else expect(s.transcriptionStatus, s.id).toBe("未処理");
    }
  });
  it("バッチT17まで不明瞭箇所は0件として記録されている", () => {
    for (const p of TRANSCRIPT_PAGES) expect(p.unclear).toEqual([]);
  });
});
