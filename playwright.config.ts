import { defineConfig, devices } from "@playwright/test";

/**
 * E2E（Playwright）設定 — フェーズ7・バッチE2（docs/DECISIONS.md #24）。
 *
 * 実行対象は開発サーバーではなく本番ビルドの静的配信（vite preview）。
 * webServer が `npm run build && npm run preview` を自動起動し、テスト終了後に停止する。
 * アプリの base は "/spice-herb-master/"（vite.config.ts）、ルーティングは HashRouter
 * なので、URL は http://127.0.0.1:4173/spice-herb-master/#/… の形になる。
 * Vitest（tests/**）とは対象を分離し、E2E は e2e/** のみを拾う。
 */
const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}/spice-herb-master/`;

export default defineConfig({
  testDir: "./e2e",
  // 遅延チャンク＋巨大データチャンクの初回読み込みをまたぐため、余裕を持たせる。
  timeout: 60_000,
  expect: { timeout: 15_000 },
  // ローカル学習履歴（localStorage）はテスト間で共有しない（Playwright の既定で
  // テストごとに新しいブラウザコンテキストになる）。並列実行は静的配信のみ相手で
  // 状態競合がないため許可するが、ワーカー数は安定性優先で 2 に抑える。
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      // channel: "chromium" で、別体の headless shell ではなくフル Chromium
      // ビルドの新ヘッドレスモードを使う（取得するブラウザ成果物を1つに揃える）。
      use: { ...devices["Desktop Chrome"], channel: "chromium" },
    },
  ],
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort --host 127.0.0.1",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
