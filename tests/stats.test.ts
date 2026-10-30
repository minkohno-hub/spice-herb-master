
import { describe, it, expect } from "vitest";
import { computeCoverage, computeStats } from "../src/domain/stats";
describe("coverage separation",()=>{ it("取り込み率と抽出率が分離され、抽出率は未測定null",()=>{ const c=computeCoverage({presentImages:139,expectedImages:140,units:[],totalSections:81,questions:[],records:[]}); expect(c.importedRatio).toBeCloseTo(139/140); expect(c.unitExtractionRatio).toBeNull(); }); it("空データの正答率はnull（0%と偽らない）",()=>{ expect(computeStats([],[]).accuracy).toBeNull(); }); });
