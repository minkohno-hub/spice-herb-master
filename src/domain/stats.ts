
import type { AnswerRecord, Question, KnowledgeUnit } from "./types";
export interface Coverage { importedRatio: number|null; unitExtractionRatio: number|null; questionizedRatio: number|null; studiedRatio: number|null; masteredRatio: number|null; }
export function computeStats(records: AnswerRecord[], questions: Question[]) {
  const total = records.length; const correct = records.filter(r=>r.correct===true).length;
  const by = (key: (q:Question)=>string) => { const m = new Map<string,{total:number;correct:number}>(); for(const r of records){ const q=questions.find(x=>x.id===r.questionId); if(!q) continue; const k=key(q); const e=m.get(k)??{total:0,correct:0}; e.total++; if(r.correct===true) e.correct++; m.set(k,e);} return m; };
  return { total, correct, accuracy: total? correct/total : null, byChapter: by(q=>q.chapterId), byFormat: by(q=>q.format), byDifficulty: by(q=>String(q.difficulty)) };
}
export function computeCoverage(args: {presentImages:number; expectedImages:number; units:KnowledgeUnit[]; totalSections:number; questions:Question[]; records:AnswerRecord[]}): Coverage {
  const {presentImages, expectedImages, units, questions, records} = args;
  const verifiedUnits = units; const questionized = new Set(questions.filter(q=>q.status==="verified").flatMap(q=>q.knowledgeUnitIds));
  const studiedQ = new Set(records.map(r=>r.questionId));
  const verifiedQ = questions.filter(q=>q.status==="verified");
  const studiedVerified = verifiedQ.filter(q=>studiedQ.has(q.id)).length;
  const mastered = verifiedQ.filter(q=>{ const rs=records.filter(r=>r.questionId===q.id); return rs.length>=2 && rs.slice(-2).every(r=>r.correct===true); }).length;
  return {
    importedRatio: expectedImages? presentImages/expectedImages : null,
    unitExtractionRatio: null, // 教材総量（全文転記後の知識単位総数）が未確定のため算出不能。null=未測定として表示する
    questionizedRatio: verifiedUnits.length? questionized.size/verifiedUnits.length : null,
    studiedRatio: verifiedQ.length? studiedVerified/verifiedQ.length : null,
    masteredRatio: verifiedQ.length? mastered/verifiedQ.length : null,
  };
}
