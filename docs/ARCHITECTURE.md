# ARCHITECTURE

- 構成: React 19 + TypeScript + Vite 6 + vite-plugin-pwa。ルーティングは HashRouter（GitHub Pages の静的配信で 404 を避けるため。DECISIONS参照）。状態は localStorage ベースの軽量ストア（`src/domain/store.ts`、キー `spice-herb-master:v1`）。Dexie は使わない（データ量が小さく依存を減らすため）。
- レイヤー: `src/domain/`（純粋ロジック: types / normalize / grading / srs / validate / stats / store、UI非依存で単体テスト対象）、`src/data/`（structure=目次照合済み構造、questions、source-manifest.json）、`src/components/QuestionRunner.tsx`（全形式の回答・採点UI）、`src/App.tsx`（8画面: ホーム/演習/電子書籍/カード/模試/分析/検索/品質管理）。
- データ分離: 教材データ（原文層・構造化知識層）と問題データは論理分離。すべての正式問題は知識単位経由で原文（manifest画像ID＋ページ）へ辿れる設計（`SourceRef`）。安定ID: 問題・知識単位は一度採番したら再利用しない（types/validate で担保する方針）。
- 容量対策: 教材画像・全文は端末へ一括永続保存しない。PWA precache はアプリシェルのみ（workbox glob は js/css/html/svg のみ、最大3MB）。教材は将来、章・節単位JSONの遅延取得に拡張する前提で `src/data` を分割可能な構造にしてある（現状は構造データのみ同梱）。
