#!/usr/bin/env node
/**
 * 追加形式バッチF2の独立検証パス（生成パイプラインとは独立に実行する）。
 *
 * 対象: scripts/f2-manual-questions.json（人手作成の並べ替え・短文記述データ）。
 * 生成スクリプト（scripts/generate-questions.mjs）とは別経路で、次を再確認する:
 *  ordering:
 *   1. 対象単位が実在し、すべて verified（原文照合済み）であること
 *   2. 手順の各項目が、根拠ページの本文転記（src/data/transcripts/）に番号付きで原文どおり
 *      存在すること（mode: blocks / headings は「番号 + 半角空白 + 項目文」が転記フラグメントと
 *      完全一致、embedded は番号付き手順を連結した支持文がフラグメントに含まれること）
 *   3. 手順が3つ以上で項目に重複がないこと（3手順未満は自明なため作らない。DECISIONS #26）
 *   4. 生成済み問題（qord-*）の正解順序・設問・知識単位が手書きデータと一致し、初期表示順が
 *      正解順序の並べ替えであり正解順そのものではないこと
 *  short-essay:
 *   5. 対象単位が実在し verified であること
 *   6. 支持文（supportText）が根拠ページの転記本文に原文のまま含まれていること
 *   7. ルーブリックの要点が2点以上で、各要点のキーワードがすべて支持文に字句として
 *      含まれていること（模範解答＝支持文で全要点が一致し満点になる前提の確認）
 *   8. 生成済み問題（qse-*）の模範解答が支持文そのもので、ルーブリックが手書きデータと
 *      一致すること
 *  共通:
 *   9. 設問が既存の正式問題および F2 内で重複しないこと（形式+問題文の正規化一致を重複とする）
 * 結果は scripts/f2-verification-report.json に記録する。ハード失敗があれば exit 1。
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

// 転記（ページ→テキスト断片集合。verify-q3-questions.mjs と同じ規則）
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
const existingNonF2 = existing.filter((q) => !q.id.startsWith("qord-") && !q.id.startsWith("qse-"));

const manual = readJson(join(repoRoot, "scripts", "f2-manual-questions.json"));
const failures = [];
const checkedOrdering = [];
const checkedEssay = [];

const seenPrompts = new Map();
for (const q of existingNonF2) seenPrompts.set(`${q.format}|${normalizeText(q.prompt)}`, q.id);

// 監査A3（DECISIONS #28）の mergeGroups: 独立工程を統合した表示項目を手書きデータから再構成する
function displayItems(entry) {
  if (!entry.mergeGroups) return [...entry.items];
  const flat = entry.mergeGroups.flat();
  if (JSON.stringify(flat) !== JSON.stringify(entry.items.map((_, i) => i))) return null;
  if (entry.mergeGroups.some((g) => g.length === 0)) return null;
  return entry.mergeGroups.map((g) => g.map((i) => entry.items[i]).join(""));
}

function stepsVerbatim(entry) {
  const frags = pageFragments.get(entry.page) ?? [];
  if (entry.mode === "embedded") {
    const joined = entry.items.map((t, i) => `${i + 1} ${t}`).join("。") + "。";
    return joined === entry.supportText && frags.some((f) => f.includes(entry.supportText));
  }
  if (entry.mode !== "blocks" && entry.mode !== "headings") return false;
  return entry.items.every((t, i) => frags.some((f) => f === `${i + 1} ${t}`));
}

for (const entry of manual.ordering) {
  const problems = [];
  for (const id of entry.unitIds) {
    const u = unitById.get(id);
    if (!u) problems.push(`単位 ${id} が存在しない`);
    else if (u.status !== "verified" || !u.collation) problems.push(`単位 ${id} が verified でない`);
  }
  if (!pageFragments.has(entry.page)) problems.push(`転記ページ p.${entry.page} が存在しない`);
  else if (!stepsVerbatim(entry)) problems.push(`手順が転記本文 p.${entry.page} に番号どおり原文のまま存在しない（mode: ${entry.mode}）`);
  if (entry.items.length < 3) problems.push("手順が3つ未満");
  if (new Set(entry.items).size !== entry.items.length) problems.push("手順の項目に重複がある");
  const disp = displayItems(entry);
  if (disp === null) problems.push("mergeGroups が原文手順の分割でない（監査A3）");
  else if (disp.length < 3) problems.push("表示項目が3つ未満（監査A3）");
  const key = `ordering|${normalizeText(entry.prompt)}`;
  if (seenPrompts.has(key)) problems.push(`設問が既存問題 ${seenPrompts.get(key)} と重複`);
  seenPrompts.set(key, `qord-${entry.slug}`);
  const gen = existingById.get(`qord-${entry.slug}`);
  if (!gen) problems.push("生成済み問題 qord-" + entry.slug + " が存在しない");
  else {
    if (gen.format !== "ordering") problems.push("生成済み問題の形式が ordering でない");
    if (gen.prompt !== entry.prompt) problems.push("生成済み問題の設問が手書きデータと不一致");
    if (disp !== null && JSON.stringify(gen.correctOrder) !== JSON.stringify(disp)) problems.push("生成済み問題の正解順序が手書きデータの表示項目と不一致");
    if (disp !== null && JSON.stringify([...(gen.orderingItems ?? [])].sort()) !== JSON.stringify([...disp].sort())) problems.push("生成済み問題の並べ替え項目が表示項目と一致しない");
    if (JSON.stringify(gen.orderingItems) === JSON.stringify(gen.correctOrder)) problems.push("生成済み問題の初期表示順が正解順と一致している");
    if (JSON.stringify(gen.knowledgeUnitIds) !== JSON.stringify(entry.unitIds)) problems.push("生成済み問題の知識単位が手書きデータと不一致");
  }
  checkedOrdering.push({ slug: entry.slug, page: entry.page, steps: entry.items.length, ok: problems.length === 0 });
  if (problems.length) failures.push({ kind: "ordering", slug: entry.slug, problems });
}

for (const entry of manual.shortEssay) {
  const problems = [];
  const unit = unitById.get(entry.unitId);
  if (!unit) problems.push("単位が存在しない");
  else if (unit.status !== "verified" || !unit.collation) problems.push("単位が verified でない");
  const frags = pageFragments.get(entry.supportPage);
  if (!frags) problems.push(`転記ページ p.${entry.supportPage} が存在しない`);
  else if (!frags.some((f) => f.includes(entry.supportText))) problems.push(`支持文が p.${entry.supportPage} の転記本文に原文のまま含まれていない`);
  if (entry.rubric.length < 2) problems.push("要点が2点未満");
  for (const r of entry.rubric) {
    if (!r.keywords.length) problems.push(`要点 ${r.id} にキーワードがない`);
    for (const k of r.keywords) if (!entry.supportText.includes(k)) problems.push(`要点キーワード「${k}」が支持文に含まれていない`);
    // G1（DECISIONS #29）: 近接AND結合の断片もすべて支持文の字句でなければならない
    for (const g of r.keywordGroups ?? []) {
      if (g.length < 2) problems.push(`要点 ${r.id} の keywordGroups に断片が2つ未満の群がある`);
      for (const f of g) if (!entry.supportText.includes(f)) problems.push(`要点 ${r.id} の keywordGroups 断片「${f}」が支持文に含まれていない`);
    }
  }
  const key = `short-essay|${normalizeText(entry.prompt)}`;
  if (seenPrompts.has(key)) problems.push(`設問が既存問題 ${seenPrompts.get(key)} と重複`);
  seenPrompts.set(key, `qse-${entry.slug}`);
  const gen = existingById.get(`qse-${entry.slug}`);
  if (!gen) problems.push("生成済み問題 qse-" + entry.slug + " が存在しない");
  else {
    if (gen.format !== "short-essay") problems.push("生成済み問題の形式が short-essay でない");
    if (gen.prompt !== entry.prompt) problems.push("生成済み問題の設問が手書きデータと不一致");
    if (gen.modelAnswer !== entry.supportText) problems.push("生成済み問題の模範解答が支持文と不一致");
    if (JSON.stringify(gen.rubric) !== JSON.stringify(entry.rubric)) problems.push("生成済み問題のルーブリックが手書きデータと不一致");
    if (JSON.stringify(gen.knowledgeUnitIds) !== JSON.stringify([entry.unitId])) problems.push("生成済み問題の知識単位が手書きデータと不一致");
  }
  checkedEssay.push({ slug: entry.slug, unitId: entry.unitId, supportPage: entry.supportPage, points: entry.rubric.length, ok: problems.length === 0 });
  if (problems.length) failures.push({ kind: "short-essay", slug: entry.slug, problems });
}

const report = {
  meta: {
    verifiedBy: "scripts/verify-f2-questions.mjs",
    orderingEntries: manual.ordering.length,
    orderingOk: checkedOrdering.filter((c) => c.ok).length,
    shortEssayEntries: manual.shortEssay.length,
    shortEssayOk: checkedEssay.filter((c) => c.ok).length,
    failures: failures.length,
    skipped: manual.skipped.length,
    existingFormalQuestionsNonF2: existingNonF2.length,
  },
  ordering: checkedOrdering,
  shortEssay: checkedEssay,
  skipped: manual.skipped,
  failures,
};
writeFileSync(join(repoRoot, "scripts", "f2-verification-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(`検証対象: 並べ替え ${manual.ordering.length}件 / 短文記述 ${manual.shortEssay.length}件 / 見送り記録 ${manual.skipped.length}件`);
console.log(`合格: 並べ替え ${report.meta.orderingOk}件 / 短文記述 ${report.meta.shortEssayOk}件 / 失敗: ${failures.length}件`);
console.log(`既存正式問題（F2除く）: ${existingNonF2.length}問`);
for (const f of failures) console.error("FAIL", f.kind, f.slug, f.problems.join(" / "));
if (failures.length) process.exit(1);
