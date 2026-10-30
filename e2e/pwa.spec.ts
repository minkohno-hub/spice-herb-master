import { expect, test } from "@playwright/test";

/**
 * PWA / オフライン相当の最小確認（フェーズ7・バッチE2）。
 * 過度に作り込まず、「Service Worker が登録され有効化されること」と
 * 「precache 済みアセットでオフライン再読み込み後もホームが表示されること」
 * の2点だけを固定する（詳細なオフライン挙動の網羅は対象外、docs/DECISIONS.md #24）。
 */

test.describe("PWA（オフライン相当の最小確認）", () => {
  test("Service Worker が登録され、オフライン再読み込みでもホームが表示される", async ({
    page,
    context,
  }) => {
    await page.goto("");
    await expect(
      page.getByRole("heading", { name: "スパイス＆ハーブ検定1級 学習アプリ" }),
    ).toBeVisible();

    // SW が登録され active.state === "activated" になるまでポーリングする
    // （serviceWorker.ready の解決直後は "activating" のことがあるため、
    // 1回の読み取りで断定しない。precache 対象が約2.8MBあるので長めに待つ）
    await expect
      .poll(
        async () =>
          page.evaluate(async () => {
            if (!("serviceWorker" in navigator)) return "unsupported";
            const reg = await navigator.serviceWorker.getRegistration();
            return reg?.active?.state ?? "none";
          }),
        { timeout: 30_000, intervals: [500] },
      )
      .toBe("activated");

    // precache 取り込みのためオンラインで一度再読み込みしてからオフライン化する
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "スパイス＆ハーブ検定1級 学習アプリ" }),
    ).toBeVisible();

    await context.setOffline(true);
    try {
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "スパイス＆ハーブ検定1級 学習アプリ" }),
      ).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
});
