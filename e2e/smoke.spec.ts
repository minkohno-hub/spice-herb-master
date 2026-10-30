import { expect, test, type Page } from "@playwright/test";

/**
 * 主要フローのスモーク E2E（フェーズ7・バッチE2）。
 *
 * セレクタ方針: 位置指定（nth や CSS クラス依存）は避け、ロール＋アクセシブル名、
 * 表示テキスト等の意味的な指定を優先する（docs/DECISIONS.md #24）。
 * アプリは HashRouter のため、各画面は "#/<route>" で開く（base は config の baseURL）。
 * 遅延チャンク（React.lazy）の読み込みは、対象画面の h1 が見えることを
 * Playwright の自動待機（expect のリトライ）で待つことで検証する。
 */

async function openHome(page: Page) {
  await page.goto("");
  await expect(
    page.getByRole("heading", { name: "スパイス＆ハーブ検定1級 学習アプリ" }),
  ).toBeVisible();
}

function mainNav(page: Page) {
  return page.getByRole("navigation", { name: "メインナビゲーション" });
}

test.describe("ホームとナビゲーション", () => {
  test("ホームが表示され、教材の主要指標が見える", async ({ page }) => {
    await openHome(page);
    // 軽量サマリ経由の件数表示（tests/summary.test.ts が実データ一致を固定）
    await expect(page.getByText("正式問題 1819問").first()).toBeVisible();
    await expect(page.getByText(/取り込み済み知識単位: 545件/)).toBeVisible();
    await expect(page.getByText(/全文転記: 130ページ/)).toBeVisible();
    await expect(page.getByText("教材の状態（正直な表示）")).toBeVisible();
  });

  test("主要ナビゲーションから8画面すべてへ遷移できる（遅延チャンク読み込み）", async ({
    page,
  }) => {
    await openHome(page);
    const routes: Array<{ link: string; heading: string; hash: string }> = [
      { link: "演習", heading: "演習", hash: "#/practice" },
      { link: "電子書籍", heading: "電子書籍リーダー", hash: "#/reader" },
      { link: "単語帳", heading: "フラッシュカード・単語帳", hash: "#/cards" },
      { link: "模擬試験", heading: "模擬試験（練習用）", hash: "#/exam" },
      { link: "分析", heading: "学習分析・可視化", hash: "#/stats" },
      { link: "検索", heading: "横断検索", hash: "#/search" },
      { link: "品質管理", heading: "品質管理（管理・監査）", hash: "#/qa" },
      { link: "ホーム", heading: "スパイス＆ハーブ検定1級 学習アプリ", hash: "#/" },
    ];
    for (const r of routes) {
      await mainNav(page).getByRole("link", { name: r.link, exact: true }).click();
      // 遅延チャンクの取得・描画が終わるまで h1 の出現を待つ
      await expect(page.getByRole("heading", { name: r.heading }).first()).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`${r.hash.replace("/", "\\/")}$`));
    }
  });
});

test.describe("電子書籍リーダー", () => {
  test("目次から節を開くと転記本文が表示される", async ({ page }) => {
    await page.goto("#/reader");
    await expect(page.getByRole("heading", { name: "電子書籍リーダー" })).toBeVisible();
    // 初期表示は先頭の節（世界における歴史、p.6）で転記本文が出ている
    await expect(page.getByText(/書籍 p\.6 ／ 転記状態: 転記済み/)).toBeVisible();
    await expect(
      page.getByText(/古代から、人類はその経験に基づく知恵を生かして/),
    ).toBeVisible();

    // 目次から別の節（日本における歴史、p.10）を開く
    await page.getByRole("button", { name: "日本における歴史（p.10）" }).click();
    await expect(page.getByText(/書籍 p\.10 ／ 転記状態: 転記済み/)).toBeVisible();
    await expect(
      page.getByText(/「薬味」という言葉はあっても、「スパイス」や「香辛料」は最近まで/),
    ).toBeVisible();
    // その節の関連問題数などの付帯情報も描画される
    await expect(page.getByText(/関連問題: \d+問（正式）/)).toBeVisible();
  });
});

