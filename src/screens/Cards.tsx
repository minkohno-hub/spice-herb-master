// 画面コンポーネント（バンドル分割バッチE1で src/App.tsx から分割。docs/DECISIONS.md #23）
// バッチC1で自己評価UIを追加（docs/DECISIONS.md #32）: 裏面表示後に3段階の自己評価を記録し、
// 演習と共通の SRS（store.srs、キーはカードID）に反映する。解答記録（records）には追加しない。
import { useState } from "react";
import { CARDS, SAMPLE_CARDS } from "../data/questions";
import type { StoreData } from "../domain/store";
import { applyCardReview, isDue, type CardSelfEval } from "../domain/srs";

const EVAL_OPTIONS: { key: CardSelfEval; label: string }[] = [
 { key: "known", label: "分かった" },
 { key: "unsure", label: "あいまい" },
 { key: "unknown", label: "分からない" },
];

export default function Cards({store, update}:{store:StoreData; update:any}){
 const all=[...CARDS, ...SAMPLE_CARDS]; const [i,setI]=useState(0); const [flip,setFlip]=useState(false); const c=all[i % Math.max(1,all.length)];
 if(!c) return <main><h1>フラッシュカード・単語帳</h1><p className="card">正式カードはまだありません。</p></main>;
 const st=store.srs[c.id];
 const evaluated=all.filter(x=>store.srs[x.id]).length;
 const evaluate=(ev:CardSelfEval)=>{ update((d:StoreData)=>{ d.srs[c.id]=applyCardReview(d.srs[c.id], c.id, ev); return d; }); setFlip(false); setI(i+1); };
 return <main><h1>フラッシュカード・単語帳</h1><div className="card flash" role="button" aria-label="カード反転" onClick={()=>setFlip(!flip)}>{flip? c.back : c.front}</div><p className="muted">{c.status==="sample"?"サンプルカード":"正式カード"} ／ 章: {c.chapterId} ／ 節: {c.sectionId}</p>
 <p className="muted">{st? <>このカードの状態: 評価済み（復習 {st.repetitions} 回 ・ 次回 {st.dueAt.slice(0,10)}{isDue(st)?" ・ 期限到来":""}）</> : "このカードの状態: 未評価"} ／ 評価済み {evaluated} / 全 {all.length} 件</p>
 {flip? <p>自己評価: {EVAL_OPTIONS.map(o=><button key={o.key} className="ghost" onClick={()=>evaluate(o.key)}>{o.label}</button>)} </p> : <p className="muted">カードをクリックして裏面を表示すると、自己評価（分かった／あいまい／分からない）を記録できます。</p>}
 <p><button className="ghost" onClick={()=>{setFlip(false); setI(i+1);}}>次のカード</button></p><p className="muted">逆方向・穴埋め・比較・画像カードは問題形式（flashcard / reverse-lookup 等）として型定義済み。自己評価は演習と共通のSRS（間隔反復）に反映され、復習予定として学習分析・ホームの期限到来件数にも数えられます（解答記録には追加されません）。</p></main>;
}
