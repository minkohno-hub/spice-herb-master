import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  base: "/spice-herb-master/",
  plugins: [react(), VitePWA({ registerType: "prompt", manifest: { name: "スパイス＆ハーブ検定1級 学習アプリ", short_name: "スパイス検定", description: "公式テキストに基づく個人用学習アプリ", theme_color: "#3f6212", background_color: "#faf9f4", display: "standalone", start_url: "/spice-herb-master/", scope: "/spice-herb-master/", icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }] }, workbox: { globPatterns: ["**/*.{js,css,html,svg}"], maximumFileSizeToCacheInBytes: 3_000_000 } })],
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
