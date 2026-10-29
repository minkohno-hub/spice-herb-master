# TEST_PLAN

- 単体（Vitest、実施済み）: 採点（選択/多択/正誤/テキスト/表穴埋め/記述要点）、表記揺れ正規化、SM-2（初回1日・2回目6日・不正解リセット・ease下限1.3・due判定）、統計（空データで正答率null=未測定）、データ検証（manifest 140エントリ・欠落記録・ページ番号を連番から断定していないこと・構造81節のID一意性・正式問題0問・サンプル17形式網羅と通常出題除外・重複候補なし）。
- 結合/E2E（未実施）: 指令書21.2の16シナリオ（初回起動〜エラー復旧）は Playwright 導入がフェーズ2課題。現状は domain ロジックとデータ整合性まで。
- レスポンシブ/実機: 未実施（ブラウザ自動テストと実機確認の区別は QUALITY_REPORT 参照）。
- CI: .github/workflows/ci.yml で typecheck/test/validate:data/build を実行する定義を用意（ローカル配置のみ。GitHubへの反映は DEVELOPMENT_STATE の注意参照）。
