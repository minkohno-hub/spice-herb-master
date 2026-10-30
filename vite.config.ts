import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  base: "/spice-herb-master/",
  // PWA（監査E-06/E-07是正、AD-3）: 更新は自動適用（autoUpdate）し、precache は
  // アプリのシェル（HTML/CSS/画面・基盤チャンク）に限る。データチャンク
  // （data-questions / data-knowledge / data-transcripts）は初回利用時に
  // runtime caching（CacheFirst）で保存され、オフラインでも再利用できる。
  plugins: [react(), VitePWA({ registerType: "autoUpdate", manifest: { lang: "ja", name: "スパイス＆ハーブ検定1級 学習アプリ", short_name: "スパイス検定", description: "公式テキストに基づく個人用学習アプリ", theme_color: "#3f6212", background_color: "#faf9f4", display: "standalone", start_url: "/spice-herb-master/", scope: "/spice-herb-master/", icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }, { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }, { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }, { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }] }, workbox: { globPatterns: ["**/*.{js,css,html,svg,png}"], globIgnores: ["**/data-questions-*.js", "**/data-knowledge-*.js", "**/data-transcripts-*.js"], maximumFileSizeToCacheInBytes: 3_000_000, runtimeCaching: [{ urlPattern: /data-(questions|knowledge|transcripts)-[^/]+\.js$/, handler: "CacheFirst", options: { cacheName: "app-data-chunks", expiration: { maxEntries: 6, maxAgeSeconds: 60 * 60 * 24 * 30 } } }] } })],
  build: {
    rollupOptions: {
      output: {
        // バンドル分割バッチE1（docs/DECISIONS.md #23）: データ種別ごとにチャンクを分離する。
        // 画面チャンク（React.lazy）からのみ参照されるため、初期表示では読み込まれない。
        // 全チャンクとも PWA precache（上記 glob）に含まれ、オフラインで全機能が動く。
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (/[\\/](react|react-dom|react-router|scheduler)[\\/]/.test(id)) return "vendor";
            return undefined;
          }
          if (id.includes("/src/data/questions/") || id.includes("/src/data/formal-questions")) return "data-questions";
          if (id.includes("/src/data/knowledge/") || id.includes("/src/data/knowledge.ts")) return "data-knowledge";
          if (id.includes("/src/data/transcripts")) return "data-transcripts";
          return undefined;
        },
      },
    },
  },
});
