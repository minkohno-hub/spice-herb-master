
import { describe, it, expect } from "vitest";
import { gradeEssayRubric, gradeTextAnswer, gradeChoice, gradeTableFill } from "../src/domain/grading";
import { normalizeText } from "../src/domain/normalize";
import { SAMPLE_QUESTIONS, QUESTIONS } from "../src/data/questions";
import type { RubricPoint } from "../src/domain/types";
const q=(id:string)=>SAMPLE_QUESTIONS.find(x=>x.id===id)!;
describe("normalize",()=>{ it("NFKC・空白・句読点を吸収",()=>{ expect(normalizeText("ＳＭ－２ 。")).toContain("sm"); }); it("長音を吸収",()=>{ expect(normalizeText("ローカルストレージ")).toBe(normalizeText("ロカルストレージ".replace("ロカル","ローカル"))); }); });
describe("choice grading",()=>{ it("完全正答",()=>{ expect(gradeChoice(q("sample-single"),[0]).correct).toBe(true); }); it("誤答",()=>{ expect(gradeChoice(q("sample-single"),[1]).correct).toBe(false); }); it("多択は順不同で一致",()=>{ expect(gradeChoice(q("sample-multi"),[2,0,1]).correct).toBe(true); }); });
describe("text grading",()=>{ it("表記揺れ（localStorage）",()=>{ expect(gradeTextAnswer(q("sample-fill")," localStorage ").correct).toBe(true); }); it("空回答は不正解",()=>{ expect(gradeTextAnswer(q("sample-fill"),"").correct).toBe(false); }); });
describe("essay rubric",()=>{ const rub=q("sample-short").rubric!; it("全要点で満点",()=>{ const r=gradeEssayRubric(rub,"要点を確認し、自己採点と分ける"); expect(r.scoreRatio).toBe(1); expect(r.missedRequiredIds).toEqual([]); }); it("一部要点のみ部分点",()=>{ const r=gradeEssayRubric(rub,"要点だけ書く"); expect(r.scoreRatio).toBe(0.5); expect(r.missedRequiredIds.length).toBe(1); }); it("空回答",()=>{ expect(gradeEssayRubric(rub,"").scoreRatio).toBe(0); }); it("特殊文字のみは0点側",()=>{ expect(gradeEssayRubric(rub,"!!!???").scoreRatio).toBe(0); }); it("基準なしは判定しない",()=>{ expect(gradeEssayRubric([],"何か").correct).toBeNull(); }); });
describe("table fill",()=>{ it("セル部分点",()=>{ expect(gradeTableFill(q("sample-tablefill"),{A:"取り込み率"}).scoreRatio).toBe(1); expect(gradeTableFill(q("sample-tablefill"),{A:"天気"}).scoreRatio).toBe(0); }); });

