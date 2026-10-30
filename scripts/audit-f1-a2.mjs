#!/usr/bin/env node
/**
 * F1形式の意味的監査バッチA2: 機械的スクリーニング + 精査判定の集約（決定的・再実行可能）。
 *
 * 対象: 拡充F1（docs/DECISIONS.md #21）で追加した形式のうち、監査A1（四択、#20）で扱われなかった
 *   - true-false（○×）272問: 真文の正確性 + 偽文（他プロフィールの同属性値への入れ替え）が
 *     教科書の記載上も偽であること
 *   - multiple-choice（多択）32問: 非該当候補が対象属性に部分的にも該当しないこと + 正解集合
 *   - matching（組み合わせ）43問: 対応の一意性（意味面で別解の完全対応が生じないこと）
 *   - figure（図表）17問: 表内での対象利用部位の意味的一意性
 * 方針（docs/QUESTION_QUALITY.md / docs/DECISIONS.md #25）:
 * - 属性値は「全体値」で判定する（監査A1の較正: 構成トークンの部分共有だけでは別解にならない）。
 *   ただし、対象値の構成要素（利用部位の語彙）が他の値にすべて含まれ、その値の全体が
 *   「対象値である」と平叙文として成り立つ場合（含意）、および転記・照合済み単位 content に
 *   対象品目についてその値の利用が明示される場合は、別解になり得るとして精査する。
 * - 検出された問題は転記本文（src/data/transcripts/）と照合済み単位 content に照らして
 *   1件ずつ精査し、検出されなかった問題も形式・種別ごとに10%を決定的にサンプル精査する。
 *   対象は全件が第二章（図鑑）のプロフィール由来のため、層別は章ではなく形式・種別で行う。
 * - 精査判定（真の問題 / 問題なし / 要確認）と根拠は手書きデータ
 *   scripts/distractor-audit-a2-verdicts.json に保持し、本スクリプトが
 *   「検出・サンプル全件に判定があること」を検証してレポートへ集約する。
 * - 判定根拠は転記本文・照合済み単位のみに求め、教科書の範囲を超える知識では判定しない。
 *   根拠が確認できないものは「要確認」として残す（検証状態を偽らない）。
 *
 * スクリーニング観点:
 *   ○× TF-A 偽文値が対象品目の同一spice他単位 content に出現
 *      TF-B 偽文値が出典ページ・次ページの転記ブロックに出現（同一見開きの他品目の行を含む）
 *      TF-C 偽文値が転記のいずれかのブロックで対象名・別名基部と共起
 *      TF-D 偽文値と真文値の構成要素関係（語彙集合の包含・一致・共有。括弧内語彙を含む）
 *      TF-E 真文の確認対象（値に括弧注記を含む / 名称が複合で複数品目を含む）
 *   多択 MC-A 非該当候補の属性値と対象値の構成要素関係（包含・一致・共有）
 *      MC-B 非該当候補の同一spice単位 content に対象値が出現
 *      MC-C 転記ブロックで非該当候補名と対象値が共起
 *      MC-D 候補同士の名称・別名基部が一致/包含（同一品目の重複・別名での再出）
 *      MC-E 原産地: 非該当候補の地域トークンと対象値の地域トークンに文字列包含（地域の広狭）
 *   組み合わせ MT-A 問題内で right 値同士の構成要素関係（包含・集合一致・共有）
 *      MT-B 含意グラフ（構成要素含意）で、模範対応と異なる完全対応（別解）が存在
 *      MT-C ある left の同一spice単位 content に他の right 値が出現
 *      MT-D 出典ページの転記ブロックで left 名と他の right 値が共起
 *   図表 FG-A 対象値の構成要素が他行の利用部位値に包含される（他行が対象値を含意）
 *      FG-B 対象値が他行品目の同一spice単位 content に出現
 *      FG-C 転記ブロックで他行名・別名基部と対象値が共起
 *      FG-D 対象値と他行値の構成要素の部分共有（FG-Aに該当しない共有）
 *
 * 入力: src/data/questions/formal-*.json、src/data/knowledge/ 配下JSON、
 *       src/data/transcripts/ 配下JSON、scripts/distractor-audit-a2-verdicts.json
 * 出力: scripts/distractor-audit-a2-report.json
 *
 * 注意: レポートは監査時点（修正前データ）のスナップショットである。真の問題は
 * scripts/distractor-audit-exclusions.json の同種グループ除外と生成器の図表対象再選択で
 * 生成パイプライン側を修正済みで、修正後の再生成では対象問題だけが変わることを差分で確認した
 * （docs/DECISIONS.md #25）。修正後のデータで本スクリプトを再実行すると、解消済みの検出・
 * サンプル構成が変わるため、判定カバレッジ検証は修正前データに対してのみ一致する。
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

// ---- 利用部位の構成要素（語彙）抽出。括弧内の部位語彙も要素に含め、「種子の仁」は仁、
// 「花の雌しべ」は雌しべ、「未熟な果実」は果実として扱う（状態・形態の修飾は要素にしない）。
// 「葉(芽)」は芽の指定が意味を持つため独立要素として保持する。
const PART_LEX = ["仮種皮", "雌しべ", "地上部", "根茎", "鱗茎", "果皮", "果実", "種子", "樹皮", "花弁", "花穂", "走根", "葉", "茎", "根", "花", "蕾", "仁"];
function partLexemes(v) {
  if (!v) return new Set();
  const out = new Set();
  for (const rawTok of v.split(/[、,]/).flatMap((s) => s.split("および"))) {
    const tok = rawTok.trim();
    if (!tok) continue;
    const paren = tok.match(/[(（]([^)）]+)[)）]/)?.[1] ?? "";
    const t = tok.replace(/[(（].*[)）]/, "").replace(/^未熟な/, "");
    if (t.includes("雌しべ")) out.add("雌しべ");
    else if (t.includes("仮種皮")) out.add("仮種皮");
    else if (t.includes("の仁")) out.add("仁");
    else if (t.includes("の")) out.add(t.split("の").pop());
    else out.add(t);
    for (const lx of PART_LEX) if (paren.includes(lx)) out.add(lx);
    if (tok.includes("葉") && paren.includes("芽")) out.add("葉(芽)");
  }
  return out;
}
// 原産地の地域トークン（括弧注記を除いた基部）
const regionTokens = (v) => new Set(v.split(/[、,・]/).flatMap((s) => s.split("および")).map((s) => baseForm(s).trim()).filter(Boolean));
const lexemesOf = (key, v) => (key === "part" ? partLexemes(v) : key === "origin" ? regionTokens(v) : new Set([v]));
const setEq = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
const setSub = (a, b) => [...a].every((x) => b.has(x)); // a ⊆ b
const setShare = (a, b) => [...a].filter((x) => b.has(x));

// ---- 入力読み込み
const qDir = join(repoRoot, "src", "data", "questions");
const questions = [];
for (const f of readdirSync(qDir).filter((x) => x.startsWith("formal-")).sort()) questions.push(...readJson(join(qDir, f)));
const targets = questions.filter((q) => ["true-false", "multiple-choice", "matching", "figure"].includes(q.format));

const knowledgeDir = join(repoRoot, "src", "data", "knowledge");
const unitFiles = [];
const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith(".json")) unitFiles.push(p); } };
walk(knowledgeDir);
unitFiles.sort();
const units = unitFiles.flatMap((f) => readJson(f));
const unitById = new Map(units.map((u) => [u.id, u]));
const unitsBySpice = new Map();
for (const u of units) { if (u.spice?.id) { if (!unitsBySpice.has(u.spice.id)) unitsBySpice.set(u.spice.id, []); unitsBySpice.get(u.spice.id).push(u); } }

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

function parseProfile(content) {
  const g = (re) => content.match(re)?.[1] ?? null;
  return { name: g(/^(.+?):\s/), family: g(/科名は(.+?)。/), origin: g(/原産地は(.+?)。/), part: g(/利用部位は(.+?)。/), aliasesRaw: g(/別名は(.+?)。/), levels: g(/検定(.+?)級の対象。/) };
}
const profileByUnitId = new Map();
const profileByName = new Map();
for (const u of units) if (u.kind === "spice-profile") { const p = parseProfile(u.content); profileByUnitId.set(u.id, p); profileByName.set(p.name, u); }
const nameVariantsOf = (p) => {
  const out = new Set();
  for (const part of p.name.split("/")) { out.add(baseForm(part.trim())); }
  for (const tok of (p.aliasesRaw ?? "").split("、")) if (tok.trim()) out.add(baseForm(tok.trim()));
  return [...out].filter((s) => s.length >= 2);
};

// ---- スクリーニング
const CATEGORIES = {
  "TF-A": "偽文値が対象品目の同一spice他単位 content に出現",
  "TF-B": "偽文値が出典ページ・次ページの転記ブロックに出現",
  "TF-C": "偽文値が転記のブロックで対象名・別名基部と共起",
  "TF-D": "偽文値と真文値の構成要素関係（包含・一致・共有）",
  "TF-E": "真文の確認対象（括弧注記を含む値 / 複合名称）",
  "MC-A": "非該当候補の属性値と対象値の構成要素関係（包含・一致・共有）",
  "MC-B": "非該当候補の同一spice単位 content に対象値が出現",
  "MC-C": "転記ブロックで非該当候補名と対象値が共起",
  "MC-D": "候補同士の名称・別名基部が一致/包含",
  "MC-E": "原産地の地域トークンに文字列包含（地域の広狭）",
  "MT-A": "right値同士の構成要素関係（包含・集合一致・共有）",
  "MT-B": "含意グラフで模範対応と異なる完全対応（別解）が存在",
  "MT-C": "leftの同一spice単位 content に他のright値が出現",
  "MT-D": "出典ページの転記ブロックでleft名と他のright値が共起",
  "FG-A": "対象値の構成要素が他行の利用部位値に包含される（他行が対象値を含意）",
  "FG-B": "対象値が他行品目の同一spice単位 content に出現",
  "FG-C": "転記ブロックで他行名・別名基部と対象値が共起",
  "FG-D": "対象値と他行値の構成要素の部分共有（FG-Aに該当しない共有）",
};
const findings = new Map();
const addFinding = (q, category, subject, detail) => {
  if (!findings.has(q.id)) findings.set(q.id, []);
  findings.get(q.id).push({ category, subject, detail });
};

// ---- ○×
for (const q of targets.filter((x) => x.format === "true-false")) {
  const unit = unitById.get(q.knowledgeUnitIds[0]);
  const p = profileByUnitId.get(unit.id);
  const key = q.id.startsWith("qtf-family-") ? "family" : "part";
  const label = key === "family" ? "科名" : "利用部位";
  const value = q.prompt.match(new RegExp(`の${label}は(.+)である。$`))[1];
  if (q.correctBoolean) {
    // TF-E: 真文の正確性の重点確認対象
    if (/[(（]/.test(value)) addFinding(q, "TF-E", value, `真文の${label}値に括弧注記を含む: ${value}`);
    if (/[/・]/.test(p.name)) addFinding(q, "TF-E", p.name, `名称「${p.name}」が複合で複数品目を含むため、真文が両品目に当てはまるか確認`);
    continue;
  }
  const falseVal = value;
  const nFalse = normalizeText(falseVal);
  // TF-A
  for (const su of unitsBySpice.get(unit.spice?.id) ?? []) {
    if (su.id === unit.id) continue;
    if (normalizeText(su.content).includes(nFalse)) addFinding(q, "TF-A", falseVal, `同一spice単位 ${su.id} の content に偽文値が出現: ${su.content}`);
  }
  // TF-B
  for (const page of [unit.source.page, unit.source.page + 1]) {
    for (const b of pageBlocks.get(page) ?? []) if (normalizeText(b).includes(nFalse)) addFinding(q, "TF-B", falseVal, `p.${page} の転記ブロックに偽文値が出現: ${b.slice(0, 120)}`);
  }
  // TF-C
  const variants = nameVariantsOf(p);
  outer: for (const [page, blocks] of [...pageBlocks.entries()].sort((a, b) => a[0] - b[0])) {
    for (const b of blocks) {
      const nb = normalizeText(b);
      if (!nb.includes(nFalse)) continue;
      for (const nv of variants) if (nb.includes(normalizeText(nv))) { addFinding(q, "TF-C", falseVal, `p.${page} の転記ブロックで対象名/別名「${nv}」と共起: ${b.slice(0, 120)}`); break outer; }
    }
  }
  // TF-D
  const lf = lexemesOf(key, falseVal), lt = lexemesOf(key, p[key]);
  if (setEq(lf, lt)) addFinding(q, "TF-D", falseVal, `偽文値の構成要素が真文値「${p[key]}」と集合一致`);
  else if (setSub(lf, lt)) addFinding(q, "TF-D", falseVal, `偽文値の構成要素が真文値「${p[key]}」に包含される`);
  else if (setSub(lt, lf)) addFinding(q, "TF-D", falseVal, `真文値「${p[key]}」の構成要素が偽文値に包含される`);
  else if (setShare(lf, lt).length) addFinding(q, "TF-D", falseVal, `偽文値と真文値「${p[key]}」が構成要素 ${JSON.stringify(setShare(lf, lt))} を共有`);
}

// ---- 多択
for (const q of targets.filter((x) => x.format === "multiple-choice")) {
  const key = q.id.split("-")[1];
  const value = q.prompt.match(/「(.+)」であるものをすべて選べ。$/)[1];
  const lv = lexemesOf(key, value);
  q.choices.forEach((c, i) => {
    if (q.correctChoiceIndexes.includes(i)) return;
    const cu = profileByName.get(c);
    const cp = profileByUnitId.get(cu.id);
    const cv = cp[key];
    const lc = lexemesOf(key, cv);
    // MC-A
    if (setEq(lc, lv)) addFinding(q, "MC-A", c, `非該当候補の${key}値「${cv}」の構成要素が対象値と集合一致`);
    else if (setSub(lv, lc)) addFinding(q, "MC-A", c, `対象値の構成要素が非該当候補の${key}値「${cv}」に包含される`);
    else if (setSub(lc, lv)) addFinding(q, "MC-A", c, `非該当候補の${key}値「${cv}」の構成要素が対象値に包含される`);
    else if (setShare(lc, lv).length) addFinding(q, "MC-A", c, `非該当候補の${key}値「${cv}」と対象値が構成要素 ${JSON.stringify(setShare(lc, lv))} を共有`);
    // MC-B
    for (const su of unitsBySpice.get(cu.spice?.id) ?? []) {
      if (su.id === cu.id) continue;
      if (normalizeText(su.content).includes(normalizeText(value))) addFinding(q, "MC-B", c, `同一spice単位 ${su.id} の content に対象値「${value}」が出現: ${su.content}`);
    }
    // MC-C
    const cands = nameVariantsOf(cp);
    outer: for (const [page, blocks] of [...pageBlocks.entries()].sort((a, b) => a[0] - b[0])) {
      for (const b of blocks) {
        const nb = normalizeText(b);
        if (!nb.includes(normalizeText(value))) continue;
        for (const nv of cands) if (nb.includes(normalizeText(nv))) { addFinding(q, "MC-C", c, `p.${page} の転記ブロックで候補名/別名「${nv}」と対象値が共起: ${b.slice(0, 120)}`); break outer; }
      }
    }
    // MC-E（原産地の地域トークンの文字列包含）
    if (key === "origin") {
      for (const t of regionTokens(cv)) for (const tv of regionTokens(value)) {
        if (t !== tv && t.length >= 2 && tv.length >= 2 && (t.includes(tv) || tv.includes(t))) addFinding(q, "MC-E", c, `地域トークン「${t}」と対象値の地域トークン「${tv}」に文字列包含`);
      }
    }
  });
  // MC-D: 候補同士の名称・別名
  const candVariants = q.choices.map((c) => ({ name: c, variants: nameVariantsOf(profileByUnitId.get(profileByName.get(c).id)) }));
  for (let i = 0; i < candVariants.length; i++) for (let j = 0; j < candVariants.length; j++) {
    if (i === j) continue;
    if (candVariants[j].variants.some((v) => normalizeText(v) === normalizeText(candVariants[i].name))) addFinding(q, "MC-D", candVariants[i].name, `候補「${candVariants[i].name}」が候補「${candVariants[j].name}」の名称/別名バリアントと一致`);
  }
}

// ---- 組み合わせ
function alternativeMatching(pairs, key) {
  // 含意: left の本来の値が right の構成要素をすべて含む場合、その right も意味的には対応し得る
  const lex = pairs.map((pr) => ({ left: pr.left, own: lexemesOf(key, pr.right), right: pr.right }));
  const rights = pairs.map((pr) => ({ right: pr.right, lex: lexemesOf(key, pr.right) }));
  const perms = [];
  const permute = (arr, m = []) => { if (!arr.length) { perms.push(m); return; } for (let i = 0; i < arr.length; i++) { const cur = arr.splice(i, 1); permute(arr.slice(), [...m, ...cur]); arr.splice(i, 0, ...cur); } };
  permute(rights.map((_, i) => i));
  const intended = pairs.map((pr) => pr.right);
  const alts = [];
  for (const perm of perms) {
    const assigned = perm.map((ri) => rights[ri].right);
    if (JSON.stringify(assigned) === JSON.stringify(intended)) continue;
    if (perm.every((ri, li) => setSub(rights[ri].lex, lex[li].own))) alts.push(assigned);
  }
  return alts;
}
for (const q of targets.filter((x) => x.format === "matching")) {
  const key = q.id.split("-")[1];
  const pairs = q.matchingPairs;
  // MT-A
  for (let i = 0; i < pairs.length; i++) for (let j = i + 1; j < pairs.length; j++) {
    const li = lexemesOf(key, pairs[i].right), lj = lexemesOf(key, pairs[j].right);
    let rel = null;
    if (setEq(li, lj)) rel = "構成要素が集合一致";
    else if (setSub(li, lj)) rel = `「${pairs[i].right}」の構成要素が「${pairs[j].right}」に包含`;
    else if (setSub(lj, li)) rel = `「${pairs[j].right}」の構成要素が「${pairs[i].right}」に包含`;
    else if (setShare(li, lj).length) rel = `構成要素 ${JSON.stringify(setShare(li, lj))} を共有`;
    if (rel) addFinding(q, "MT-A", pairs[j].right, `${pairs[i].left}="${pairs[i].right}" と ${pairs[j].left}="${pairs[j].right}": ${rel}`);
  }
  // MT-B
  const alts = alternativeMatching(pairs, key);
  for (const alt of alts) addFinding(q, "MT-B", null, `含意グラフで別解の完全対応が存在: ${pairs.map((pr, i) => `${pr.left}=${alt[i]}`).join(" / ")}`);
  // MT-C / MT-D
  for (const pr of pairs) {
    const lu = profileByName.get(pr.left);
    const lp = profileByUnitId.get(lu.id);
    for (const other of pairs) {
      if (other === pr) continue;
      for (const su of unitsBySpice.get(lu.spice?.id) ?? []) {
        if (su.id === lu.id) continue;
        if (normalizeText(su.content).includes(normalizeText(other.right))) addFinding(q, "MT-C", other.right, `left「${pr.left}」の同一spice単位 ${su.id} の content に他のright「${other.right}」が出現: ${su.content}`);
      }
      const variants = nameVariantsOf(lp);
      for (const page of [lu.source.page, lu.source.page + 1]) {
        for (const b of pageBlocks.get(page) ?? []) {
          const nb = normalizeText(b);
          if (nb.includes(normalizeText(other.right)) && variants.some((nv) => nb.includes(normalizeText(nv)))) addFinding(q, "MT-D", other.right, `left「${pr.left}」の出典ページ p.${page} の転記ブロックで他のright「${other.right}」と共起: ${b.slice(0, 120)}`);
        }
      }
    }
  }
}

// ---- 図表
for (const q of targets.filter((x) => x.format === "figure")) {
  const target = q.prompt.match(/利用部位が「(.+)」である品目/)[1];
  const correct = q.choices[q.correctChoiceIndexes[0]];
  const lt = partLexemes(target);
  for (const row of q.table.rows) {
    const [name, , part] = row;
    if (name === correct) continue;
    const ru = profileByName.get(name);
    const lr = partLexemes(part);
    // FG-A / FG-D
    if (setSub(lt, lr)) addFinding(q, "FG-A", name, `対象値「${target}」の構成要素 ${JSON.stringify([...lt])} が他行「${name}」の利用部位「${part}」に包含される`);
    else if (setShare(lt, lr).length) addFinding(q, "FG-D", name, `対象値「${target}」と他行「${name}」の利用部位「${part}」が構成要素 ${JSON.stringify(setShare(lt, lr))} を共有（包含はしない）`);
    // FG-B
    for (const su of unitsBySpice.get(ru.spice?.id) ?? []) {
      if (su.id === ru.id) continue;
      if (normalizeText(su.content).includes(normalizeText(target))) addFinding(q, "FG-B", name, `他行「${name}」の同一spice単位 ${su.id} の content に対象値「${target}」が出現: ${su.content}`);
    }
    // FG-C
    const rVariants = nameVariantsOf(profileByUnitId.get(ru.id));
    outer: for (const [page, blocks] of [...pageBlocks.entries()].sort((a, b) => a[0] - b[0])) {
      for (const b of blocks) {
        const nb = normalizeText(b);
        if (!nb.includes(normalizeText(target))) continue;
        for (const nv of rVariants) if (nb.includes(normalizeText(nv))) { addFinding(q, "FG-C", name, `p.${page} の転記ブロックで他行名/別名「${nv}」と対象値「${target}」が共起: ${b.slice(0, 120)}`); break outer; }
      }
    }
  }
}

// ---- サンプル抽出（未検出問題から形式・種別ごとに10%・切り上げ・最低1件、ハッシュ順で決定的）
const flaggedIds = new Set(findings.keys());
const kindOf = (q) => {
  if (q.format === "true-false") { const key = q.id.startsWith("qtf-family-") ? "family" : "part"; return `true-false/${key}-${q.correctBoolean ? "true" : "false"}`; }
  if (q.format === "multiple-choice") return `multiple-choice/${q.id.split("-")[1]}`;
  if (q.format === "matching") return `matching/${q.id.split("-")[1]}`;
  return "figure";
};
const byKind = new Map();
for (const q of targets) { const k = kindOf(q); if (!byKind.has(k)) byKind.set(k, []); byKind.get(k).push(q); }
const sampleIds = [];
const sampleByKind = {};
for (const [k, qs] of [...byKind.entries()].sort()) {
  const unflagged = qs.filter((q) => !flaggedIds.has(q.id));
  const n = Math.max(1, Math.ceil(unflagged.length * 0.1));
  const sorted = [...unflagged].sort((x, y) => fnv(`a2-sample|${x.id}`) - fnv(`a2-sample|${y.id}`) || (x.id < y.id ? -1 : 1));
  const picked = sorted.slice(0, n).map((q) => q.id);
  sampleIds.push(...picked);
  sampleByKind[k] = { kindTargets: qs.length, unflagged: unflagged.length, sampled: picked.length, sampleIds: picked };
}

if (process.env.A2_DUMP) {
  const dump = {
    flagged: [...flaggedIds].sort().map((id) => ({ questionId: id, findings: findings.get(id) })),
    sampled: sampleIds,
    sampleByKind,
  };
  console.log(JSON.stringify(dump, null, 1));
  process.exit(0);
}

// ---- 精査判定の集約（手書き判定データが全検出・全サンプルを覆うことを検証）
const verdictsData = readJson(join(repoRoot, "scripts", "distractor-audit-a2-verdicts.json"));
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
  screeningByCategory[f.category].questions.add(null);
}
const flaggedList = [];
const byFormatCount = {};
for (const q of targets) byFormatCount[q.format] = (byFormatCount[q.format] ?? 0) + 1;
for (const q of targets) {
  if (!flaggedIds.has(q.id)) continue;
  for (const f of findings.get(q.id)) screeningByCategory[f.category].questions.add(q.id);
  const us = q.knowledgeUnitIds.map((id) => unitById.get(id));
  flaggedList.push({
    questionId: q.id, format: q.format, kind: kindOf(q), chapterId: q.chapterId, unitIds: q.knowledgeUnitIds, sourcePages: us.map((u) => u.source.page),
    prompt: q.prompt, choices: q.choices ?? null, correctChoiceIndexes: q.correctChoiceIndexes ?? null, correctBoolean: q.correctBoolean ?? null,
    matchingPairs: q.matchingPairs ?? null, table: q.table ?? null,
    unitContents: us.map((u) => u.content),
    findings: findings.get(q.id),
    verdict: verdictById.get(q.id).verdict, basis: verdictById.get(q.id).basis,
  });
}
for (const v of Object.values(screeningByCategory)) v.questions.delete(null);
const sampleList = sampleIds.map((id) => {
  const q = targets.find((x) => x.id === id);
  const us = q.knowledgeUnitIds.map((x) => unitById.get(x));
  return {
    questionId: q.id, format: q.format, kind: kindOf(q), chapterId: q.chapterId, unitIds: q.knowledgeUnitIds, sourcePages: us.map((u) => u.source.page),
    prompt: q.prompt, choices: q.choices ?? null, correctChoiceIndexes: q.correctChoiceIndexes ?? null, correctBoolean: q.correctBoolean ?? null,
    matchingPairs: q.matchingPairs ?? null, table: q.table ?? null,
    unitContents: us.map((u) => u.content),
    verdict: verdictById.get(id).verdict, basis: verdictById.get(id).basis,
  };
});
const countVerdicts = (ids) => { const c = { "真の問題": 0, "問題なし": 0, "要確認": 0 }; for (const id of ids) c[verdictById.get(id).verdict]++; return c; };
const report = {
  meta: {
    audit: "F1形式の意味的監査バッチA2（○×・多択・組み合わせ・図表）",
    generatedBy: "scripts/audit-f1-a2.mjs",
    verdictsSource: "scripts/distractor-audit-a2-verdicts.json",
    targets: { total: targets.length, byFormat: byFormatCount, byKind: Object.fromEntries([...byKind.entries()].sort().map(([k, v]) => [k, v.length])) },
    categories: CATEGORIES,
    screening: {
      flaggedQuestions: flaggedIds.size,
      byCategory: Object.fromEntries(Object.entries(screeningByCategory).sort().map(([k, v]) => [k, { instances: v.instances, questions: v.questions.size }])),
    },
    sampling: { rate: 0.1, byKind: sampleByKind, sampledQuestions: sampleIds.length },
    verdicts: {
      flagged: countVerdicts([...flaggedIds]),
      sampled: countVerdicts(sampleIds),
      trueProblems: verdictsData.verdicts.filter((v) => v.verdict === "真の問題").map((v) => v.questionId),
      needsReview: verdictsData.verdicts.filter((v) => v.verdict === "要確認").map((v) => v.questionId),
    },
    fixes: verdictsData.fixes ?? [],
  },
  flagged: flaggedList,
  sampled: sampleList,
};
writeFileSync(join(repoRoot, "scripts", "distractor-audit-a2-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(`監査対象 ${targets.length}問（○× ${byFormatCount["true-false"]} / 多択 ${byFormatCount["multiple-choice"]} / 組み合わせ ${byFormatCount["matching"]} / 図表 ${byFormatCount["figure"]}）`);
console.log(`スクリーニング検出 ${flaggedIds.size}問 / サンプル精査 ${sampleIds.length}問`);
console.log(`判定内訳（検出分）: ${JSON.stringify(report.meta.verdicts.flagged)} / （サンプル分）: ${JSON.stringify(report.meta.verdicts.sampled)}`);