test.describe("演習", () => {
  test("通常演習（検証済み）で1問に回答すると採点結果が見える", async ({ page }) => {
    await page.goto("#/practice");
    await expect(page.getByRole("heading", { name: "演習" })).toBeVisible();
    await page.getByLabel("モード").selectOption("verified");
    // 先頭の正式問題（一問一答）: 問題文が表示されるまで待つ
    await expect(
      page.getByRole("heading", {
        name: "スパイス&ハーブの定義の一例で、両者は何という植物の一部とされる?",
      }),
    ).toBeVisible();
    await page.getByLabel("回答入力").fill("芳香性植物");
    await page.getByRole("button", { name: "回答を確定する" }).click();
    await expect(page.getByText("正解（スコア 100%）")).toBeVisible();
    await expect(page.getByText(/解説:/)).toBeVisible();
  });

  test("サンプル演習で選択肢を選んで回答すると採点結果が見える", async ({ page }) => {
    await page.goto("#/practice");
    await expect(page.getByRole("heading", { name: "演習" })).toBeVisible();
    // 既定モードはエンジン検証用サンプル（決定的な先頭問題を使う）
    await expect(
      page.getByRole("heading", {
        name: "[サンプル] このアプリで通常出題される正式問題の条件はどれか。",
      }),
    ).toBeVisible();
    await page.getByText("出典が検証済みの問題", { exact: true }).click();
    await page.getByRole("button", { name: "回答を確定する" }).click();
    await expect(page.getByText("正解（スコア 100%）")).toBeVisible();
  });
});

test.describe("フラッシュカード", () => {
  test("カードが表示され、クリックでめくれて、次のカードへ進める", async ({ page }) => {
    await page.goto("#/cards");
    await expect(
      page.getByRole("heading", { name: "フラッシュカード・単語帳" }),
    ).toBeVisible();
    const card = page.getByRole("button", { name: "カード反転" });
    await expect(card).toHaveText(
      "スパイス&ハーブの定義の一例で、両者は何という植物の一部とされる?",
    );
    await card.click();
    await expect(card).toHaveText("芳香性植物");
    await page.getByRole("button", { name: "次のカード" }).click();
    await expect(card).toHaveText("スパイスとハーブを区分する一般的な基準は?");
  });
});

test.describe("模擬試験", () => {
  test("設定画面から模試を開始できる", async ({ page }) => {
    await page.goto("#/exam");
    await expect(page.getByRole("heading", { name: "模擬試験（練習用）" })).toBeVisible();
    await expect(page.getByText("出題候補（検証済み）: 1819問")).toBeVisible();
    await page.getByLabel("制限時間（分）").fill("15");
    await page.getByRole("button", { name: "開始（途中状態を保存）" }).click();
    await expect(page.getByText(/模試進行中（制限時間 15分・途中保存済み）/)).toBeVisible();
    await page.getByRole("button", { name: "終了して一括採点へ" }).click();
    await expect(page.getByRole("heading", { name: "結果" })).toBeVisible();
  });
});

test.describe("分析・検索・品質管理", () => {
  test("学習分析: 主要指標と網羅率が見える", async ({ page }) => {
    await page.goto("#/stats");
    await expect(page.getByRole("heading", { name: "学習分析・可視化" })).toBeVisible();
    // 新規プロファイル（履歴なし）では総解答 0 件・正答率は未測定が正しい表示
    await expect(page.getByText(/総解答数 0 ／ 正答率 未測定（算出不能）/)).toBeVisible();
    await expect(page.getByText("網羅率（5指標を分離表示）")).toBeVisible();
    await expect(page.getByText("1. 教科書の取り込み率")).toBeVisible();
    await expect(page.getByText(/139\/140画像/)).toBeVisible();
    await expect(
      page.getByText(/545件（原文照合済み 545件・未検証 0件・一問一答ドラフト付き 379件）/),
    ).toBeVisible();
  });

  test("横断検索: 件数が見え、キーワードで絞り込める", async ({ page }) => {
    await page.goto("#/search");
    await expect(page.getByRole("heading", { name: "横断検索" })).toBeVisible();
    // 初期状態は全件: 節 81 件・問題 1836 件（正式 1819＋サンプル 17）
    await expect(page.getByRole("heading", { name: "教材（節） 81件" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "問題 1836件" })).toBeVisible();
    await page.getByLabel("キーワード").fill("歴史");
    await expect(page.getByRole("heading", { name: "教材（節） 2件" })).toBeVisible();
    await expect(page.getByText("世界における歴史（p.6・転記済み）")).toBeVisible();
  });

  test("品質管理: 検証集計の主要指標が見える", async ({ page }) => {
    await page.goto("#/qa");
    await expect(
      page.getByRole("heading", { name: "品質管理（管理・監査）" }),
    ).toBeVisible();
    await expect(page.getByText(/重複候補: \d+組/)).toBeVisible();
    await expect(
      page.getByText(/取り込み済み知識単位: 545件（原文照合済み 545件・未検証 0件/),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "修正案JSONを出力" }),
    ).toBeVisible();
  });
});
