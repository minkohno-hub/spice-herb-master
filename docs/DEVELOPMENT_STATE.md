# 開発状態(再開用)

最終更新: 2026-10-22 / ブランチ: claude/build-learning-app / 基点コミット: c02133d

## 現在の段階
教材データ化とデータ生成パイプラインまで完了。アプリ画面(React)は土台のみで、各画面は未実装。

## 完了
- 書籍147枚を読み取り、要点を data/units/*.json と data/spices/*.json に構造化(知識単位545、図鑑80種)
- scripts/build-data.mjs と scripts/generate.mjs が検証と問題生成を行う(問題1185件。出典は知識単位ID経由でページに遡れる)
- src/lib: types / grading / srs / store / data / select / app(状態・ルーティング)
- src/components/ui.tsx、src/styles.css(デザイントークン、ライト/ダーク)
- vite / tsconfig / index.html

## 未完了(次に行う順)
1. src/main.tsx、src/screens/*(ホーム、演習、問題画面、教科書、単語帳、模擬試験、成績、検索、管理、設定)
2. public/manifest.webmanifest、アイコン、service worker
3. tests/(採点・SRS・生成データ・E2E)、`npm run typecheck`、`npm test` の実行
4. .github/workflows(検証→ビルド→Pages)
5. docs の残り(ARCHITECTURE, TEST_PLAN, QUALITY_REPORT, TRACEABILITY, RELEASE_REPORT ほか)

## 未実行・未確認(重要)
- npm run typecheck / test / build は一度も実行していない
- 生成問題の status は「構造検証済み」のみ。内容の人手照合は未実施
- 4級選択肢の質は抜き取り確認のみ。記述式の採点基準は自動生成で未確認
- 書籍の「予想問題」(p.139-144)は未収録(D-002改訂により今後収録対象)

## 未解決の問題
- ネット上の過去問: 検索では見つからず、公式サイトは503で取得できなかった(docs/BLOCKERS.md)
- 出版社の許諾範囲(GitHub保存/Pages公開)は未確認。奥付は無断デジタル化禁止の表記

## 方針変更(2026-10-22)
利用者から、出版社の特例許可が奥付に優先するとの申告。全文の文字起こし(原文層)を追加する方向へ変更。
次の作業に「全147枚の文字起こし → data/source/ に原文層として保存 → 原文照合状態の管理」を追加。
一般公開(Pages)は許可範囲の確認まで保留。

## 注意(2026-10-22)
リポジトリ minkohno-hub/spice-herb-master は **public** と確認。全文(data/source/)は private 化が確認できるまで作成・pushしない。

## 補足資料(2026-10-22)
Googleドライブのフォルダ「スパイスハーブ検定」に同種のスクリーンショットがある(PNG、IMG_xxxx.PNG形式。全枚数は未集計)。
扱い: 補足資料。不足・判読不能があるときのみ参照する(D-007)。
GitHub 保存済み: data/source/images/ に147枚(リポジトリは private 確認済み)。
