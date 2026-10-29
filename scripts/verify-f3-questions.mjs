#!/usr/bin/env node
/**
 * 追加形式バッチF3の独立検証パス（生成パイプラインとは独立に実行する）。
 *
 * 対象: scripts/f3-manual-questions.json（人手作成の長文記述・比較記述データ）。
 * 生成スクリプト（scripts/generate-questions.mjs）とは別経路で、次を再確認する:
 *  共通:
 *   1. 対象単位がすべて実在し verified（原文照合済み）であること
 *   2. 各支持文（supports[].text）が、そのページの本文転記（src/data/transcripts/）に
 *      原文のまま含まれていること
 *   3. ルーブリックの各要点のキーワードがすべて支持範囲（支持文の連結）に字句として
 *      含まれていること（模範解答＝支持文の連結で全要点が一致し満点になる前提の確認）
 *   4. 生成済み問題の模範解答が支持文の連結そのもので、ルーブリック・設問・知識単位が
 *      手書きデータと一致すること
 *   5. 設問が既存の正式問題および F3 内で重複しないこと（形式+問題文の正規化一致を重複とする）
 *  long-essay（DECISIONS #27 の短文記述との区別基準）:
 *   6. 支持範囲が2つ以上の転記ブロックにまたがり、模範解答が300字以上・5文以上、
 *      要点が4点以上であること
 *  compare-essay:
 *   7. 要点が4点以上であること
 * 結果は scripts/f3-verification-report.json に記録する。ハード失敗があれば exit 1。
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

// 転記（ページ→テキスト断片集合。verify-f2-questions.mjs と同じ規則）
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

// 生成済みの正式問題
const qdir = join(repoRoot, "src", "data", "questions");
const existing = readdirSync(qdir).filter((f) => f.startsWith("formal-")).flatMap((f) => readJson(join(qdir, f)));
const existingById = new Map(existing.map((q) => [q.id, q]));
const existingNonF3 = existing.filter((q) => !q.id.startsWith("qle-") && !q.id.startsWith("qce-"));

const manual = readJson(join(repoRoot, "scripts", "f3-manual-questions.json"));
const failures = [];
const checkedLong = [];
const checkedCompare = [];

const seenPrompts = new Map();
for (const q of existingNonF3) seenPrompts.set(`${q.format}|${normalizeText(q.prompt)}`, q.id);

function checkEntry(entry, kind, prefix) {
  const problems = [];
  for (const id of entry.unitIds) {
    const u = unitById.get(id);
    if (!u) problems.push(`単位 ${id} が存在しない`);
    else if (u.status !== "verified" || !u.collation) problems.push(`単位 ${id} が verified でない`);
  }
  const union = entry.supports.map((s) => s.text).join("\n");
  for (const s of entry.supports) {
    const frags = pageFragments.get(s.page);
    if (!frags) problems.push(`転記ページ p.${s.page} が存在しない`);
    else if (!frags.some((f) => f.includes(s.text))) problems.push(`支持文が転記本文 p.${s.page} に原文のまま含まれていない: ${s.text.slice(0, 30)}…`);
  }
  const sentences = (union.match(/。/g) || []).length;
  if (kind === "long-essay") {
    if (entry.supports.length < 2) problems.push("長文記述の支持範囲が2ブロック未満（短文記述との区別基準。DECISIONS #27）");
    if (union.length < 300) problems.push(`長文記述の模範解答が300字未満（実測 ${union.length} 字）`);
    if (sentences < 5) problems.push(`長文記述の模範解答が5文未満（実測 ${sentences} 文）`);
  }
  if (entry.rubric.length < 4) problems.push("要点が4点未満");
  for (const r of entry.rubric) {
    if (!r.keywords.length) problems.push(`要点 ${r.id} にキーワードがない`);
    for (const k of r.keywords) if (!union.includes(k)) problems.push(`要点キーワード「${k}」が支持範囲に含まれていない`);
    // G1（DECISIONS #29）: 近接AND結合の断片もすべて支持範囲の字句でなければならない。
    // subject（対象名）はキーワードではなく結合メタデータであり、設問に含まれる対象名でなければならない
    for (const g of r.keywordGroups ?? []) {
      if (g.length < 2) problems.push(`要点 ${r.id} の keywordGroups に断片が2つ未満の群がある`);
      for (const f of g) if (!union.includes(f)) problems.push(`要点 ${r.id} の keywordGroups 断片「${f}」が支持範囲に含まれていない`);
    }
    if (r.subject && !entry.prompt.includes(r.subject)) problems.push(`要点 ${r.id} の subject「${r.subject}」が設問に含まれていない`);
  }
  const key = `${kind}|${normalizeText(entry.prompt)}`;
  if (seenPrompts.has(key)) problems.push(`設問が既存問題 ${seenPrompts.get(key)} と重複`);
  seenPrompts.set(key, `${prefix}-${entry.slug}`);
  const gen = existingById.get(`${prefix}-${entry.slug}`);
  if (!gen) problems.push(`生成済み問題 ${prefix}-${entry.slug} が存在しない`);
  else {
    if (gen.format !== kind) problems.push(`生成済み問題の形式が ${kind} でない`);
    if (gen.prompt !== entry.prompt) problems.push("生成済み問題の設問が手書きデータと不一致");
    if (gen.modelAnswer !== union) problems.push("生成済み問題の模範解答が支持文の連結と不一致");
    if (JSON.stringify(gen.rubric) !== JSON.stringify(entry.rubric)) problems.push("生成済み問題のルーブリックが手書きデータと不一致");
    if (JSON.stringify(gen.knowledgeUnitIds) !== JSON.stringify(entry.unitIds)) problems.push("生成済み問題の知識単位が手書きデータと不一致");
  }
  const rec = { slug: entry.slug, unitIds: entry.unitIds, supportPages: [...new Set(entry.supports.map((s) => s.page))], supports: entry.supports.length, modelAnswerChars: union.length, sentences, points: entry.rubric.length, ok: problems.length === 0 };
  if (problems.length) failures.push({ kind, slug: entry.slug, problems });
  return rec;
}

for (const entry of manual.longEssay) checkedLong.push(checkEntry(entry, "long-essay", "qle"));
for (const entry of manual.compareEssay) checkedCompare.push(checkEntry(entry, "compare-essay", "qce"));

const report = {
  meta: {
    verifiedBy: "scripts/verify-f3-questions.mjs",
    longEssayEntries: manual.longEssay.length,
    longEssayOk: checkedLong.filter((c) => c.ok).length,
    compareEssayEntries: manual.compareEssay.length,
    compareEssayOk: checkedCompare.filter((c) => c.ok).length,
    failures: failures.length,
    skipped: manual.skipped.length,
    existingFormalQuestionsNonF3: existingNonF3.length,
  },
  longEssay: checkedLong,
  compareEssay: checkedCompare,
  skipped: manual.skipped,
  failures,
};
writeFileSync(join(repoRoot, "scripts", "f3-verification-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(`検証対象: 長文記述 ${manual.longEssay.length}件 / 比較記述 ${manual.compareEssay.length}件 / 見送り記録 ${manual.skipped.length}件`);
console.log(`合格: 長文記述 ${report.meta.longEssayOk}件 / 比較記述 ${report.meta.compareEssayOk}件 / 失敗: ${failures.length}件`);
console.log(`既存正式問題（F3除く）: ${existingNonF3.length}問`);
for (const f of failures) console.error("FAIL", f.kind, f.slug, f.problems.join(" / "));
if (failures.length) process.exit(1);
