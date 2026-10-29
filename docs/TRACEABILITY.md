# TRACEABILITY — 要件対応表（指令書→実装）

| 指令書 | 実装 | 状態 |
|---|---|---|
| 3章 調査・インベントリ | data/source-manifest.json（140エントリ） | 済（ページ照合は目次・アンカーのみ） |
| 4章 教材化 | 工程を DATA_PIPELINE に定義 | 未実施（フェーズ2） |
| 5章 データ設計 | domain/types.ts（知識単位・出典・安定ID） | 基盤済・データ0件 |
| 6章 出題範囲ルール | validate.ts（verified は出典・知識単位必須） | 済 |
| 7章 17形式 | types＋QuestionRunner＋サンプル17問 | 済（正式問題0） |
| 8章 学習モード/SRS/誤答分析 | Practice/Stats、srs.ts（SM-2）、mistakeCause 型 | 基盤済 |
| 9章 記述式採点 | grading.ts 要点チェック＋自己採点分離 | 済 |
| 10章 電子書籍 | Reader画面（目次/検索/しおり等） | 仕組み済・本文未転記 |
| 11章 フラッシュカード | Cards画面＋flashcard形式 | 仕組み済・正式0件 |
| 12章 模擬試験 | Exam画面（時間/途中保存/一括採点枠） | 枠済・出題0 |
| 13章 分析・網羅率5指標 | Stats画面＋stats.ts（算出不能は未測定表示） | 済 |
| 14章 検索 | Search画面（横断・節/問題） | 基本済 |
| 15章 品質管理 | QA画面（集計＋修正案JSON出力、GitHub直書きなし） | 済 |
| 16章 UI/UX | styles.css デザインシステム | 済（実機検証未） |
| 17章 性能/PWA | vite-plugin-pwa（シェルのみ precache） | 済 |
| 19章 GitHub Actions | .github/workflows/ci.yml | ローカル用意（反映は要確認事項） |
| 21章 テスト | Vitest 33件 | 単体済・E2E未 |
