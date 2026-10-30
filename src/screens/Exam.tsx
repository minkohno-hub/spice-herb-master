// 画面コンポーネント（バンドル分割バッチE1で src/App.tsx から分割。docs/DECISIONS.md #23）
import { useState } from "react";
import { APP_DATA_SUMMARY } from "../data/summary";
import type { StoreData } from "../domain/store";

export default function Exam({store,update}:{store:StoreData;update:any}){
 const [mins,setMins]=useState(10); const [started,setStarted]=useState(false); const [done,setDone]=useState(false);
 return <main><h1>模擬試験（練習用）</h1><p className="muted">実際の試験制度の公式形式を再現したと断定するものではありません。独自の練習用試験です。解答確定まで教科書本文・正解は表示されません。</p>
 {!started? <div className="card"><label>制限時間（分）<input type="number" value={mins} onChange={e=>setMins(Number(e.target.value)||10)}/></label><p>出題候補（検証済み）: {APP_DATA_SUMMARY.formalQuestions}問</p><button onClick={()=>{setStarted(true); update((d:StoreData)=>({...d,examDraft:{startedAt:new Date().toISOString(),mins}}));}}>開始（途中状態を保存）</button></div>
 : done? <div className="card"><h2>結果</h2><p>一括採点は演習記録に基づきます。総解答 {store.records.length}件。誤答は演習画面で復習できます。</p></div>
 : <div className="card"><p>模試進行中（制限時間 {mins}分・途中保存済み）。出題候補の検証済み問題は {APP_DATA_SUMMARY.formalQuestions}問です。</p><button onClick={()=>{setDone(true); update((d:StoreData)=>({...d,examDraft:null}));}}>終了して一括採点へ</button></div>}
 </main>;
}
