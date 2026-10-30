import { expect, test } from "@playwright/test";

/**
 * モバイル viewport の E2E（フェーズ7・バッチE3、docs/DECISIONS.md #30）。
 * スマートフォン幅（390×844）でホーム・リーダー・演習が表示でき、
 * 主要操作（画面遷移・節を開く・回答）ができることを確認する。
 * 実機確認ではなくブラウザの viewport エミュレーションである
 * （実機との区別は docs/TEST_PLAN.md / QUALITY_REPORT.md の従来どおり）。
 * プロジェクトはデスクトップ Chromium のまま、viewport だけを差し替える。
 */

test.describe("モバイル viewport（390×844）", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("ホームから演習へ遷移し、選択式問題に回答できる", async ({ page }) => {
    await page.goto("");
    await expect(
      page.getByRole("heading", { name: "スパイス＆ハーブ検定1級 学習アプリ" }),
    ).toBeVisible();
    // 横方向にページ全体がはみ出していない（横スクロールで操作不能にならない）
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);

    await page
      .getByRole("navigation", { name: "メインナビゲーション" })
      .getByRole("link", { name: "演習", exact: true })
      .click();
    await expect(page.getByRole("heading", { name: "演習" })).toBeVisible();
    // FIX1: サンプルは明示選択時のみ。出題順を登録順にして決定的な先頭問題を使う
    await page.getByLabel("モード").selectOption("sample");
    await page.getByLabel("出題順").selectOption("sequence");
    await expect(
      page.getByRole("heading", {
        name: "[サンプル] このアプリで通常出題される正式問題の条件はどれか。",
      }),
    ).toBeVisible();
    await page.getByText("出典が検証済みの問題", { exact: true }).click();
    await page.getByRole("button", { name: "回答を確定する" }).click();
    await expect(page.getByText("正解（スコア 100%）")).toBeVisible();
  });

  test("リーダーが縦積みで表示され、目次から節を開ける", async ({ page }) => {
    await page.goto("#/reader");
    await expect(page.getByRole("heading", { name: "電子書籍リーダー" })).toBeVisible();
    await expect(page.getByText(/書籍 p\.6 ／ 転記状態: 転記済み/)).toBeVisible();
    await page.getByRole("button", { name: "日本における歴史（p.10）" }).click();
    await expect(page.getByText(/書籍 p\.10 ／ 転記状態: 転記済み/)).toBeVisible();
    await expect(
      page.getByText(/「薬味」という言葉はあっても、「スパイス」や「香辛料」は最近まで/),
    ).toBeVisible();
  });
});
