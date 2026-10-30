/**
 * ページ原画（スキャン画像）の目録（UX3、docs/DECISIONS.md #38）。
 *
 * 実データは src/data/page-images.json（scripts/prepare-page-images.py が
 * 原本スキャンから生成する）。原画そのものは public/pages-b64/ に
 * Base64 テキスト（中身は幅1000px の WebP）として置き、リーダーが
 * 必要になったページだけ fetch して Blob URL 化して表示する。
 * GitHub 配信がテキスト前提のため、この形式にしている（DECISIONS #38）。
 */
import manifest from "./page-images.json";

export interface PageImageEntry {
  imageId: string;
  /** 本書ページ番号。表紙・目次などの前付けは null。 */
  bookPage: number | null;
  width: number;
  height: number;
  webpBytes: number;
}

export const PAGE_IMAGES = manifest as PageImageEntry[];

const byPage = new Map<number, PageImageEntry>(
  PAGE_IMAGES.filter((e) => e.bookPage != null).map((e) => [e.bookPage as number, e]),
);

export function imageForBookPage(page: number): PageImageEntry | undefined {
  return byPage.get(page);
}

export const FRONT_MATTER_IMAGES: PageImageEntry[] = PAGE_IMAGES.filter((e) => e.bookPage == null);

export function pageImageUrl(imageId: string): string {
  // アプリは HashRouter の SPA で、ドキュメントのパスは常にアプリのルート
  // （/spice-herb-master/）にあるため、ルート相対で解決される相対パスでよい。
  return `pages-b64/${imageId}.b64`;
}
