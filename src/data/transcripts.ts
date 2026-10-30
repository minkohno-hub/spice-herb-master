/**
 * 本文転記（原文層）の集約モジュール — 手で編集する場合は JSON 本体を編集すること。
 * データ本体は src/data/transcripts/ 配下の章別分割JSON。
 * 原文層は知識単位（src/data/knowledge.ts）とは分離し、各ページレコードは出典
 * （本書ページ bookPage・原本画像ID imageId・章ID chapterId・節ID sectionId）を必須保持する。
 * 転記ルールと進捗は docs/TRANSCRIPTION.md を参照。
 * ページ↔画像対応は照合バッチで実測した対応（p.71以下は画像番号=ページ+9575、p.72以上は+9576）。
 */
import preface from "./transcripts/preface.json";
import ch1 from "./transcripts/ch1.json";
import ch2part1 from "./transcripts/ch2-1.json";
import ch2part2 from "./transcripts/ch2-2.json";
import ch2part3 from "./transcripts/ch2-3.json";
import ch3 from "./transcripts/ch3.json";
import exam from "./transcripts/exam.json";

export type TranscriptBlockType = "heading" | "paragraph" | "table" | "column" | "note" | "caption";
export interface TranscriptBlock {
  type: TranscriptBlockType;
  /** heading のみ: 1=章タイトル級, 2=節タイトル級, 3=小見出し */
  level?: number;
  /** column のみ: コラムの見出し */
  title?: string;
  /** heading / paragraph / note / caption の本文、column の本文 */
  text?: string;
  /** table のみ: 表の見出し */
  caption?: string;
  /** table のみ: 行ごとのセル */
  rows?: string[][];
}
export interface TranscriptUnclear {
  /** ページ内の位置（例: 「第2段落・人物名」） */
  location: string;
  /** 読めなかった内容と理由 */
  note: string;
}
export interface TranscriptPage {
  bookPage: number;
  imageId: string;
  chapterId: string;
  sectionId: string;
  status: "転記済み";
  blocks: TranscriptBlock[];
  unclear: TranscriptUnclear[];
  note?: string;
}

export const TRANSCRIPT_META = {
  origin: "原本画像（Google Drive フォルダ「スパイスハーブ検定」のスキャン）を目視読解して全文転記",
  rule: "docs/TRANSCRIPTION.md",
  files: ["preface.json", "ch1.json", "ch2-1.json", "ch2-2.json", "ch2-3.json", "ch3.json", "exam.json"],
  transcribedPages: 133,
  totalSourceImages: 139,
} as const;

/** 転記済みページ（bookPage 昇順） */
export const TRANSCRIPT_PAGES: TranscriptPage[] = [
  ...(preface as unknown as TranscriptPage[]),
  ...(ch1 as unknown as TranscriptPage[]),
  ...(ch2part1 as unknown as TranscriptPage[]),
  ...(ch2part2 as unknown as TranscriptPage[]),
  ...(ch2part3 as unknown as TranscriptPage[]),
  ...(ch3 as unknown as TranscriptPage[]),
  ...(exam as unknown as TranscriptPage[]),
].sort((a, b) => a.bookPage - b.bookPage);

/**
 * ページ番号→転記レコード。
 * 同じページから2節が始まるページ（p.29・p.47）ではレコードが節ごとに分かれるため、
 * ここではそのページで先に始まる節のレコードを代表として返す。
 * 節ごとの完全な取得は transcriptPagesForSection を使うこと。
 * transcribedPages はレコード数ではなく、この Map のキー数（重複を除いたページ数）を指す。
 */
export const TRANSCRIPT_BY_PAGE: Map<number, TranscriptPage> = new Map(
  [...TRANSCRIPT_PAGES].reverse().map(p => [p.bookPage, p]),
);

/** 節ID→その節の転記済みページ（bookPage 昇順） */
export function transcriptPagesForSection(sectionId: string): TranscriptPage[] {
  return TRANSCRIPT_PAGES.filter(p => p.sectionId === sectionId);
}

/**
 * 節ID→転記本文の連結テキスト（横断検索のキーワード索引、監査C-15是正）。
 * 計数定義（tests/transcripts.test.ts の pageChars）と同じ構成要素
 * （text＋title＋caption＋表セル）をページ順に連結する。編集注記 note は
 * 書籍本文ではないため含めない。
 */
export const TRANSCRIPT_SECTION_TEXT: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string[]>();
  for (const p of TRANSCRIPT_PAGES) {
    const parts: string[] = [];
    for (const b of p.blocks) {
      if (b.title) parts.push(b.title);
      if (b.text) parts.push(b.text);
      if (b.caption) parts.push(b.caption);
      if (b.rows) for (const row of b.rows) parts.push(...row);
    }
    const arr = map.get(p.sectionId) ?? [];
    arr.push(parts.join(""));
    map.set(p.sectionId, arr);
  }
  return new Map([...map].map(([k, v]) => [k, v.join(" ")]));
})();

/** ページ→原本画像ID（転記・生成で使う実測対応。manifest の連番からは導かない） */
export function imageIdForBookPage(page: number): string {
  return `IMG_${page <= 71 ? page + 9575 : page + 9576}`;
}