/* G1: 記述式採点エンジン拡張（DECISIONS #29）。A3監査の要確認4問＋要点レベル残存2件への対応。 */
describe("essay rubric G1 extensions",()=>{
  const fq=(id:string)=>QUESTIONS.find(x=>x.id===id)!;
  describe("括弧注記の任意化",()=>{
    const rub: RubricPoint[]=[{id:"a",label:"到達",keywords:["モルッカ諸島（香料諸島）に到達"],required:true,points:1}];
    it("別名を省略した正答が一致する",()=>{ expect(gradeEssayRubric(rub,"船団はモルッカ諸島に到達した").scoreRatio).toBe(1); });
    it("別名を含む原文どおりの回答も一致する",()=>{ expect(gradeEssayRubric(rub,"船団はモルッカ諸島（香料諸島）に到達した").scoreRatio).toBe(1); });
    it("到達に触れない回答は一致しない",()=>{ expect(gradeEssayRubric(rub,"モルッカ諸島は香料の産地である").scoreRatio).toBe(0); });
    it("残りが短い汎用句には任意化を適用しない",()=>{ const r2: RubricPoint[]=[{id:"b",label:"根拠",keywords:["（エビデンス）に基づいて"],required:true,points:1}]; expect(gradeEssayRubric(r2,"別の考えに基づいて述べた").scoreRatio).toBe(0); expect(gradeEssayRubric(r2,"エビデンスに基づいて述べた").scoreRatio).toBe(1); });
    it("対象問題 qle-spice-trade-history で別名省略の模範解答が満点",()=>{ const qq=fq("qle-spice-trade-history"); const ans=qq.modelAnswer!.replace("モルッカ諸島（香料諸島）に到達し","モルッカ諸島に到達し"); expect(ans).not.toBe(qq.modelAnswer); expect(gradeEssayRubric(qq.rubric!,ans).scoreRatio).toBe(1); });
  });
  describe("単漢字キーワードの境界判定（qse-dry-storage）",()=>{
    const rub=fq("qse-dry-storage").rubric!;
    it("模範解答は満点",()=>{ expect(gradeEssayRubric(rub,fq("qse-dry-storage").modelAnswer!).scoreRatio).toBe(1); });
    it("列挙の言い換え（光と熱）が一致する",()=>{ const r=gradeEssayRubric(rub,"大敵は光と熱と湿気。蓋をしっかり閉めて冷暗所で保存する"); expect(r.scoreRatio).toBe(1); });
    it("無関係な文脈の同字（加熱・日光）では要点が成立しない",()=>{ const r=gradeEssayRubric(rub,"加熱した料理を日光に当てた。湿気を避け、蓋をしっかり閉めて冷暗所で保存する"); expect(r.matchedPointIds).not.toContain("light"); expect(r.matchedPointIds).not.toContain("heat"); expect(r.scoreRatio).toBe(0.5); });
  });
  describe("近接AND結合 keywordGroups（qse-room-spray）",()=>{
    const rub=fq("qse-room-spray").rubric!;
    it("助詞を入れた正答が満点",()=>{ expect(gradeEssayRubric(rub,"無水エタノールを5mℓ入れ、好みの精油を20滴以下たらし、よく振って混ぜる。精製水を45mℓ加える").scoreRatio).toBe(1); });
    it("材料と分量の入れ替えは満点にならない（数字の途中一致も数えない）",()=>{ const r=gradeEssayRubric(rub,"無水エタノール45mℓに精油20滴以下をたらし、精製水5mℓを加える"); expect(r.matchedPointIds).toEqual(["oil"]); expect(r.scoreRatio).toBeCloseTo(1/3); });
    it("断片が離れた回答は一致しない",()=>{ const r=gradeEssayRubric(rub,"無水エタノールを容器にたっぷり入れてから量をはかると5mℓだった。精油20滴以下、精製水45mℓ"); expect(r.matchedPointIds).not.toContain("ethanol"); });
  });
  describe("近接AND結合 keywordGroups（qle-salt-reduction の男女別基準）",()=>{
    const qq=fq("qle-salt-reduction");
    it("助詞を入れた正答が満点",()=>{ const ans=qq.modelAnswer!.replace("男性7.5g未満、女性6.5g未満","男性は7.5g未満、女性は6.5g未満"); expect(gradeEssayRubric(qq.rubric!,ans).scoreRatio).toBe(1); });
    it("男女の取り違えでは両要点が成立しない",()=>{ const ans=qq.modelAnswer!.replace("男性7.5g未満、女性6.5g未満","男性は6.5g未満、女性は7.5g未満"); const r=gradeEssayRubric(qq.rubric!,ans); expect(r.missedRequiredIds).toContain("male"); expect(r.missedRequiredIds).toContain("female"); expect(r.scoreRatio).toBeCloseTo(4/6); });
  });
  describe("主語区間判定 subject（qce-three-peppers）",()=>{
    const qq=fq("qce-three-peppers");
    it("対象名のない模範解答は従来どおり満点（フォールバック）",()=>{ expect(gradeEssayRubric(qq.rubric!,qq.modelAnswer!).scoreRatio).toBe(1); });
    it("対象名つきの正答が満点",()=>{ expect(gradeEssayRubric(qq.rubric!,"ブラックペッパーは未熟果を天日に果皮ごと干して乾燥させ、野性的な香りと強い辛みが特徴。ホワイトペッパーは果皮を除いて核部分のみを乾燥させ、色の淡い料理に用いられることが多い。グリーンペッパーは未熟果を摘み取って機械乾燥させる。爽やかな香りと辛み、美しい緑色が特徴。").scoreRatio).toBe(1); });
    it("ブラックとホワイトの属性入れ替えは満点にならない",()=>{ const r=gradeEssayRubric(qq.rubric!,"ブラックペッパーは果皮を除いて核部分のみを乾燥させ、色の淡い料理に用いられることが多い。ホワイトペッパーは未熟果を天日に果皮ごと干して乾燥させ、野性的な香りと強い辛みが特徴。グリーンペッパーは未熟果を摘み取って機械乾燥させる。爽やかな香りと辛み、美しい緑色が特徴。"); expect(r.matchedPointIds).toEqual(["green-method","green-taste"]); expect(r.scoreRatio).toBeCloseTo(2/6); });
  });
  describe("主語区間判定 subject（qce-rosemary-types）",()=>{
    const qq=fq("qce-rosemary-types");
    it("斜線区切りの模範解答は満点",()=>{ expect(gradeEssayRubric(qq.rubric!,qq.modelAnswer!).scoreRatio).toBe(1); });
    it("通常の文（立性は…）の正答が満点",()=>{ expect(gradeEssayRubric(qq.rubric!,"立性は茎がまっすぐ伸びて、大きめでかたい葉をつける。ほふく性は茎が横に広がっていき、小さめでやわらかい葉をつける。半立性は茎の伸び方は立性とほふく性の間くらいで、3種類の中で一番香りがよく、料理に向いている。").scoreRatio).toBe(1); });
    it("立性とほふく性の属性入れ替えは満点にならない",()=>{ const r=gradeEssayRubric(qq.rubric!,"立性は茎が横に広がっていき、小さめでやわらかい葉をつける。ほふく性は茎がまっすぐ伸びて、大きめでかたい葉をつける。半立性は茎の伸び方は立性とほふく性の間くらいで、3種類の中で一番香りがよく、料理に向いている。"); expect(r.matchedPointIds).toEqual(["semi-form","semi-aroma"]); expect(r.scoreRatio).toBeCloseTo(2/6); });
  });
});
