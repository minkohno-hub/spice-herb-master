
import { useMemo, useState } from "react";
import { Routes, Route, Link } from "react-router";
import { CHAPTERS, ALL_SECTIONS } from "./data/structure";
import { QUESTIONS, SAMPLE_QUESTIONS, CARDS, SAMPLE_CARDS, KNOWLEDGE_UNITS } from "./data/questions";
import { IMPORTED_KNOWLEDGE_UNITS, KNOWLEDGE_IMPORT_META } from "./data/knowledge";
import manifest from "./data/source-manifest.json";
import QuestionRunner from "./components/QuestionRunner";
import { FORMAT_LABELS, QUESTION_FORMATS } from "./domain/types";
import { loadStore, saveStore, type StoreData } from "./domain/store";
import { computeStats, computeCoverage } from "./domain/stats";
import { initSrs, reviewSrs, qualityFromResult, isDue } from "./domain/srs";
import { validateQuestion, findDuplicateCandidates, selectForPractice } from "./domain/validate";
import type { GradeResult } from "./domain/grading";

function useAppStore(){ const [store,setStore]=useState<StoreData>(()=>loadStore()); const update=(fn:(d:StoreData)=>StoreData)=>{ setStore(prev=>{ const n=fn(structuredClone(prev)); saveStore(n); return n; }); }; return {store,update}; }

