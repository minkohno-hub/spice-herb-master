
import { describe, it, expect } from "vitest";
import { computeCoverage, computeStats } from "../src/domain/stats";
import { IMPORTED_KNOWLEDGE_UNITS } from "../src/data/knowledge";
import { QUESTIONS } from "../src/data/questions";
describe("coverage separation",()=>{ it("取り込み率と抽出率が分離され、抽出率は未測定null",()=>{ const c=computeCoverage({presentImages:139,expectedImages:140,units:[],totalSections:81,questions:[],records:[]}); expect(c.importedRatio).toBeCloseTo(139/140); expect(c.unitExtractionRatio).toBeNull(); }); it("空データの正答率はnull（0%と偽らない）",()=>{ expect(computeStats([],[]).accuracy).toBeNull(); });
 // 監査C-07回帰: 問題化率の母集団は取り込み済み知識単位（545件）。全単位が検証済み問題から参照されるため 1 になる。
 it("問題化率は取り込み済み単位を母集団に算出できる（C-07）",()=>{ const c=computeCoverage({presentImages:139,expectedImages:140,units:IMPORTED_KNOWLEDGE_UNITS,totalSections:81,questions:QUESTIONS,records:[]}); expect(c.questionizedRatio).toBe(1); }); });
