#!/usr/bin/env node
/**
 * 四択誤答の意味的監査バッチA1: 機械的スクリーニング + 精査判定の集約（決定的・再実行可能）。
 *
 * 対象: 正式問題の single-choice 全486問（draftQa由来 q4-* 379問 + プロフィール属性由来 qsc-* 107問）。
 * 方針（docs/QUESTION_QUALITY.md / docs/DECISIONS.md #20）:
 * - 誤答が「別の正答になり得る値」でないかを機械的にスクリーニングし、検出された問題は
 *   転記本文（src/data/transcripts/）と照合済み単位 content に照らして1件ずつ精査する。
 * - 検出されなかった問題も章（問題の chapterId）ごとに10%（切り上げ・最低1件）を決定的に
 *   サンプル抽出して精査する。
 * - 精査判定（真の問題 / 問題なし / 要確認）と根拠は手書きデータ
 *   scripts/distractor-audit-a1-verdicts.json に保持し、本スクリプトが
 *   「検出・サンプル全件に判定があること」を検証してレポートへ集約する。
 * - 判定根拠は転記本文・照合済み単位のみに求め、教科書の範囲を超える知識では判定しない。
 *   根拠が確認できないものは「要確認」として残す（検証状態を偽らない）。
 *
 * スクリーニング観点:
 *   A1 誤答が正答と正規化後一致 / 部分文字列の相互包含（基部形でも判定）
 *   A2 同一問題内で誤答同士が正規化後一致 / 部分文字列の相互包含 / 基部一致
 *   B  誤答が生成元単位 content に出現（既存の曖昧さガードの再検証）
 *   C1 誤答の複合値トークン集合が正答のトークン集合の部分集合（包含関係）
 *   C2 誤答と正答が複合値トークンを共有（プロフィール属性由来 qsc のみ）
 *   D1 正答がプロフィール品目グループ（名称・別名）に属し、誤答が同グループの値と一致
 *   D2 正答が同グループに属し、誤答が同グループの別名を含む複合名
 *   D3 誤答が対象品目（生成元単位の spice）の名称バリアントを含む複合名
 *   D4 誤答が対象品目のプロフィール属性（科名・原産地・利用部位）のトークンと一致
 *   E  「例を1つ挙げよ」形式（他の有効な例が誤答に入ると別解になる）
 *   F  否定選択形式（「〜には入らない」等。指示と正答の整合を精査）
 *   G  設問文中の科名に属する品目が誤答にある（分類条件の充足を精査）
 *   H  誤答と正答が出典ページの同一転記ブロックに共存（同一リスト・同一表の可能性）
 *   I  誤答の出所単位が対象と同一品目で、設問の述語分類（別名・原産地・成分等）を共有
 *
 * 入力: src/data/questions/formal-*.json、src/data/knowledge/ 配下JSON、
 *       src/data/transcripts/ 配下JSON、scripts/distractor-audit-a1-verdicts.json
 * 出力: scripts/distractor-audit-a1-report.json
 *
 * 注意: レポートは監査時点（修正前データ）のスナップショットである。真の問題2件は
 * scripts/distractor-audit-exclusions.json 経由で生成パイプライン側を修正済みで、
 * 修正後の再生成では当該2問の選択肢だけが変わることを差分で確認した（docs/DECISIONS.md #20）。
 * 修正後のデータで本スクリプトを再実行すると、解消済みの2件の検出・サンプル構成が変わるため、
 * 判定カバレッジ検証は修正前データに対してのみ一致する（次回監査はバッチA2として新たに行う）。
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

// ---- 正規化（scripts/generate-questions.mjs と同じ規則）
function normalizeText(s) {
  let t = s.normalize("NFKC").toLowerCase().trim();
  t = t.replace(/[\s　]+/g, "");
  t = t.replace(/[。、,.・:：;；!！?？「」『』（）()\[\]"'’]/g, "");
  t = t.replace(/ー/g, "");
  return t;
}
function fnv(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h;
}
const baseForm = (s) => s.replace(/[(（].*$/, "").trim();
const valueTokens = (s) => s.split(/[、,，・/／]+/).map((x) => x.trim()).filter(Boolean);

// ---- 入力読み込み
const qDir = join(repoRoot, "src", "data", "questions");
const questions = [];
for (const f of readdirSync(qDir).filter((x) => x.startsWith("formal-")).sort()) questions.push(...readJson(join(qDir, f)));
const targets = questions.filter((q) => q.format === "single-choice");

const knowledgeDir = join(repoRoot, "src", "data", "knowledge");
const unitFiles = [];
const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith(".json")) unitFiles.push(p); } };
walk(knowledgeDir);
unitFiles.sort();
const units = unitFiles.flatMap((f) => readJson(f));
const unitById = new Map(units.map((u) => [u.id, u]));

const transcriptDir = join(repoRoot, "src", "data", "transcripts");
const pageBlocks = new Map();
for (const f of readdirSync(transcriptDir).filter((x) => x.endsWith(".json")).sort()) {
  for (const pg of readJson(join(transcriptDir, f))) {
    const blocks = [];
    for (const b of pg.blocks) {
      if (b.text) blocks.push(b.text);
      if (b.title) blocks.push(b.title);
      if (b.rows) for (const row of b.rows) blocks.push(row.join(" | "));
    }
    pageBlocks.set(pg.bookPage, blocks);
  }
}

// ---- プロフィール品目グループ（名称・別名 = 同一品目の同義集合。生成器の parseProfile と同じ抽出）
function parseProfile(content) {
  const g = (re) => content.match(re)?.[1] ?? null;
  return {
    name: g(/^(.+?):\s/), family: g(/科名は(.+?)。/), origin: g(/原産地は(.+?)。/),
    part: g(/利用部位は(.+?)。/), aliasesRaw: g(/別名は(.+?)。/), levels: g(/検定(.+?)級の対象。/),
  };
}
const spiceGroups = new Map(); // spiceId -> { variants: string[], aliases: string[], profile, unitId }
for (const u of units) {
  if (u.kind !== "spice-profile") continue;
  const p = parseProfile(u.content);
  if (!p.name) continue;
  const variants = [];
  const aliases = [];
  const push = (arr, v) => { if (v && !arr.includes(v)) arr.push(v); };
  for (const part of p.name.split("/")) {
    push(variants, part.trim()); push(variants, baseForm(part));
    const inner = part.match(/[(（](.+)[)）]/)?.[1]; if (inner) push(variants, inner);
  }
  for (const tok of (p.aliasesRaw ?? "").split("、")) {
    if (!tok.trim()) continue;
    push(variants, tok.trim()); push(variants, baseForm(tok));
    push(aliases, tok.trim()); push(aliases, baseForm(tok));
  }
  spiceGroups.set(u.spice?.id ?? u.id, { variants: variants.filter(Boolean), aliases: aliases.filter(Boolean), profile: p, unitId: u.id });
}
const spiceOfValue = (s) => {
  const n = normalizeText(s);
  for (const [k, g] of spiceGroups) if (g.variants.some((v) => normalizeText(v) === n)) return k;
  return null;
};
// draftQa 回答 -> 出所単位（誤答の来歴）
const answerSources = new Map();
for (const u of units) {
  if (!u.draftQa) continue;
  if (!answerSources.has(u.draftQa.a)) answerSources.set(u.draftQa.a, []);
  answerSources.get(u.draftQa.a).push(u);
}
// 述語分類（I観点: 同一品目・同一述語の出所単位は別解リスクが高い）
const PREDICATES = [
  ["別名・名称", /別名|呼び名|呼ばれ|和名|現地名|漢方名|生薬名|インド名|タイ名|名称|名前/],
  ["語源・意味", /語源|意味/],
  ["原産地", /原産/],
  ["科名", /科/],
  ["利用部位", /部位/],
  ["成分", /成分/],
  ["年代", /年|いつ|世紀|時代/],
  ["人物", /人物|王|博士|誰|美食家|著者/],
  ["数量", /何種|何年|何倍|何分|何度|何cm|何g|何本|何回|何枚|何杯|いくつ/],
];
const predicatesOf = (s) => PREDICATES.filter(([, re]) => re.test(s)).map(([k]) => k);

// ---- スクリーニング
const CATEGORIES = {
  A1: "誤答が正答と正規化後一致/部分文字列の相互包含",
  A2: "誤答同士の正規化後一致/部分文字列の相互包含/基部一致",
  B: "誤答が生成元単位 content に出現",
  C1: "誤答の複合値トークンが正答のトークン集合に包含される",
  C2: "誤答と正答が複合値トークンを共有（qsc属性値）",
  D1: "誤答が正答と同一品目の別名・名称バリアントと一致",
  D2: "誤答が正答と同一品目の別名を含む複合名",
  D3: "誤答が対象品目の名称バリアントを含む複合名",
  D4: "誤答が対象品目のプロフィール属性トークンと一致",
  E: "「例を1つ」形式（他の有効な例が誤答にないか）",
  F: "否定選択形式（指示と正答の整合）",
  G: "設問文中の科名に属する品目が誤答にある",
  H: "誤答と正答が出典ページの同一転記ブロックに共存",
  I: "誤答の出所単位が同一品目かつ述語分類を共有",
};
const findings = new Map(); // questionId -> [{category, distractor, detail}]
const addFinding = (q, category, distractor, detail) => {
  if (!findings.has(q.id)) findings.set(q.id, []);
  findings.get(q.id).push({ category, distractor, detail });
};

for (const q of targets) {
  const unit = unitById.get(q.knowledgeUnitIds[0]);
  const answer = q.choices[q.correctChoiceIndexes[0]];
  const distractors = q.choices.filter((_, i) => i !== q.correctChoiceIndexes[0]);
  const nAns = normalizeText(answer);
  const nAnsBase = normalizeText(baseForm(answer));
  const nContent = normalizeText(unit.content);
  const ansTokens = new Set(valueTokens(answer).map((t) => normalizeText(baseForm(t))).filter(Boolean));

  for (const d of distractors) {
    const nd = normalizeText(d);
    const ndBase = normalizeText(baseForm(d));
    // A1
    if (nd === nAns || nd.includes(nAns) || nAns.includes(nd)) addFinding(q, "A1", d, `正答「${answer}」と正規化後一致/包含`);
    else if (ndBase === nAnsBase || (ndBase.length >= 2 && (ndBase.includes(nAnsBase) || nAnsBase.includes(ndBase)))) addFinding(q, "A1", d, `正答「${answer}」と基部形で一致/包含`);
    // B
    if (nd.length >= 2 && nContent.includes(nd)) addFinding(q, "B", d, "生成元単位 content に出現");
    // C1/C2
    const dToks = valueTokens(d).map((t) => normalizeText(baseForm(t))).filter(Boolean);
    if (dToks.length) {
      if (dToks.every((t) => ansTokens.has(t))) addFinding(q, "C1", d, `トークン ${JSON.stringify(dToks)} が正答「${answer}」のトークン集合に包含`);
      else if (q.id.startsWith("qsc-") && dToks.some((t) => ansTokens.has(t))) addFinding(q, "C2", d, `正答「${answer}」とトークン ${JSON.stringify(dToks.filter((t) => ansTokens.has(t)))} を共有`);
    }
    // D1/D2: 正答が品目グループに属する場合
    const ansSpice = spiceOfValue(answer);
    if (ansSpice) {
      const g = spiceGroups.get(ansSpice);
      if (g.variants.some((v) => normalizeText(v) === nd)) addFinding(q, "D1", d, `正答「${answer}」と同一品目（${ansSpice}）の名称/別名と一致`);
      else if (g.aliases.some((v) => { const nv = normalizeText(v); return nv.length >= 2 && nd.includes(nv); })) addFinding(q, "D2", d, `正答「${answer}」と同一品目（${ansSpice}）の別名を含む複合名`);
    }
    // D3/D4: 対象品目（生成元単位の spice）
    const subj = unit.spice?.id;
    if (subj && spiceGroups.has(subj)) {
      const g = spiceGroups.get(subj);
      if (g.variants.some((v) => { const nv = normalizeText(v); return nv.length >= 2 && nd !== nv && nd.includes(nv); })) addFinding(q, "D3", d, `対象品目（${subj}）の名称バリアントを含む複合名`);
      for (const [key, label] of [["family", "科名"], ["origin", "原産地"], ["part", "利用部位"]]) {
        if (!g.profile[key]) continue;
        if (normalizeText(g.profile[key]) === nd) addFinding(q, "D4", d, `対象品目の${label}全文「${g.profile[key]}」と一致`);
        else if (valueTokens(g.profile[key]).some((t) => normalizeText(baseForm(t)) === nd)) addFinding(q, "D4", d, `対象品目の${label}トークンと一致`);
      }
    }
    // G
    const famMatch = q.prompt.match(/([ァ-ヶ一-龠]{2,}科)/);
    if (famMatch) {
      const ds = spiceOfValue(d);
      if (ds && spiceGroups.get(ds)?.profile.family === famMatch[1]) addFinding(q, "G", d, `設問中の「${famMatch[1]}」に属する品目`);
    }
    // H
    if (nd.length >= 2) {
      for (const b of pageBlocks.get(unit.source.page) ?? []) {
        const nb = normalizeText(b);
        if (nb.includes(nd) && nb.includes(nAns)) { addFinding(q, "H", d, `出典ページ p.${unit.source.page} の同一転記ブロックに正答と共存: ${b.slice(0, 120)}`); break; }
      }
    }
    // I（q4のみ: 誤答の来歴が追える）
    if (q.id.startsWith("q4-")) {
      const pq = predicatesOf(q.prompt);
      if (pq.length && unit.spice) {
        for (const su of answerSources.get(d) ?? []) {
          if (su.spice?.id === unit.spice.id) {
            const shared = pq.filter((x) => predicatesOf(su.draftQa.q).includes(x));
            if (shared.length) addFinding(q, "I", d, `出所単位 ${su.id}（同一品目）が述語「${shared.join("・")}」を共有: ${su.draftQa.q}`);
          }
        }
      }
    }
  }
  // A2: 誤答同士
  for (let i = 0; i < distractors.length; i++) for (let j = i + 1; j < distractors.length; j++) {
    const a = normalizeText(distractors[i]), b = normalizeText(distractors[j]);
    const ab = normalizeText(baseForm(distractors[i])), bb = normalizeText(baseForm(distractors[j]));
    if (a === b || a.includes(b) || b.includes(a)) addFinding(q, "A2", distractors[j], `誤答「${distractors[i]}」と正規化後一致/包含`);
    else if (ab === bb) addFinding(q, "A2", distractors[j], `誤答「${distractors[i]}」と基部一致`);
    else if (q.id.startsWith("qsc-")) {
      const ta = new Set(valueTokens(distractors[i]).map((t) => normalizeText(baseForm(t))).filter((t) => t.length >= 2));
      const shared = valueTokens(distractors[j]).map((t) => normalizeText(baseForm(t))).filter((t) => ta.has(t));
      if (shared.length) addFinding(q, "A2", distractors[j], `誤答「${distractors[i]}」とトークン ${JSON.stringify(shared)} を共有`);
    }
  }
  // E / F: 設問形式
  if (/例を1つ|1つ挙げよ|例を挙げよ/.test(q.prompt)) addFinding(q, "E", null, "「例を1つ」形式: 単位 content・転記の列挙に他の有効な例がないか精査");
  if (/入らない|でないもの|含まれない|誤っている|当てはまらない|適切でない|正しくない|除く/.test(q.prompt)) addFinding(q, "F", null, "否定選択形式: 設問の指示と正答・誤答の整合を精査");
}

// ---- サンプル抽出（未検出問題から章ごとに10%・切り上げ・最低1件、ハッシュ順で決定的）
const flaggedIds = new Set(findings.keys());
const byChapter = new Map();
for (const q of targets) { if (!byChapter.has(q.chapterId)) byChapter.set(q.chapterId, []); byChapter.get(q.chapterId).push(q); }
const sampleIds = [];
const sampleByChapter = {};
for (const [ch, qs] of [...byChapter.entries()].sort()) {
  const unflagged = qs.filter((q) => !flaggedIds.has(q.id));
  const n = Math.max(1, Math.ceil(unflagged.length * 0.1));
  const sorted = [...unflagged].sort((x, y) => fnv(`a1-sample|${x.id}`) - fnv(`a1-sample|${y.id}`) || (x.id < y.id ? -1 : 1));
  const picked = sorted.slice(0, n).map((q) => q.id);
  sampleIds.push(...picked);
  sampleByChapter[ch] = { chapterTargets: qs.length, unflagged: unflagged.length, sampled: picked.length, sampleIds: picked };
}

// ---- 精査判定の集約（手書き判定データが全検出・全サンプルを覆うことを検証）
const verdictsData = readJson(join(repoRoot, "scripts", "distractor-audit-a1-verdicts.json"));
const verdictById = new Map(verdictsData.verdicts.map((v) => [v.questionId, v]));
const reviewTargets = new Set([...flaggedIds, ...sampleIds]);
const missing = [...reviewTargets].filter((id) => !verdictById.has(id));
const extra = [...verdictById.keys()].filter((id) => !reviewTargets.has(id));
if (missing.length || extra.length) {
  console.error("判定データが精査対象と一致しません:");
  if (missing.length) console.error(" 判定なし:", missing.join(", "));
  if (extra.length) console.error(" 対象外の判定:", extra.join(", "));
  process.exit(1);
}
const VERDICTS = ["真の問題", "問題なし", "要確認"];
for (const v of verdictsData.verdicts) {
  if (!VERDICTS.includes(v.verdict)) { console.error(`判定値が不正: ${v.questionId}: ${v.verdict}`); process.exit(1); }
  if (!v.basis || !v.basis.trim()) { console.error(`判定根拠が空: ${v.questionId}`); process.exit(1); }
}

// ---- レポート
const screeningByCategory = {};
for (const fs of findings.values()) for (const f of fs) {
  screeningByCategory[f.category] ??= { instances: 0, questions: new Set() };
  screeningByCategory[f.category].instances++;
  // questions set は後で件数化
}
const flaggedList = [];
for (const q of targets) {
  if (!flaggedIds.has(q.id)) continue;
  const unit = unitById.get(q.knowledgeUnitIds[0]);
  for (const f of findings.get(q.id)) screeningByCategory[f.category].questions.add(q.id);
  flaggedList.push({
    questionId: q.id, chapterId: q.chapterId, unitId: unit.id, sourcePage: unit.source.page,
    prompt: q.prompt, choices: q.choices, answer: q.choices[q.correctChoiceIndexes[0]],
    unitContent: unit.content,
    findings: findings.get(q.id),
    verdict: verdictById.get(q.id).verdict, basis: verdictById.get(q.id).basis,
  });
}
const sampleList = sampleIds.map((id) => {
  const q = targets.find((x) => x.id === id);
  const unit = unitById.get(q.knowledgeUnitIds[0]);
  return {
    questionId: q.id, chapterId: q.chapterId, unitId: unit.id, sourcePage: unit.source.page,
    prompt: q.prompt, choices: q.choices, answer: q.choices[q.correctChoiceIndexes[0]],
    unitContent: unit.content,
    verdict: verdictById.get(id).verdict, basis: verdictById.get(id).basis,
  };
});
const countVerdicts = (ids) => {
  const c = { "真の問題": 0, "問題なし": 0, "要確認": 0 };
  for (const id of ids) c[verdictById.get(id).verdict]++;
  return c;
};
const report = {
  meta: {
    audit: "四択誤答の意味的監査バッチA1",
    generatedBy: "scripts/audit-distractors-a1.mjs",
    verdictsSource: "scripts/distractor-audit-a1-verdicts.json",
    targets: {
      total: targets.length,
      fromDraftQa: targets.filter((q) => q.id.startsWith("q4-")).length,
      fromProfile: targets.filter((q) => q.id.startsWith("qsc-")).length,
      byChapter: Object.fromEntries([...byChapter.entries()].sort().map(([k, v]) => [k, v.length])),
    },
    categories: CATEGORIES,
    screening: {
      flaggedQuestions: flaggedIds.size,
      byCategory: Object.fromEntries(Object.entries(screeningByCategory).sort().map(([k, v]) => [k, { instances: v.instances, questions: v.questions.size }])),
    },
    sampling: { rate: 0.1, byChapter: sampleByChapter, sampledQuestions: sampleIds.length },
    verdicts: {
      flagged: countVerdicts([...flaggedIds]),
      sampled: countVerdicts(sampleIds),
      trueProblems: verdictsData.verdicts.filter((v) => v.verdict === "真の問題").map((v) => v.questionId),
    },
    fixes: verdictsData.fixes ?? [],
  },
  flagged: flaggedList,
  sampled: sampleList,
};
writeFileSync(join(repoRoot, "scripts", "distractor-audit-a1-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(`監査対象 ${targets.length}問（q4 ${report.meta.targets.fromDraftQa} / qsc ${report.meta.targets.fromProfile}）`);
console.log(`スクリーニング検出 ${flaggedIds.size}問 / サンプル精査 ${sampleIds.length}問`);
console.log(`判定内訳（検出分）: ${JSON.stringify(report.meta.verdicts.flagged)} / （サンプル分）: ${JSON.stringify(report.meta.verdicts.sampled)}`);
