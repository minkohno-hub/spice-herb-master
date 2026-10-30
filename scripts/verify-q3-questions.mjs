#!/usr/bin/env node
/**
 * 正式問題拡充Q3の独立検証パス（生成パイプラインとは独立に実行する）。
 *
 * 対象: scripts/q3-manual-questions.json（人手作成の一問一答データ）。
 * 生成スクリプト（scripts/generate-questions.mjs）とは別経路で、次を再確認する:
 *  1. 対象単位が実在し、verified かつ draftQa なしの散文単位（DECISIONS #18 の86件）であること
 *  2. 支持文（supportText）が、根拠ページの本文転記（src/data/transcripts/）に原文のまま
 *     含まれていること（ブロック本文・コラム・表セル単位で照合）
 *  3. 正答・許容回答がすべて支持文に字句として含まれていること
 *  4. 設問が既存の正式問題（生成済み formal-*.json 全件）および Q3 内で重複しないこと
 *     （形式+問題文の正規化一致を重複とする。プロジェクトの重複定義に同じ）
 *  5. 参考情報として、同一節（品目）の既存問題と正答が一致するものを列挙する
 *     （観点の重なりを人手で判定するための材料。自動では落とさない）
 * 結果は scripts/q3-verification-report.json に記録する。ハード失敗があれば exit 1。
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

function normalizeText(s) {
  let t = s.normalize("NFKC").toLowerCase().trim();
  t = t.replace(/[\s　]+/g, "");
  t = t.replace(/[。、,.・:：;；!！?？「」『』（）()\[\]"'’]/g, "");
  t = t.replace(/ー/g, "");
  return t;
}

// 知識単位
const knowledgeDir = join(repoRoot, "src", "data", "knowledge");
const unitFiles = [];
const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith(".json")) unitFiles.push(p); } };
walk(knowledgeDir);
const units = unitFiles.flatMap((f) => readJson(f));
const unitById = new Map(units.map((u) => [u.id, u]));
const proseUnits = units.filter((u) => u.status === "verified" && !u.draftQa && u.collation && u.kind !== "spice-profile");

// 転記（ページ→テキスト断片集合）
const tdir = join(repoRoot, "src", "data", "transcripts");
const pageFragments = new Map();
for (const f of readdirSync(tdir).filter((x) => x.endsWith(".json"))) {
  for (const pg of readJson(join(tdir, f))) {
    const frags = [];
    for (const b of pg.blocks) {
      if (b.text) frags.push(b.text);
      if (b.title) frags.push(b.title);
      if (b.rows) for (const row of b.rows) for (const cell of row) frags.push(cell);
    }
    pageFragments.set(pg.bookPage, frags);
  }
}

// 既存の正式問題（Q3 生成前は1,133問。生成後は Q3 分を含むため q1q3- を除いて数える）
const qdir = join(repoRoot, "src", "data", "questions");
const existing = readdirSync(qdir).filter((f) => f.startsWith("formal-")).flatMap((f) => readJson(join(qdir, f)));
const existingNonQ3 = existing.filter((q) => !q.id.startsWith("q1q3-"));

const manual = readJson(join(repoRoot, "scripts", "q3-manual-questions.json"));
const failures = [];
const siblingAnswerMatches = [];
const checked = [];

const proseIds = new Set(proseUnits.map((u) => u.id));
const covered = new Set();
const seenPrompts = new Map();
for (const q of existingNonQ3) seenPrompts.set(`one-answer|${normalizeText(q.prompt)}`, q.id);
for (const q of existingNonQ3) seenPrompts.set(`${q.format}|${normalizeText(q.prompt)}`, q.id);

for (const item of manual.questions) {
  const problems = [];
  const unit = unitById.get(item.unitId);
  if (!unit) { failures.push({ unitId: item.unitId, problems: ["単位が存在しない"] }); continue; }
  if (!proseIds.has(item.unitId)) problems.push("対象が verified・draftQaなし・非プロフィールの散文単位ではない");
  if (covered.has(item.unitId)) problems.push("同一単位に複数の問題がある");
  covered.add(item.unitId);
  // 支持文の転記照合
  const frags = pageFragments.get(item.supportPage);
  if (!frags) problems.push(`転記ページ p.${item.supportPage} が存在しない`);
  else if (!frags.some((f) => f.includes(item.supportText))) problems.push(`支持文が p.${item.supportPage} の転記本文に原文のまま含まれていない`);
  // 正答・許容回答が支持文に含まれること
  for (const a of [item.answer, ...(item.altAnswers ?? [])]) {
    if (!item.supportText.includes(a)) problems.push(`正答/許容回答「${a}」が支持文に含まれていない`);
  }
  // 設問の重複
  const key = `one-answer|${normalizeText(item.prompt)}`;
  if (seenPrompts.has(key)) problems.push(`設問が既存問題 ${seenPrompts.get(key)} と重複`);
  seenPrompts.set(key, `q1q3-${item.unitId}`);
  // 参考: 同一節の既存問題と正答一致
  const normAns = normalizeText(item.answer);
  for (const q of existingNonQ3) {
    const qu = unitById.get(q.knowledgeUnitIds[0]);
    if (!qu || qu.sectionTitle !== unit.sectionTitle) continue;
    const answers = q.format === "single-choice" ? [q.choices?.[q.correctChoiceIndexes?.[0]]] : (q.acceptedAnswers ?? []);
    if (answers.some((a) => a && normalizeText(a) === normAns)) {
      siblingAnswerMatches.push({ q3UnitId: item.unitId, q3Answer: item.answer, existingId: q.id, existingUnitId: q.knowledgeUnitIds[0], existingPrompt: q.prompt });
    }
  }
  checked.push({ unitId: item.unitId, supportPage: item.supportPage, ok: problems.length === 0 });
  if (problems.length) failures.push({ unitId: item.unitId, problems });
}

const uncovered = proseUnits.filter((u) => !covered.has(u.id)).map((u) => u.id);
const report = {
  meta: {
    verifiedBy: "scripts/verify-q3-questions.mjs",
    proseUnitsTotal: proseUnits.length,
    manualEntries: manual.questions.length,
    checkedOk: checked.filter((c) => c.ok).length,
    failures: failures.length,
    uncoveredUnits: uncovered,
    existingFormalQuestionsNonQ3: existingNonQ3.length,
    siblingAnswerMatches: siblingAnswerMatches.length,
  },
  checked,
  failures,
  siblingAnswerMatches,
};
writeFileSync(join(repoRoot, "scripts", "q3-verification-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(`検証対象: 散文単位 ${proseUnits.length}件 / 手書き問題 ${manual.questions.length}件`);
console.log(`合格: ${report.meta.checkedOk}件 / 失敗: ${failures.length}件 / 未作問単位: ${uncovered.length}件 [${uncovered.join(", ")}]`);
console.log(`既存正式問題（Q3除く）: ${existingNonQ3.length}問 / 同一節・正答一致の参考件数: ${siblingAnswerMatches.length}件`);
for (const f of failures) console.error("FAIL", f.unitId, f.problems.join(" / "));
for (const s of siblingAnswerMatches) console.log("SIBLING", JSON.stringify(s));
if (failures.length) process.exit(1);
