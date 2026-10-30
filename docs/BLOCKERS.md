# BLOCKERS — ブロッカーと保留事項

（2026-10-30 独立品質監査の修正バッチ7で全面更新）

## 解消済み
1. ~~**GitHub Pages公開: 保留**~~ → **解消（2026-10-30）**。ユーザーの明示選択によりリポジトリを public へ変更し、GitHub Pages で公開済み: https://sylpica.github.io/spice-herb-master/（2026-10-30 のアカウント名変更 minkohno-hub → sylpica に伴いURL移行。旧URLは転送されない）
2. ~~**教科書本文の転記: 未着手**~~ → **解消（2026-10-30）**。転記133ページ・85,586文字（Drive 実在範囲の番号付き本文ページ＋章扉3葉）。詳細は `docs/TRANSCRIPTION.md`。

## 継続中
3. **IMG_9647.PNG: Driveに存在しない。** 前後ページ照合により番号なし扉ページと強く推察されるが内容は未確認。実物の再アップロードまたは原本確認があれば確定できる（ユーザー操作が必要な場合はその時に依頼）。
4. **p.141以降（2級・1級用予想問題と索引）の転記: 原本不在のため BLOCKED。** Drive に画像が存在せず照合不能。原本が追加されれば転記できる。
5. **GitHub Actions ワークフローの反映制限（既知）**: Muse GitHub App には workflows 権限がなく `.github/workflows/` 配下をコネクタ経由で書けない（403）。是正計画（監査 AD-7）: 監査ブランチ上に GitHub Web UI から改訂版 ci.yml を配置し、PR 上で CI を稼働させる。
6. **実機検証**: iPhone Safari / PWA実機・スクリーンリーダー検証は未実施（監査では NOT TESTED）。ユーザー端末での確認が必要な段階で依頼する。
7. ~~**npm audit のローカル実施: BLOCKED**~~ → **CI で実施・対応済み（2026-10-30）**。ローカルでは当VMのレジストリプロキシが 403 を返すため今も実施不能だが、CI（PR #2）の初回実行で監査が回り、7件（low 4・moderate 1・critical 2）を検出した。critical 2件は vitest 経由の tinypool（プロトタイプ汚染→RCE）で、vitest を 3.2.7 から 4.1.12 へ更新して解消した（4.1.12 では tinypool への依存自体が消滅。あわせて @vitest/mocker の moderate も 4.1.12 で解消）。いずれも開発・ビルド時の依存で、公開アプリの実行時依存（react・react-dom・react-router の3件）には含まれない。残る deepmerge（vite-plugin-pwa 経由、low〜moderate）は本ゲート（--audit-level=high）の対象外として記録し、CI で継続照合する。
8. **写真の収録**: 教科書の写真そのものはアプリに収録していない（キャプション文のみ）。収録の要否は出版社許諾の範囲（DECISIONS #12）の判断待ちで、現行方針は監査 AD-10 で維持と決定済み。