function Home({store,update}:{store:StoreData;update:any}){
 const due = Object.values(store.srs).filter(s=>isDue(s)).length;
 const stats = computeStats(store.records, [...QUESTIONS, ...SAMPLE_QUESTIONS]);
 const today = new Date().toISOString().slice(0,10); const todayCount = store.records.filter(r=>r.answeredAt.startsWith(today)).length;
 return <main><h1>スパイス＆ハーブ検定1級 学習アプリ</h1>
 <p className="badge">フェーズ1（土台）: 正式問題はまだ0問です。本文転記が済んでいないため、教科書知識の問題は作っていません。</p>
 <section className="grid" aria-label="主要機能">
  <div className="card"><h2>前回の続き</h2><p>{store.reader.sectionId? `読書位置: ${store.reader.sectionId}` : "まだ読書位置がありません"}</p><Link className="btn" to="/reader">電子書籍を開く</Link></div>
  <div className="card"><h2>今日の復習</h2><p>復習予定: {due}件 ／ 今日の解答: {todayCount}件</p><Link className="btn" to="/practice">演習へ</Link></div>
  <div className="card"><h2>ランダム演習</h2><p>正式問題 {QUESTIONS.length}問（未登録）</p><Link className="btn" to="/practice">演習設定へ</Link></div>
  <div className="card"><h2>苦手克服</h2><p>誤答記録: {store.records.filter(r=>r.correct===false).length}件</p><Link className="btn" to="/stats">学習分析へ</Link></div>
  <div className="card"><h2>模擬試験</h2><p>練習用（公式形式の再現とは断定しません）</p><Link className="btn" to="/exam">模試へ</Link></div>
  <div className="card"><h2>単語帳</h2><p>正式カード {CARDS.length}件／サンプル {SAMPLE_CARDS.length}件</p><Link className="btn" to="/cards">カードへ</Link></div>
  <div className="card"><h2>学習進捗</h2><p>総解答 {stats.total} ／ 正答率 {stats.accuracy==null?"—":Math.round(stats.accuracy*100)+"%"}</p><Link className="btn" to="/stats">進捗を見る</Link></div>
  <div className="card"><h2>今日の目標</h2><label>1日の目標（問）<input type="number" min={1} value={store.goalPerDay} onChange={e=>update((d:StoreData)=>({...d,goalPerDay:Number(e.target.value)||10}))}/></label><p>達成: {todayCount}/{store.goalPerDay}</p></div>
 </section>
 <section className="card"><h2>教材の状態（正直な表示）</h2><p>取り込み済み画像: {manifest.totalPresent}件 ／ 欠落: {manifest.totalMissing}件（IMG_9647.PNG）／ 全文転記: 未実施 ／ 取り込み済み知識単位: {IMPORTED_KNOWLEDGE_UNITS.length}件（全件 未検証・出典: {KNOWLEDGE_IMPORT_META.origin}）／ 検証済み知識単位: {KNOWLEDGE_UNITS.length}件 ／ 正式問題: {QUESTIONS.length}問</p><p className="muted">「全文収録済み」ではありません。取り込み済み知識単位は内容の人手照合が未実施のため未検証のまま表示します。詳細は docs/SOURCE_COVERAGE.md を参照。</p></section>
 </main>;
}
function Practice({store,update}:{store:StoreData;update:any}){
 const [mode,setMode]=useState("sample"); const [idx,setIdx]=useState(0); const [count,setCount]=useState(10);
 const pool = mode==="sample"? SAMPLE_QUESTIONS : selectForPractice(QUESTIONS);
 const q = pool[idx % Math.max(1,pool.length)];
 return <main><h1>演習</h1>
 <label>モード<select value={mode} onChange={e=>{setMode(e.target.value); setIdx(0);}}><option value="verified">通常演習（検証済みのみ）</option><option value="sample">エンジン検証用サンプル（通常出題対象外・明示表示）</option></select></label>
 <label>問題数（設定値）<input type="number" value={count} onChange={e=>setCount(Number(e.target.value)||10)}/></label>
 <p className="muted">章別・節別・分野別・難易度別・形式別・未回答・誤答・苦手・お気に入り・復習予定・記述集中・高速演習は、下の絞り込みとSRS/記録データで構成される設計です（フィルタ基盤は検索画面と共通）。形式一覧: {QUESTION_FORMATS.map(f=>FORMAT_LABELS[f]).join(" / ")}</p>
 {!q ? <p className="card">出題できる検証済み問題がまだありません。本文転記と出典検証が完了した問題から順次登録されます。「問題が存在しない」ことを学習済みと誤認しないでください。</p> :
 <><QuestionRunner key={q.id} q={q} onGraded={(r:GradeResult,self)=>{ update((d:StoreData)=>{ d.records.push({questionId:q.id,answeredAt:new Date().toISOString(),correct:r.correct,scoreRatio:r.scoreRatio,autoScoreRatio:r.autoScoreRatio,selfScoreRatio:self,responseMs:null}); const cur=d.srs[q.id]??initSrs(q.id); d.srs[q.id]=reviewSrs(cur, qualityFromResult(r.correct,r.scoreRatio)); return d; }); }}/>
 <p><button className="ghost" onClick={()=>setIdx(idx+1)}>次の問題へ</button> <button className="ghost" onClick={()=>update((d:StoreData)=>({...d,favorites: d.favorites.includes(q.id)? d.favorites: [...d.favorites,q.id]}))}>お気に入りに追加</button></p></>}
 </main>;
}
function Reader({store,update}:{store:StoreData;update:any}){
 const [sel,setSel]=useState(store.reader.sectionId || ALL_SECTIONS[0]!.id); const [query,setQuery]=useState("");
 const sec = ALL_SECTIONS.find(s=>s.id===sel) ?? ALL_SECTIONS[0]!;
 const filtered = ALL_SECTIONS.filter(s=>!query || s.title.includes(query));
 return <main data-dark={store.reader.dark}><h1>電子書籍リーダー</h1>
 <div className="split"><section className="card"><h2>目次（目次ページで照合済み）</h2><input aria-label="節検索" placeholder="語句検索" value={query} onChange={e=>setQuery(e.target.value)}/>
 {CHAPTERS.map(c=><div key={c.id}><h3>{c.label} {c.title}</h3><ul>{c.sections.filter(s=>filtered.includes(s as any)).map(s=><li key={s.id}><button className="ghost" onClick={()=>{setSel(s.id); update((d:StoreData)=>{d.reader.sectionId=s.id; return d;});}}>{s.title}（p.{s.bookPage}）</button></li>)}</ul></div>)}
 </section>
 <section className="card" style={{fontSize: store.reader.fontSize}}><h2>{sec.title}</h2><p className="muted">書籍 p.{sec.bookPage} ／ 転記状態: {sec.transcriptionStatus}</p>
 <p>この節の本文はまだ転記されていません。原本画像との照合が済んだテキストのみがここに掲載されます。推測で本文を補うことはしません。</p>
 <label>フォントサイズ<input type="range" min={14} max={22} value={store.reader.fontSize} onChange={e=>update((d:StoreData)=>{d.reader.fontSize=Number(e.target.value); return d;})}/></label>
 <p><button className="ghost" onClick={()=>update((d:StoreData)=>{d.reader.dark=!d.reader.dark; return d;})}>ダークモード切替</button> <button className="ghost" onClick={()=>update((d:StoreData)=>{ if(!d.reader.bookmarks.includes(sec.id)) d.reader.bookmarks.push(sec.id); return d;})}>しおり</button></p>
 <label>ハイライト（この節の強調メモ）<input value={store.reader.highlights[sec.id]??""} onChange={e=>update((d:StoreData)=>{d.reader.highlights[sec.id]=e.target.value; return d;})}/></label>
 <label>簡易メモ（原文とは区別して保存）<textarea value={store.reader.notes[sec.id]??""} onChange={e=>update((d:StoreData)=>{d.reader.notes[sec.id]=e.target.value; return d;})}/></label>
 <p>関連問題: {QUESTIONS.filter(q=>q.sectionId===sec.id).length}問（正式） ／ このページの取り込み済み知識単位（未検証）: {IMPORTED_KNOWLEDGE_UNITS.filter(u=>u.source.page===sec.bookPage).length}件 ／ しおり: {store.reader.bookmarks.join(", ")||"なし"}</p>
 <p className="muted">PCではこの分割表示、スマホでは縦積み表示になります。模擬試験中は本文・正解を表示しない設計です（模試画面参照）。</p>
 </section></div></main>;
}
function Cards(){
 const all=[...CARDS, ...SAMPLE_CARDS]; const [i,setI]=useState(0); const [flip,setFlip]=useState(false); const c=all[i % Math.max(1,all.length)];
 return <main><h1>フラッシュカード・単語帳</h1>{!c?<p className="card">正式カードはまだありません。</p>:<><div className="card flash" role="button" aria-label="カード反転" onClick={()=>setFlip(!flip)}>{flip? c.back : c.front}</div><p className="muted">{c.status==="sample"?"サンプルカード":"正式カード"} ／ 章: {c.chapterId} ／ 節: {c.sectionId}</p><p><button className="ghost" onClick={()=>{setFlip(false); setI(i+1);}}>次のカード</button></p><p className="muted">逆方向・穴埋め・比較・画像カードは問題形式（flashcard / reverse-lookup 等）として型定義済み。理解度評価は演習のSRSと共通基盤を使います。</p></>}</main>;
}
function Exam({store,update}:{store:StoreData;update:any}){
 const [mins,setMins]=useState(10); const [started,setStarted]=useState(false); const [done,setDone]=useState(false);
 return <main><h1>模擬試験（練習用）</h1><p className="muted">実際の試験制度の公式形式を再現したと断定するものではありません。独自の練習用試験です。解答確定まで教科書本文・正解は表示されません。</p>
 {!started? <div className="card"><label>制限時間（分）<input type="number" value={mins} onChange={e=>setMins(Number(e.target.value)||10)}/></label><p>出題候補（検証済み）: {QUESTIONS.length}問</p><button onClick={()=>{setStarted(true); update((d:StoreData)=>({...d,examDraft:{startedAt:new Date().toISOString(),mins}}));}}>開始（途中状態を保存）</button></div>
 : done? <div className="card"><h2>結果</h2><p>一括採点は演習記録に基づきます。総解答 {store.records.length}件。誤答は演習画面で復習できます。</p></div>
 : <div className="card"><p>模試進行中（制限時間 {mins}分・途中保存済み）。検証済み問題が0問のため、出題はありません。</p><button onClick={()=>{setDone(true); update((d:StoreData)=>({...d,examDraft:null}));}}>終了して一括採点へ</button></div>}
 </main>;
}
function Stats({store}:{store:StoreData}){
 const all=[...QUESTIONS,...SAMPLE_QUESTIONS]; const st=computeStats(store.records, all);
 const cov=computeCoverage({presentImages:manifest.totalPresent, expectedImages:manifest.totalPresent+manifest.totalMissing, units:KNOWLEDGE_UNITS, totalSections:ALL_SECTIONS.length, questions:QUESTIONS, records:store.records});
 const pct=(v:number|null)=> v==null? "未測定（算出不能）" : Math.round(v*100)+"%";
 const rows=(m:Map<string,{total:number;correct:number}>)=>[...m.entries()].map(([k,v])=><tr key={k}><td>{k}</td><td>{v.total}</td><td>{v.total?Math.round(v.correct/v.total*100):0}%</td></tr>);
 return <main><h1>学習分析・可視化</h1><section className="card"><p>総解答数 {st.total} ／ 正答率 {pct(st.accuracy)} ／ 学習日数 {new Set(store.records.map(r=>r.answeredAt.slice(0,10))).size}日</p>
 <h2>網羅率（5指標を分離表示）</h2><table><tbody>
 <tr><td>1. 教科書の取り込み率</td><td>{pct(cov.importedRatio)}（139/140画像）</td></tr>
 <tr><td>2. 知識単位の抽出率</td><td>{pct(cov.unitExtractionRatio)}（全文転記後に母数が確定）</td></tr>
 <tr><td>参考: 取り込み済み知識単位（未検証）</td><td>{IMPORTED_KNOWLEDGE_UNITS.length}件（うち一問一答ドラフト付き {KNOWLEDGE_IMPORT_META.draftQaTotal}件）／ 検証済み {KNOWLEDGE_UNITS.length}件</td></tr>
 <tr><td>3. 問題化率</td><td>{pct(cov.questionizedRatio)}</td></tr>
 <tr><td>4. 学習済み率</td><td>{pct(cov.studiedRatio)}</td></tr>
 <tr><td>5. 習得済みと推定される割合</td><td>{pct(cov.masteredRatio)}（直近2回連続正解を推定基準とする・実測ではない）</td></tr></tbody></table>
 <p className="muted">合格可能性などの根拠のない予測は表示しません。</p></section>
 <section className="card"><h2>章別</h2><table><tbody>{rows(st.byChapter)}</tbody></table><h2>形式別</h2><table><tbody>{rows(st.byFormat)}</tbody></table><h2>難易度別</h2><table><tbody>{rows(st.byDifficulty)}</tbody></table>
 <h2>復習予定</h2><p>{Object.values(store.srs).filter(s=>isDue(s)).length}件が期限到来</p><h2>苦手分野</h2><p>{[...st.byChapter.entries()].filter(([,v])=>v.total>0 && v.correct/v.total<0.6).map(([k])=>k).join(", ")||"データ不足のため未判定"}</p></section></main>;
}
function SearchPage(){
 const [q,setQ]=useState(""); const secs=ALL_SECTIONS.filter(s=>!q||s.title.includes(q)); const qs=[...QUESTIONS,...SAMPLE_QUESTIONS].filter(x=>!q||x.prompt.includes(q));
 return <main><h1>横断検索</h1><input aria-label="キーワード" placeholder="キーワード（教材・問題・用語）" value={q} onChange={e=>setQ(e.target.value)}/>
 <section className="card"><h2>教材（節） {secs.length}件</h2><ul>{secs.slice(0,30).map(s=><li key={s.id}>{s.title}（p.{s.bookPage}・{s.transcriptionStatus}）</li>)}</ul></section>
 <section className="card"><h2>問題 {qs.length}件</h2><ul>{qs.map(x=><li key={x.id}>[{FORMAT_LABELS[x.format]}/{x.status}] {x.prompt.slice(0,80)}</li>)}</ul><p className="muted">章・節・ページ・形式・難易度・検証状態などの複合条件はデータ登録後に同じ検索基盤で絞り込めます。</p></section></main>;
}
function QaPage(){
 const all=[...QUESTIONS,...SAMPLE_QUESTIONS];
 const issues=all.flatMap(q=>validateQuestion(q, KNOWLEDGE_UNITS));
 const dup=findDuplicateCandidates(all);
 const exportJson=()=>{ const blob=new Blob([JSON.stringify({proposals:[],issues,dup},null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="qa-proposals.json"; a.click(); };
 return <main><h1>品質管理（管理・監査）</h1><section className="card">
 <p>未検証/サンプル問題: {all.filter(q=>q.status!=="verified").length}件 ／ 出典不明（正式なのに出典なし）: {issues.filter(i=>i.code==="no-source").length}件 ／ 重複候補: {dup.length}組 ／ 未出題の知識単位: {KNOWLEDGE_UNITS.filter(u=>!u.questionIds.length).length + IMPORTED_KNOWLEDGE_UNITS.length}件 ／ 教材未読取: {manifest.entries.filter((e:any)=>e.extractionStatus==="未処理").length}件 ／ 欠落: {manifest.entries.filter((e:any)=>e.extractionStatus==="欠落").length}件</p>
 <p>取り込み済み知識単位: {IMPORTED_KNOWLEDGE_UNITS.length}件（全件 unverified・出典ページ付き・出典: {KNOWLEDGE_IMPORT_META.origin}）／ 検証済み知識単位: {KNOWLEDGE_UNITS.length}件 ／ 一問一答ドラフト付き: {KNOWLEDGE_IMPORT_META.draftQaTotal}件（正式問題としては未登録）</p>
 <ul>{issues.map((i,idx)=><li key={idx}>[{i.severity}/{i.code}] {i.targetId}: {i.message}</li>)}</ul>
 <button onClick={exportJson}>修正案JSONを出力</button><p className="muted">GitHubへ直接書き込む機構は実装しません。修正案は構造化データとして出力し、開発側でリポジトリに反映します。</p></section></main>;
}
export default function App(){
 const {store,update}=useAppStore();
 return <div data-dark={store.reader.dark}>
 <header className="top"><nav className="main" aria-label="メインナビゲーション"><Link to="/">ホーム</Link><Link to="/practice">演習</Link><Link to="/reader">電子書籍</Link><Link to="/cards">単語帳</Link><Link to="/exam">模擬試験</Link><Link to="/stats">分析</Link><Link to="/search">検索</Link><Link to="/qa">品質管理</Link></nav></header>
 <Routes><Route path="/" element={<Home store={store} update={update}/>}/><Route path="/practice" element={<Practice store={store} update={update}/>}/><Route path="/reader" element={<Reader store={store} update={update}/>}/><Route path="/cards" element={<Cards/>}/><Route path="/exam" element={<Exam store={store} update={update}/>}/><Route path="/stats" element={<Stats store={store}/>}/><Route path="/search" element={<SearchPage/>}/><Route path="/qa" element={<QaPage/>}/></Routes>
 <footer style={{padding:"1rem"}} className="muted">学習履歴はブラウザ内（localStorage）にのみ保存されます。ブラウザデータ削除・機種変更で消える可能性があります。同期・バックアップ機能はありません（要件）。</footer></div>;
}
