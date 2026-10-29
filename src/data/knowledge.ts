/**
 * 生成物（薄い集約モジュール） — 手で編集しないこと。再生成: node scripts/import-claude-data.mjs
 * データ本体は src/data/knowledge/ 配下の分割JSON（取り込み元ファイル単位、全ファイル128KB未満）。
 * 出典: Claude版ブランチ claude/build-learning-app の data/units/*.json と data/spices/*.json。
 * 全件 status: "unverified"（内容の人手照合が未実施のため verified ではない）。
 * q/a は一問一答の下書き参照（draftQa）であり、正式問題ではない。
 */
import type { ImportedKnowledgeUnit } from "../domain/types";
import unitsCh0Basics from "./knowledge/units/ch0-basics.json";
import unitsCh0History from "./knowledge/units/ch0-history.json";
import unitsCh1Recipes from "./knowledge/units/ch1-recipes.json";
import unitsCh1Usage from "./knowledge/units/ch1-usage.json";
import unitsCh1World from "./knowledge/units/ch1-world.json";
import unitsCh3Health from "./knowledge/units/ch3-health.json";
import unitsCh3Life from "./knowledge/units/ch3-life.json";
import spicesA from "./knowledge/spices/a.json";
import spicesB from "./knowledge/spices/b.json";
import spicesC from "./knowledge/spices/c.json";
import spicesD from "./knowledge/spices/d.json";
export const KNOWLEDGE_IMPORT_META = {
  "origin": "claude/build-learning-app",
  "generatedBy": "scripts/import-claude-data.mjs",
  "totalUnits": 545,
  "fromUnitFiles": 248,
  "spiceEntries": 82,
  "spiceFacts": 217,
  "spiceProfiles": 80,
  "draftQaTotal": 379,
  "files": [
    "units/ch0-basics.json",
    "units/ch0-history.json",
    "units/ch1-recipes.json",
    "units/ch1-usage.json",
    "units/ch1-world.json",
    "units/ch3-health.json",
    "units/ch3-life.json",
    "spices/a.json",
    "spices/b.json",
    "spices/c.json",
    "spices/d.json"
  ],
  "note": "全件 unverified（構造検証済み・内容の人手照合は未実施）。正式問題は0問のまま。データ本体は src/data/knowledge/ 配下の元ファイル単位の分割JSON。"
} as const;
export const IMPORTED_KNOWLEDGE_UNITS: ImportedKnowledgeUnit[] = [
  ...(unitsCh0Basics as unknown as ImportedKnowledgeUnit[]),
  ...(unitsCh0History as unknown as ImportedKnowledgeUnit[]),
  ...(unitsCh1Recipes as unknown as ImportedKnowledgeUnit[]),
  ...(unitsCh1Usage as unknown as ImportedKnowledgeUnit[]),
  ...(unitsCh1World as unknown as ImportedKnowledgeUnit[]),
  ...(unitsCh3Health as unknown as ImportedKnowledgeUnit[]),
  ...(unitsCh3Life as unknown as ImportedKnowledgeUnit[]),
  ...(spicesA as unknown as ImportedKnowledgeUnit[]),
  ...(spicesB as unknown as ImportedKnowledgeUnit[]),
  ...(spicesC as unknown as ImportedKnowledgeUnit[]),
  ...(spicesD as unknown as ImportedKnowledgeUnit[]),
];
