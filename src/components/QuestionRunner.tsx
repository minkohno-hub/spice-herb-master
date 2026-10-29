
import { useState } from "react";
import type { Question } from "../domain/types";
import { gradeQuestion, type GradeResult } from "../domain/grading";
export default function QuestionRunner({ q, onGraded }: { q: Question; onGraded?: (r: GradeResult, selfRatio: number|null)=>void }) {
  const [selected, setSelected] = useState<number[]>([]);
  const [boolVal, setBoolVal] = useState<boolean|null>(null);
  const [text, setText] = useState("");
  const [order, setOrder] = useState<string[]>(q.orderingItems ?? []);
  const [pairs, setPairs] = useState<Record<string,string>>({});
  const [cells, setCells] = useState<Record<string,string>>({});
  const [result, setResult] = useState<GradeResult|null>(null);
  const [selfRatio, setSelfRatio] = useState<number|null>(null);
  const [flipped, setFlipped] = useState(false);
  const essay = ["short-essay","long-essay","compare-essay","composite"].includes(q.format);
  const submit = () => {
    let ans: unknown = text;
    if (q.choices) ans = selected; else if (q.format==="true-false") ans = boolVal;
    else if (q.format==="ordering") ans = order; else if (q.format==="matching") ans = pairs; else if (q.format==="table-fill") ans = cells;
    const r = gradeQuestion(q, ans); setResult(r); onGraded?.(r, selfRatio);
  };
  return <div className="card" aria-label="問題">
    <p><span className="badge">{q.status==="sample"?"サンプル（通常出題対象外）":q.status}</span> <span className="muted">難易度 {q.difficulty}</span></p>
    <h2 style={{fontSize:"1.1rem"}}>{q.prompt}</h2>
    {q.imageAlt && <p className="muted" role="img" aria-label={q.imageAlt}>🖼 {q.imageRef? q.imageRef : "画像は未設定です（教科書画像は未取り込み）"}</p>}
    {q.table && <table><thead><tr>{q.table.headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{q.table.rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table>}
    {q.choices && <div role="group" aria-label="選択肢">{q.choices.map((c,i)=>{ const multi = q.format==="multiple-choice"; return <label key={i} style={{display:"block",padding:".4rem"}}><input style={{width:"auto"}} type={multi?"checkbox":"radio"} name={q.id} checked={selected.includes(i)} onChange={()=> setSelected(multi? (selected.includes(i)? selected.filter(x=>x!==i): [...selected,i]) : [i])}/> {c}</label>;})}</div>}
    {q.format==="true-false" && <div><button type="button" className={boolVal===true?"":"ghost"} onClick={()=>setBoolVal(true)}>○ 正しい</button> <button type="button" className={boolVal===false?"":"ghost"} onClick={()=>setBoolVal(false)}>× 誤り</button></div>}
    {(q.format==="fill-blank"||q.format==="term-input"||q.format==="one-answer") && <input aria-label="回答入力" value={text} onChange={e=>setText(e.target.value)} />}
    {essay && <><textarea aria-label="記述回答" rows={q.format==="long-essay"?8:4} value={text} onChange={e=>setText(e.target.value)} placeholder="ここに記述（音声入力はブラウザ対応時のみキーボードの音声入力を利用可）"/>
      <label>自己採点（自動判定と分離保存）<select aria-label="自己採点" value={selfRatio??""} onChange={e=>setSelfRatio(e.target.value===""?null:Number(e.target.value))}><option value="">未選択</option><option value="1">満点だと思う</option><option value="0.5">半分程度</option><option value="0">できなかった</option></select></label></>}
    {q.format==="ordering" && <div><p className="muted">上下ボタンで並べ替え</p>{order.map((it,i)=><p key={it}>{it} <button type="button" className="ghost" disabled={i===0} onClick={()=>{const n=[...order]; [n[i-1],n[i]]=[n[i]!,n[i-1]!]; setOrder(n);}}>↑</button> <button type="button" className="ghost" disabled={i===order.length-1} onClick={()=>{const n=[...order]; [n[i+1],n[i]]=[n[i]!,n[i+1]!]; setOrder(n);}}>↓</button></p>)}</div>}
    {q.format==="matching" && <div>{(q.matchingPairs??[]).map(p=><label key={p.left}>{p.left}<select aria-label={p.left} value={pairs[p.left]??""} onChange={e=>setPairs({...pairs,[p.left]:e.target.value})}><option value="">選択</option>{(q.matchingPairs??[]).map(x=><option key={x.right} value={x.right}>{x.right}</option>)}</select></label>)}</div>}
    {q.format==="table-fill" && <div>{Object.keys(q.blankCellAnswers??{}).map(k=><label key={k}>空欄{k}<input aria-label={"空欄"+k} value={cells[k]??""} onChange={e=>setCells({...cells,[k]:e.target.value})}/></label>)}</div>}
    {q.format==="flashcard" && <div className="card flash" onClick={()=>setFlipped(!flipped)} role="button" aria-label="カード反転">{flipped? q.explanation : "タップしてヒント/解説を表示"}</div>}
    <p><button type="button" onClick={submit}>回答を確定する</button></p>
    {result && <div aria-live="polite"><p className={result.correct===true?"ok":result.correct===false?"bad":""}>{result.correct===true?"正解":result.correct===false?"不正解":"部分点・要自己確認"}（スコア {Math.round(result.scoreRatio*100)}%）</p><p>{result.note}</p>
      {q.rubric && <ul>{q.rubric.map(r=><li key={r.id}>{result.matchedPointIds.includes(r.id)?"✓":"−"} {r.label}{r.required?"（必須）":""}</li>)}</ul>}
      {q.modelAnswer && <p><strong>模範解答（サンプル）:</strong> {q.modelAnswer}</p>}
      <p><strong>解説:</strong> {q.explanation}</p>
      <p className="muted">出典: {q.sourceRefs.length? q.sourceRefs.map(s=>`${s.manifestImageId} p.${s.bookPage??"未確定"}`).join(", ") : "なし（サンプルのため正式問題ではありません）"} ／ 関連節: {q.sectionId}</p></div>}
  </div>;
}
