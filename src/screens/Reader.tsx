// 画面コンポーネント（バンドル分割バッチE1で src/App.tsx から分割。docs/DECISIONS.md #23）
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { CHAPTERS, ALL_SECTIONS } from "../data/structure";
import { QUESTIONS } from "../data/questions";
import { IMPORTED_KNOWLEDGE_UNITS } from "../data/knowledge";
import { transcriptPagesForSection, type TranscriptBlock } from "../data/transcripts";
import type { StoreData } from "../domain/store";

function TranscriptBlockView({b}:{b:TranscriptBlock}){
 if(b.type==="heading") return b.level && b.level>=3 ? <h4>{b.text}</h4> : <h3>{b.text}</h3>;
 if(b.type==="caption") return <p className="muted">［写真］{b.text}</p>;
 if(b.type==="note") return <p className="muted">{b.text}</p>;
 if(b.type==="column") return <aside className="card">{b.title?<h4>{b.title}</h4>:null}<p>{b.text}</p></aside>;
 if(b.type==="table") return <figure>{b.caption?<figcaption>{b.caption}</figcaption>:null}<table><tbody>{(b.rows??[]).map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table></figure>;
 return <p>{b.text}</p>;
}
export default function Reader({store,update}:{store:StoreData;update:any}){
 const [sel,setSel]=useState(store.reader.sectionId || ALL_SECTIONS[0]!.id); const [query,setQuery]=useState("");
 // 監査C-14是正: 問題画面・検索画面から reader.sectionId 経由で遷移してきた場合に追随する。
 useEffect(()=>{ if (store.reader.sectionId && store.reader.sectionId!==sel) setSel(store.reader.sectionId); }, [store.reader.sectionId]);
 // ユーザー要望対応（DECISIONS #35）: スマホでは目次が本文の上に積まれるため、
 // 開いた直後や目次で節を選んだ直後は、スクロールせずに本文（ページ）へ
 // すぐ飛べるよう、本文の先頭へ自動でスクロールする。固定ヘッダーに本文が
 // 隠れないよう、本文側に scroll-margin-top（styles.css の #reader-page）を置く。
 const pageRef = useRef<HTMLElement | null>(null);
 useEffect(()=>{ pageRef.current?.scrollIntoView?.({ block: "start" }); }, [sel ]);
 const sec = ALL_SECTIONS.find(s=>s.id===sel) ?? ALL_SECTIONS[0]!;
 const secPages = transcriptPagesForSection(sec.id);
 const filtered = ALL_SECTIONS.filter(s=>!query || s.title.includes(query));
 // E2E導入バッチE2で発見した不具合の最小修正: ALL_SECTIONS は CHAPTERS の節を
 // スプレッドで複製した別オブジェクトのため、参照一致（includes）では目次の節が
 // 1件も一致せず、目次ボタンが一切描画されなかった。節IDでの一致に変更する。
 const filteredIds = new Set(filtered.map(s=>s.id));
 return <main data-dark={store.reader.dark}><h1>電子書籍リーダー</h1>
 <div className="split"><section className="card"><h2>目次（目次ページで照合済み）</h2><input aria-label="節検索" placeholder="語句検索" value={query} onChange={e=>setQuery(e.target.value)}/>
 {CHAPTERS.map(c=><div key={c.id}><h3>{c.label} {c.title}</h3><ul>{c.sections.filter(s=>filteredIds.has(s.id)).map(s=><li key={s.id}><button className="ghost" onClick={()=>{setSel(s.id); update((d:StoreData)=>{d.reader.sectionId=s.id; return d;});}}>{s.title}（p.{s.bookPage}）</button></li>)}</ul></div>)}
 </section>
 <section className="card" id="reader-page" ref={pageRef} style={{fontSize: store.reader.fontSize}}><h2>{sec.title}</h2><p className="muted">書籍 p.{sec.bookPage} ／ 転記状態: {sec.transcriptionStatus}</p>
 {secPages.length===0 ? <p>この節の本文はまだ転記されていません。原本画像を目視読解して転記したテキストのみがここに掲載されます。推測で本文を補うことはしません。</p>
 : secPages.map(p=><div key={p.bookPage}><p className="muted">― 本書 p.{p.bookPage}（出典画像 {p.imageId}.PNG）―</p>{p.blocks.map((b,i)=><TranscriptBlockView key={i} b={b}/>)}{p.unclear.length>0 && <p className="muted">不明瞭箇所: {p.unclear.map(u=>`${u.location}: ${u.note}`).join(" ／ ")}</p>}</div>)}
 <p className="muted">表示設定: ダークモードは全画面共通（ヘッダーからも切り替えできます）。フォントサイズはこのリーダーの本文だけに適用されます。</p>
 <label>フォントサイズ<input type="range" min={14} max={22} value={store.reader.fontSize} onChange={e=>update((d:StoreData)=>{d.reader.fontSize=Number(e.target.value); return d;})}/></label>
 <p><button className="ghost" onClick={()=>update((d:StoreData)=>{d.reader.dark=!d.reader.dark; return d;})}>ダークモード切替</button> <button className="ghost" onClick={()=>update((d:StoreData)=>{ if(!d.reader.bookmarks.includes(sec.id)) d.reader.bookmarks.push(sec.id); return d;})}>しおり</button></p>
 <label>ハイライト（この節の強調メモ）<input value={store.reader.highlights[sec.id]??""} onChange={e=>update((d:StoreData)=>{d.reader.highlights[sec.id]=e.target.value; return d;})}/></label>
 <label>簡易メモ（原文とは区別して保存）<textarea value={store.reader.notes[sec.id]??""} onChange={e=>update((d:StoreData)=>{d.reader.notes[sec.id]=e.target.value; return d;})}/></label>
 <p>関連問題: {QUESTIONS.filter(q=>q.sectionId===sec.id).length}問（正式） <Link className="btn" to="/practice" state={{ sectionId: sec.id }}>この節の問題を演習する</Link> ／ このページの取り込み済み知識単位: {IMPORTED_KNOWLEDGE_UNITS.filter(u=>u.source.page===sec.bookPage).length}件（うち原文照合済み {IMPORTED_KNOWLEDGE_UNITS.filter(u=>u.source.page===sec.bookPage && u.status==="verified").length}件） ／ しおり: {store.reader.bookmarks.join(", ")||"なし"}</p>
 <p className="muted">PCではこの分割表示、スマホでは縦積み表示になります。模擬試験中は本文・正解を表示しない設計です（模試画面参照）。</p>
 </section></div></main>;
}
