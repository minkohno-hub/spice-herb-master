#!/usr/bin/env node
/**
 * F2/F3形式の意味的監査バッチA3: 機械的スクリーニング + 精査判定の集約（決定的・再実行可能）。
 *
 * 対象: 追加形式F2（docs/DECISIONS.md #26）・F3（#27）で追加した全41問
 *   - ordering（並べ替え）18問: 項目同士を入れ替えても意味・手順として成立してしまう
 *     別解（順序の非一意性）がないか
 *   - short-essay 12問 / long-essay 4問 / compare-essay 7問（記述式29問）:
 *     ルーブリック要点キーワードの狭さ（原文に即した正しい言い換え・常体・括弧注記省略を
 *     不当に落とさないか）と緩さ（無関係・取り違えた回答が満点にならないか）、
 *     設問が求める観点のルーブリックでのカバレッジ
 * 方針（docs/QUESTION_QUALITY.md / docs/DECISIONS.md #28）:
 * - A1/A2 と違い、本バッチはサンプルではなく対象41問の全件を精査する（スクリーニングは
 *   精査の観点を機械的に洗い出す補助であり、検出の有無にかかわらず全件に判定があることを
 *   本スクリプトが検証する）。
 * - 判定は転記本文（src/data/transcripts/）・F2/F3手書きデータの支持文のみに根拠を求め、
 *   教科書の範囲を超える知識では判定しない。根拠が確定できないもの、データ側
 *   （手書きデータ／生成器）では直せず採点エンジン（src/domain/grading.ts）の仕様変更が
 *   必要なものは「要確認」とし、エンジンは変更しない。
 * - 精査判定（真の問題 / 問題なし / 要確認）と根拠は手書きデータ
 *   scripts/f2f3-audit-a3-verdicts.json に保持し、本スクリプトがレポートへ集約する。
 *
 * スクリーニング観点:
 *   並べ替え O-A 隣接ペアで、後続項目が先行項目を番号で参照していない（入れ替え候補）
 *            O-B 項目内に別の対象の開始を示す「〜を作る。」を含む（副レシピ・並列工程候補）
 *            O-C 項目が工程ではなく理由・原則の説明で終わる（原則列挙の候補）
 *   記述式   E-A キーワードが2字以下（単漢字キーワードの緩さ候補）
 *            E-B キーワードが敬体語尾（います／ます）で終わる（常体の正答を落とす候補）
 *            E-C キーワードに括弧注記を含む（別名・補足表記まで必須になる候補）
 *            E-D キーワードが名詞＋数字＋単位の連結（助詞を入れた正答を落とす候補）
 *            E-E 比較記述で、キーワードが比較対象の主語トークンを一切含まない
 *                （属性の取り違えでも一致する候補。主語トークンは設問の比較対象から取る）
 *
 * 入力: src/data/questions/formal-*.json、scripts/f2-manual-questions.json、
 *       scripts/f3-manual-questions.json、scripts/f2f3-audit-a3-verdicts.json
 * 出力: scripts/f2f3-audit-a3-report.json
 *
 * 注意: レポートは監査時点（修正前データ）のスナップショットである。真の問題は
 * 手書きデータと生成器の mergeGroups ガードで修正済みで、修正後の再生成では対象問題
 * だけが変わることを差分で確認した（docs/DECISIONS.md #28）。修正後のデータで本
 * スクリプトを再実行すると解消済みの検出が変わるため、集約値は修正前データに対して
 * のみ一致する（A1/A2レポートと同じ運用）。
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

// ---- 入力読み込み
const qDir = join(repoRoot, "src", "data", "questions");
const questions = [];
for (const f of readdirSync(qDir).filter((x) => x.startsWith("formal-")).sort()) questions.push(...readJson(join(qDir, f)));
const FORMATS = ["ordering", "short-essay", "long-essay", "compare-essay"];
const targets = questions.filter((q) => FORMATS.includes(q.format));
const verdicts = readJson(join(repoRoot, "scripts", "f2f3-audit-a3-verdicts.json")).verdicts;
const verdictById = new Map(verdicts.map((v) => [v.questionId, v]));

// 比較記述の主語トークン（設問が比較対象として挙げる名称。E-E観点用）
const SUBJECT_TOKENS = {
  "qce-cinnamon-cassia": ["シナモン", "カシア"],
  "qce-sansho-huajiao": ["山椒", "花椒"],
  "qce-three-peppers": ["ブラックペッパー", "ホワイトペッパー", "グリーンペッパー", "ブラック", "ホワイト", "グリーン"],
  "qce-japan-europe-spice": ["日本", "ヨーロッパ", "東南アジア"],
  "qce-fresh-dry-amount": ["フレッシュ", "ドライ"],
  "qce-pots": ["素焼き", "プラスチック"],
  "qce-rosemary-types": ["立性", "ほふく性", "半立性", "ローズマリー"],
};

// ---- スクリーニング
const detections = []; // {questionId, format, view, detail}
const detect = (q, view, detail) => detections.push({ questionId: q.id, format: q.format, view, detail });

for (const q of targets) {
  if (q.format === "ordering") {
    const items = q.correctOrder ?? [];
    items.forEach((t, i) => {
      if (i > 0) {
        // O-A: 直前項目への番号参照（「Nを」「Nと」「Nの」）が後続項目にない
        const refsPrev = new RegExp(`${i}(を|と|の|、)`).test(t);
        if (!refsPrev) detect(q, "O-A", `項目${i + 1}は直前項目${i}を番号で参照していない`);
      }
      // O-B: 副レシピの開始
      if (/^.+を作る。/.test(t) || /。[^。]*を作る。/.test(t)) detect(q, "O-B", `項目${i + 1}に「〜を作る。」の開始を含む`);
      // O-C: 理由・原則の説明で終わる項目
      if (/(ため|原因に|おそれがあるため)。?$/.test(t.trim())) detect(q, "O-C", `項目${i + 1}は理由・原則の説明を含む`);
    });
  } else {
    for (const r of q.rubric ?? []) {
      for (const k of r.keywords) {
        if (k.length <= 2) detect(q, "E-A", `要点 ${r.id} のキーワード「${k}」が2字以下`);
        if (/(います|ます)$/.test(k)) detect(q, "E-B", `要点 ${r.id} のキーワード「${k}」が敬体語尾で終わる`);
        if (k.includes("（")) detect(q, "E-C", `要点 ${r.id} のキーワード「${k}」に括弧注記を含む`);
        if (/[一-龠ァ-ヶー][0-9０-９]/.test(k)) detect(q, "E-D", `要点 ${r.id} のキーワード「${k}」が名詞＋数字の連結`);
        if (q.format === "compare-essay") {
          const toks = SUBJECT_TOKENS[q.id] ?? [];
          if (toks.length && !toks.some((s) => k.includes(s))) detect(q, "E-E", `要点 ${r.id} のキーワード「${k}」が比較対象の主語を含まない`);
        }
      }
    }
  }
}

// ---- 全件カバレッジ検証（対象41問すべてに判定があること）
const problems = [];
if (verdicts.length !== targets.length) problems.push(`判定が ${verdicts.length} 件で対象 ${targets.length} 件と一致しない`);
for (const q of targets) {
  const v = verdictById.get(q.id);
  if (!v) problems.push(`${q.id}: 判定がない`);
  else {
    if (v.format !== q.format) problems.push(`${q.id}: 判定の形式が不一致`);
    if (!["真の問題", "問題なし", "要確認"].includes(v.verdict)) problems.push(`${q.id}: 判定値が不正`);
    if (!v.basis) problems.push(`${q.id}: 根拠がない`);
    if (v.verdict === "真の問題" && !v.fix) problems.push(`${q.id}: 真の問題に修正方法の記録がない`);
  }
}
for (const v of verdicts) if (!targets.some((q) => q.id === v.questionId)) problems.push(`${v.questionId}: 対象外の判定がある`);
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }

// ---- 集約
const countBy = (arr, keyFn) => { const m = {}; for (const x of arr) { const k = keyFn(x); m[k] = (m[k] ?? 0) + 1; } return m; };
const report = {
  meta: {
    batch: "A3",
    note: "監査時点（修正前データ）のスナップショット。真の問題の修正は手書きデータ／生成器側で行い、再生成差分が対象以外に及ばないことを確認した（docs/DECISIONS.md #28）。",
    targets: targets.length,
    targetsByFormat: countBy(targets, (q) => q.format),
    detectedQuestions: new Set(detections.map((d) => d.questionId)).size,
    detectionsByView: countBy(detections, (d) => d.view),
    verdicts: countBy(verdicts, (v) => v.verdict),
    verdictsByFormat: Object.fromEntries(FORMATS.map((f) => [f, countBy(verdicts.filter((v) => v.format === f), (v) => v.verdict)])),
    coverage: "対象41問の全件精査（サンプル精査なし）",
  },
  detections,
  verdicts,
};
writeFileSync(join(repoRoot, "scripts", "f2f3-audit-a3-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(`対象: ${targets.length}問（${JSON.stringify(report.meta.targetsByFormat)}）`);
console.log(`検出: ${report.meta.detectedQuestions}問 / 延べ ${detections.length}件（${JSON.stringify(report.meta.detectionsByView)}）`);
console.log(`判定: ${JSON.stringify(report.meta.verdicts)}`);
