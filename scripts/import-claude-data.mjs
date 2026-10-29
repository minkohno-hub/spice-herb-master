#!/usr/bin/env node
/**
 * Claude版ブランチ（claude/build-learning-app）の構造化データを取り込む変換スクリプト（再実行可能）。
 *
 * 入力: <claude-data-dir>/units/*.json, <claude-data-dir>/spices/*.json
 *   既定のデータ dir はリポジトリの隣の監査コピー ../spice-claude-audit/data。
 *   引数または環境変数 SPICE_CLAUDE_DATA で上書きできる。
 * 出力:
 *   - src/data/knowledge/units/<元ファイル名>.json（取り込み元ファイル単位の分割JSON）
 *   - src/data/knowledge/spices/<元ファイル名>.json（同上）
 *   - src/data/knowledge.ts（上記JSONを import して従来と同じエクスポートを提供する薄い生成モジュール）
 *   生成物は手で編集しないこと。
 *   分割理由: GitHubコネクタの1ファイルあたりサイズ制約と、指令書第17章
 *   「データは章・節単位で分割」に合わせるため。各分割JSONは 128KB (131072 bytes) 未満を
 *   実測で保証し、超えるグループは連番ファイル（<名前>-1.json, <名前>-2.json, …）へ自動で再分割する。
 *
 * 変換ルール（docs/DECISIONS.md #10〜#13）:
 * - 全件 status = "unverified"（Claude版は内容の人手照合が未実施のため verified にはしない）
 * - 全件に source = { page, sourceUnitId, origin: "claude/build-learning-app" } を必須付与
 * - units/*.json の units[] をそのまま知識単位化（kind: "unit"）
 * - spices/*.json の各 spice について:
 *   - facts[] を知識単位化（kind: "spice-fact"、親 spice の id/name/en/page を保持）
 *   - profileOf を持たない spice は、属性（科名/原産地/利用部位/別名）から
 *     プロフィール知識単位を1件生成（kind: "spice-profile"）。
 *     これは Claude版 scripts/generate.mjs の知識単位定義（2. 図鑑の知識単位）を踏襲したもので、
 *     Claude自己申告「知識単位545」は units 248 + spice facts 217 + profile 80 = 545 と実測で一致する。
 * - q/a を持つ単位は draftQa（一問一答の下書き参照）として保持するが、正式問題としては登録しない。
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = resolve(process.argv[2] ?? process.env.SPICE_CLAUDE_DATA ?? join(repoRoot, "..", "spice-claude-audit", "data"));
const ORIGIN = "claude/build-learning-app";
const MAX_FILE_BYTES = 128 * 1024; // 131072 bytes。各分割JSONはこの値「未満」にする。
const outDir = join(repoRoot, "src", "data", "knowledge");

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const listJson = (sub) => readdirSync(join(dataDir, sub)).filter((f) => f.endsWith(".json")).sort();

// グループ単位（取り込み元ファイル単位）で知識単位を保持する。
// groups: [{ group: "units/ch0-basics", units: [...] }]（取り込み順を保持し、連結すると従来と同じ並びになる）
const groups = [];
const allUnits = () => groups.flatMap((g) => g.units);
const base = (kind, id, chapterId, sectionTitle, category, content, page, draftQa, spice) => ({
  id, kind, status: "unverified", chapterId, sectionTitle, category, content,
  source: { page, sourceUnitId: id, origin: ORIGIN },
  draftQa: draftQa ?? null,
  spice: spice ?? null,
});

// ---- 1. 一般章の知識単位（data/units/*.json）
let unitsFromFiles = 0, unitQa = 0;
for (const file of listJson("units")) {
  const json = readJson(join(dataDir, "units", file));
  const group = { group: `units/${file.replace(/\.json$/, "")}`, units: [] };
  for (const u of json.units) {
    group.units.push(base("unit", u.id, json.chapter, u.sec, u.cat, u.fact, u.p,
      u.q ? { q: u.q, a: u.a, alt: u.alt ?? [] } : null, null));
    unitsFromFiles++; if (u.q) unitQa++;
  }
  groups.push(group);
}

// ---- 2. 図鑑（data/spices/*.json）: プロフィール単位 + facts
let spiceEntries = 0, spiceFacts = 0, spiceFactQa = 0, spiceProfiles = 0;
for (const file of listJson("spices")) {
  const json = readJson(join(dataDir, "spices", file));
  const group = { group: `spices/${file.replace(/\.json$/, "")}`, units: [] };
  for (const s of json.spices) {
    spiceEntries++;
    const spiceRef = { id: s.id, name: s.name, en: s.en ?? null };
    if (!s.profileOf) {
      const prof = [
        s.family && `科名は${s.family}`,
        s.origin && `原産地は${s.origin}`,
        s.part && `利用部位は${s.part}`,
        s.aliases?.length && `別名は${s.aliases.join("、")}`,
      ].filter(Boolean).join("。");
      const fact = `${s.name}: ${prof || "ミックススパイス"}。検定${(s.grades ?? []).join("・")}級の対象。`;
      group.units.push(base("spice-profile", `${s.id}-profile`, "ch2", s.name, "profile", fact, s.p, null, spiceRef));
      spiceProfiles++;
    }
    for (const f of s.facts ?? []) {
      group.units.push(base("spice-fact", f.id, "ch2", s.name, "spice-fact", f.fact, s.p,
        f.q ? { q: f.q, a: f.a, alt: f.alt ?? [] } : null, spiceRef));
      spiceFacts++; if (f.q) spiceFactQa++;
    }
  }
  groups.push(group);
}

// ---- 検証（変換時に最低限の整合性を担保。失敗したら生成しない）
const units = allUnits();
const ids = new Set();
for (const u of units) {
  if (ids.has(u.id)) throw new Error(`ID重複: ${u.id}`);
  ids.add(u.id);
  if (typeof u.source.page !== "number") throw new Error(`出典ページなし: ${u.id}`);
  if (u.status !== "unverified") throw new Error(`status異常: ${u.id}`);
}
const draftQaTotal = units.filter((u) => u.draftQa).length;

// ---- 分割書き出し（1ファイル < 128KB を実測保証。超える場合は自動で連番分割）
const serialize = (arr) => JSON.stringify(arr, null, 1) + "\n";
const splitGroup = (arr) => {
  // そのまま収まれば1ファイル、超えれば再帰的に二分して全チャンクが上限未満になるまで分割する。
  if (Buffer.byteLength(serialize(arr), "utf8") < MAX_FILE_BYTES || arr.length <= 1) return [arr];
  const mid = Math.ceil(arr.length / 2);
  return [...splitGroup(arr.slice(0, mid)), ...splitGroup(arr.slice(mid))];
};

rmSync(outDir, { recursive: true, force: true });
const written = []; // { path（src/data/knowledge からの相対）, importPath, ident, count, bytes }
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
for (const g of groups) {
  const chunks = splitGroup(g.units);
  chunks.forEach((chunk, i) => {
    const suffix = chunks.length > 1 ? `-${i + 1}` : "";
    const rel = `${g.group}${suffix}.json`;
    const body = serialize(chunk);
    const bytes = Buffer.byteLength(body, "utf8");
    if (bytes >= MAX_FILE_BYTES) throw new Error(`分割後もサイズ上限以上: ${rel} (${bytes} bytes)`);
    const abs = join(outDir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, body);
    written.push({ rel, ident: camel(`${g.group}${suffix}`.replace(/\//g, "-")), count: chunk.length, bytes });
  });
}

const meta = {
  origin: ORIGIN,
  generatedBy: "scripts/import-claude-data.mjs",
  totalUnits: units.length,
  fromUnitFiles: unitsFromFiles,
  spiceEntries,
  spiceFacts,
  spiceProfiles,
  draftQaTotal,
  files: written.map((w) => w.rel),
  note: "全件 unverified（構造検証済み・内容の人手照合は未実施）。正式問題は0問のまま。データ本体は src/data/knowledge/ 配下の元ファイル単位の分割JSON。",
};

const importLines = written.map((w) => `import ${w.ident} from "./knowledge/${w.rel}";`).join("\n");
const spreadLines = written.map((w) => `  ...(${w.ident} as unknown as ImportedKnowledgeUnit[]),`).join("\n");
const header = `/**
 * 生成物（薄い集約モジュール） — 手で編集しないこと。再生成: node scripts/import-claude-data.mjs
 * データ本体は src/data/knowledge/ 配下の分割JSON（取り込み元ファイル単位、全ファイル128KB未満）。
 * 出典: Claude版ブランチ claude/build-learning-app の data/units/*.json と data/spices/*.json。
 * 全件 status: "unverified"（内容の人手照合が未実施のため verified ではない）。
 * q/a は一問一答の下書き参照（draftQa）であり、正式問題ではない。
 */
import type { ImportedKnowledgeUnit } from "../domain/types";
${importLines}
export const KNOWLEDGE_IMPORT_META = ${JSON.stringify(meta, null, 2)} as const;
export const IMPORTED_KNOWLEDGE_UNITS: ImportedKnowledgeUnit[] = [
${spreadLines}
];
`;
writeFileSync(join(repoRoot, "src/data/knowledge.ts"), header);

for (const w of written) console.log(`  ${w.rel}: ${w.count}件 / ${w.bytes} bytes`);
console.log(`取り込み完了: 合計 ${units.length} 件（units由来 ${unitsFromFiles} / spice facts ${spiceFacts} / spice profile ${spiceProfiles}、図鑑エントリ ${spiceEntries}種、q/a付き ${draftQaTotal}）を ${written.length} ファイルに分割（全ファイル ${MAX_FILE_BYTES} bytes 未満）`);
