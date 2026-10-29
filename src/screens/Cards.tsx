// 画面コンポーネント（バンドル分割バッチE1で src/App.tsx から分割。docs/DECISIONS.md #23）
import { useState } from "react";
import { CARDS, SAMPLE_CARDS } from "../data/questions";

export default function Cards(){
 const all=[...CARDS, ...SAMPLE_CARDS]; const [i,setI]=useState(0); const [flip,setFlip]=useState(false); const c=all[i % Math.max(1,all.length)];
 return <main><h1>フラッシュカード・単語帳</h1>{!c?<p className="card">正式カードはまだありません。</p>:<><div className="card flash" role="button" aria-label="カード反転" onClick={()=>setFlip(!flip)}>{flip? c.back : c.front}</div><p className="muted">{c.status==="sample"?"サンプルカード":"正式カード"} ／ 章: {c.chapterId} ／ 節: {c.sectionId}</p><p><button className="ghost" onClick={()=>{setFlip(false); setI(i+1);}}>次のカード</button></p><p className="muted">逆方向・穴埋め・比較・画像カードは問題形式（flashcard / reverse-lookup 等）として型定義済み。理解度評価は演習のSRSと共通基盤を使います。</p></>}</main>;
}
