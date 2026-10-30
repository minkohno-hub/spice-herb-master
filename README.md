# スパイス＆ハーブ検定1級 学習アプリ（spice-herb-master）

公式テキスト（2026年版・新4訂版 ※ユーザー確認済み）に基づく、個人用レスポンシブWebアプリ／PWA。開発主体は Muse（本指令書は元々Claude向けに書かれたものをユーザーがMuseへ再割当）。

## 現在の状態（2026-10-29 フェーズ1）
- **完成した土台**: 演習エンジン（17形式の型定義と回答・採点UI）、記述式の要点チェック式ルールベース採点、間隔反復（SM-2系）、電子書籍リーダー、フラッシュカード、模擬試験、学習分析、横断検索、品質管理画面。
- **正式問題は0問です。** 教科書本文ページの転記が未実施のため、教科書知識を問う問題はまだ作っていません。外部知識で問題を創作することは指令書で禁止されています。エンジン検証用サンプル17問（`status: sample`、題材はアプリの利用ルール）は通常出題から除外されます。
- **全文収録済みではありません。** 教材画像は139件取り込み確認済み、1件（IMG_9647.PNG）がDriveに存在しません。ただし前後の番号付きページ（p.71→p.72）が連続していることから、IMG_9647は番号なし扉ページと強く推察されます（内容は未確認・推定）。詳細は `docs/SOURCE_COVERAGE.md`。
- **GitHub Pages公開は保留中**（リポジトリは private。出版社許可がPages一般公開配信を含むか未確認）。詳細は `docs/BLOCKERS.md`。

## 開発
```sh
npm install
npm run dev        # 開発サーバー
npm run check      # 型チェック＋テスト＋ビルド
npm run validate:data  # データ検証テストのみ
```
技術: React 19 + TypeScript + Vite + vite-plugin-pwa + react-router（HashRouter、GitHub Pagesのベースパス `/spice-herb-master/`）。学習履歴は localStorage のみに保存（同期・バックアップなし＝要件）。ブラウザデータ削除・機種変更で履歴が消える可能性があります。

## ドキュメント
`docs/` 配下: REQUIREMENTS / ARCHITECTURE / DECISIONS / DATA_PIPELINE / SOURCE_COVERAGE / QUESTION_QUALITY / UI_UX_GUIDELINES / TEST_PLAN / QUALITY_REPORT / TRACEABILITY / BLOCKERS / RELEASE_REPORT / DEVELOPMENT_STATE
