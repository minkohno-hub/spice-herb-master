// 画面コンポーネント（バンドル分割バッチE1で src/App.tsx から分割。docs/DECISIONS.md #23）
import { useState } from "react";
import { QUESTIONS, SAMPLE_QUESTIONS } from "../data/questions";
import QuestionRunner from "../components/QuestionRunner";
import { FORMAT_LABELS, QUESTION_FORMATS } from "../domain/types";
import type { StoreData } from "../domain/store";
import { initSrs, reviewSrs, qualityFromResult } from "../domain/srs";
import { selectForPractice } from "../domain/validate";
import type { GradeResult } from "../domain/grading";

export default function Practice({store,update}:{store:StoreData;update:any}){
 const [mode,setMode]=useState("sample"); const [idx,setIdx]=useState(0); const [count,setCount]=useState(10);
 const pool = mode==="sample"? SAMPLE_QUESTIONS : selectForPractice(QUESTIONS);
 const q = pool[idx % Math.max(1,pool.length)];
 return <main><h1>演習</h1>
 <label>モード<select value={mode} onChange={e=>{setMode(e.target.value); setIdx(0);}}><option value="verified">通常演習（検証済みのみ）</option><option value="sample">エンジン検証用サンプル（通常出題対象外・明示表示）</option></select></label>
 <label>問題数（設定値）<input type="number" value={count} onChange={e=>setCount(Number(e.target.value)||10)}/></label>
 <p className="muted">章別・節別・分野別・難易度別・形式別・未回答・誤答・苦手・お気に入り・復習予定・記述集中・高速演習は、下の絞り込みとSRS/記録データで構成される設計です（フィルタ基盤は検索画面と共通）。形式一覧: {QUESTION_FORMATS.map(f=>FORMAT_LABELS[f]).join(" / ")}</p>
 {!q ? <p className="card">出題できる検証済み問題がありません。「問題が存在しない」ことを学習済みと誤認しないでください。</p> :
 <><QuestionRunner key={q.id} q={q} onGraded={(r:GradeResult,self)=>{ update((d:StoreData)=>{ d.records.push({questionId:q.id,answeredAt:new Date().toISOString(),correct:r.correct,scoreRatio:r.scoreRatio,autoScoreRatio:r.autoScoreRatio,selfScoreRatio:self,responseMs:null}); const cur=d.srs[q.id]??initSrs(q.id); d.srs[q.id]=reviewSrs(cur, qualityFromResult(r.correct,r.scoreRatio)); return d; }); }}/>
 <p><button className="ghost" onClick={()=>setIdx(idx+1)}>次の問題へ</button> <button className="ghost" onClick={()=>update((d:StoreData)=>({...d,favorites: d.favorites.includes(q.id)? d.favorites: [...d.favorites,q.id]}))}>お気に入りに追加</button></p></>}
 </main>;
}
