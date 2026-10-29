
import type { Question, RubricPoint } from "./types";
import { normalizeText, includesNormalized } from "./normalize";
export interface GradeResult { correct: boolean|null; scoreRatio: number; autoScoreRatio: number; matchedPointIds: string[]; missedRequiredIds: string[]; note: string; }
export function gradeChoice(q: Question, selected: number[]): GradeResult {
  const correct = [...(q.correctChoiceIndexes ?? [])].sort().join(","); const got=[...selected].sort().join(",");
  const ok = correct.length>0 && correct===got;
  return { correct: ok, scoreRatio: ok?1:0, autoScoreRatio: ok?1:0, matchedPointIds: [], missedRequiredIds: [], note: ok?"正解":"不正解" };
}
export function gradeBoolean(q: Question, value: boolean): GradeResult { const ok = q.correctBoolean===value; return { correct: ok, scoreRatio: ok?1:0, autoScoreRatio: ok?1:0, matchedPointIds:[], missedRequiredIds:[], note: ok?"正解":"不正解" }; }
export function gradeTextAnswer(q: Question, answer: string): GradeResult {
  const a = normalizeText(answer); if (!a) return { correct:false, scoreRatio:0, autoScoreRatio:0, matchedPointIds:[], missedRequiredIds:[], note:"空回答" };
  const ok = (q.acceptedAnswers ?? []).some(x=> normalizeText(x)===a);
  return { correct: ok, scoreRatio: ok?1:0, autoScoreRatio: ok?1:0, matchedPointIds:[], missedRequiredIds:[], note: ok?"正解（表記揺れ正規化後）":"不一致" };
}
export function gradeOrdering(q: Question, order: string[]): GradeResult { const ok = JSON.stringify(order)===JSON.stringify(q.correctOrder ?? []); return { correct: ok, scoreRatio: ok?1:0, autoScoreRatio: ok?1:0, matchedPointIds:[], missedRequiredIds:[], note: ok?"正解":"順序が異なる" }; }
export function gradeMatching(q: Question, pairs: Record<string,string>): GradeResult {
  const all = q.matchingPairs ?? []; if (!all.length) return {correct:null,scoreRatio:0,autoScoreRatio:0,matchedPointIds:[],missedRequiredIds:[],note:"採点基準なし"};
  const hit = all.filter(p=> pairs[p.left]===p.right).length; const ratio = hit/all.length;
  return { correct: ratio===1, scoreRatio: ratio, autoScoreRatio: ratio, matchedPointIds:[], missedRequiredIds:[], note: `${hit}/${all.length} 一致` };
}
export function gradeTableFill(q: Question, cells: Record<string,string>): GradeResult {
  const exp = q.blankCellAnswers ?? {}; const keys = Object.keys(exp); if (!keys.length) return {correct:null,scoreRatio:0,autoScoreRatio:0,matchedPointIds:[],missedRequiredIds:[],note:"採点基準なし"};
  const hit = keys.filter(k=> normalizeText(cells[k] ?? "")===normalizeText(exp[k]!)).length; const ratio=hit/keys.length;
  return { correct: ratio===1, scoreRatio: ratio, autoScoreRatio: ratio, matchedPointIds:[], missedRequiredIds:[], note: `${hit}/${keys.length} セル正解` };
}
/** 要点チェック式ルールベース採点。意味の完全理解はできないため、結果は「自動判定」として自己採点と分離する。 */
export function gradeEssayRubric(rubric: RubricPoint[], answer: string): GradeResult {
  if (!rubric.length) return { correct:null, scoreRatio:0, autoScoreRatio:0, matchedPointIds:[], missedRequiredIds:[], note:"採点基準（要点）が未設定のため自動判定しない" };
  if (!answer.trim()) return { correct:false, scoreRatio:0, autoScoreRatio:0, matchedPointIds:[], missedRequiredIds: rubric.filter(r=>r.required).map(r=>r.id), note:"空回答" };
  let total=0, got=0; const matched:string[]=[]; const missed:string[]=[];
  for (const p of rubric) { total+=p.points; const hit = p.keywords.some(k=> includesNormalized(answer,k)); if (hit){got+=p.points; matched.push(p.id);} else if (p.required) missed.push(p.id); }
  const ratio = total? got/total:0;
  return { correct: missed.length===0 && ratio===1 ? true : ratio===0 ? false : null, scoreRatio: ratio, autoScoreRatio: ratio, matchedPointIds: matched, missedRequiredIds: missed, note: "ルールベース自動判定（要点キーワード一致）。最終判定は自己採点と分離して保存される。" };
}
export function gradeQuestion(q: Question, answer: unknown): GradeResult {
  switch(q.format){
    case "single-choice": case "multiple-choice": case "reverse-lookup": case "photo-id": case "figure": case "flashcard": return gradeChoice(q, (answer as number[]) ?? []);
    case "true-false": return gradeBoolean(q, answer as boolean);
    case "fill-blank": case "term-input": case "one-answer": return gradeTextAnswer(q, String(answer ?? ""));
    case "ordering": return gradeOrdering(q, (answer as string[]) ?? []);
    case "matching": return gradeMatching(q, (answer as Record<string,string>) ?? {});
    case "table-fill": return gradeTableFill(q, (answer as Record<string,string>) ?? {});
    default: return gradeEssayRubric(q.rubric ?? [], String(answer ?? ""));
  }
}
