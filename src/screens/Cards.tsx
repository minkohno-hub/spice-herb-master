// 画面コンポーネント（バンドル分割バッチE1で src/App.tsx から分割。docs/DECISIONS.md #23）
// バッチC1で自己評価UIを追加（docs/DECISIONS.md #32）: 裏面表示後に3段階の自己評価を記録し、
// 演習と共通の SRS（store.srs、キーはカードID）に反映する。解答記録（records）には追加しない。
// 修正バッチFIX1（DECISIONS #34）: 種別フィルタ・章フィルタ・シャッフル有無を追加し、
// 既定では全種別をシャッフルして開始する（毎回同じ先頭カードから始まらない）。
// 自己評価→SRS の仕様は全種別で従来どおり維持する。
// UX10（DECISIONS #46）: 自己評価と「次のカード」のボタンをカードの真下へ移し、
// スクロールなしで操作できるようにした（状態表示はボタンの下へ）。
import { useMemo, useState } from "react";
import { CARDS, SAMPLE_CARDS } from "../data/questions";
import { CHAPTERS } from "../data/structure";
import type { StoreData } from "../domain/store";
import { applyCardReview, isDue, type CardSelfEval } from "../domain/srs";
import { CARD_KIND_LABELS, cardKindOf, countCardsByKind, filterCards } from "../domain/cards";
import { seededShuffle } from "../domain/shuffle";
import type { FlashcardKind } from "../domain/types";

const EVAL_OPTIONS: { key: CardSelfEval; label: string }[] = [
 { key: "known", label: "分かった" },
 { key: "unsure", label: "あいまい" },
 { key: "unknown", label: "分からない" },
];
const KIND_ORDER: FlashcardKind[] = ["qa", "profile", "term", "reverse"];

export default function Cards({store, update}:{store:StoreData; update:any}){
 const all=useMemo(()=>[...CARDS, ...SAMPLE_CARDS], []);
 const [kind,setKind]=useState<FlashcardKind|null>(null);
 const [chapterId,setChapterId]=useState<string|null>(null);
 const [shuffleOn,setShuffleOn]=useState(true);
 const [seed,setSeed]=useState(()=>String(Date.now()));
 const [i,setI]=useState(0); const [flip,setFlip]=useState(false);
 const filtered=useMemo(()=>filterCards(all, { kind, chapterId }), [all, kind, chapterId]);
 const ordered=useMemo(()=> shuffleOn? seededShuffle(filtered, `cards|${kind ?? "all"}|${chapterId ?? "all"}|${seed}`) : filtered, [filtered, shuffleOn, kind, chapterId, seed]);
 const kindCounts=useMemo(()=>countCardsByKind(all), [all]);
 const resetPosition=()=>{ setI(0); setFlip(false); };
 const c=ordered[i % Math.max(1,ordered.length)];
 const st=c? store.srs[c.id] : undefined;
 const evaluated=all.filter(x=>store.srs[x.id]).length;
 const evaluate=(ev:CardSelfEval)=>{ if(!c) return; update((d:StoreData)=>{ d.srs[c.id]=applyCardReview(d.srs[c.id], c.id, ev); return d; }); setFlip(false); setI(i+1); };
 return <main><h1>フラッシュカード・単語帳</h1>
 {!c ? <p className="card">対象カードがありません。種別・章の条件を変えてください。</p> :
 <><div className="card flash" role="button" aria-label="カード反転" tabIndex={0} onClick={()=>setFlip(!flip)} onKeyDown={e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); setFlip(!flip); } }}>{flip? c.back : c.front}</div>
 {/* UX10: 操作ボタンはカードの真下に置く（スクロールなしで届くように） */}
 {flip
  ? <p>自己評価: {EVAL_OPTIONS.map(o=><button key={o.key} onClick={()=>evaluate(o.key)}>{o.label}</button>)}{" "}<button type="button" className="ghost" onClick={()=>{setFlip(false); setI(i+1);}}>次のカード</button></p>
  : <p><button type="button" onClick={()=>setFlip(true)}>裏面を表示</button>{" "}<button type="button" className="ghost" onClick={()=>{setFlip(false); setI(i+1);}}>次のカード</button> <span className="muted">裏面を表示すると自己評価を記録できます。</span></p>}
 <p className="muted">{c.status==="sample"?"サンプルカード":"正式カード"} ／ 種別: {CARD_KIND_LABELS[cardKindOf(c)]} ／ 章: {c.chapterId} ／ 節: {c.sectionId} ／ 対象カード {ordered.length} 件（全 {all.length} 件）</p>
 <p className="muted">{st? <>このカードの状態: 評価済み（復習 {st.repetitions} 回 ・ 次回 {st.dueAt.slice(0,10)}{isDue(st)?" ・ 期限到来":""}）</> : "このカードの状態: 未評価"} ／ 評価済み {evaluated} / 全 {all.length} 件</p></>}
 <p><label>種別<select aria-label="種別" value={kind ?? ""} onChange={e=>{ setKind(e.target.value===""? null : e.target.value as FlashcardKind); resetPosition(); }}><option value="">すべて（{all.length}件）</option>{KIND_ORDER.map(k=><option key={k} value={k}>{CARD_KIND_LABELS[k]}（{kindCounts[k]}件）</option>)}</select></label>{" "}
 <label>章<select aria-label="章" value={chapterId ?? ""} onChange={e=>{ setChapterId(e.target.value===""? null : e.target.value); resetPosition(); }}><option value="">すべて</option>{CHAPTERS.map(ch=><option key={ch.id} value={ch.id}>{ch.label}</option>)}</select></label>{" "}
 <label>並び<select aria-label="並び" value={shuffleOn? "shuffle" : "sequence"} onChange={e=>{ setShuffleOn(e.target.value==="shuffle"); resetPosition(); }}><option value="shuffle">シャッフル</option><option value="sequence">登録順</option></select></label>{" "}
 {shuffleOn && <button className="ghost" onClick={()=>{ setSeed(String(Date.now())); resetPosition(); }}>シャッフルし直す</button>}</p>
 <p className="muted">カードは一問一答・プロフィール・用語・逆引きの4種別があります。自己評価はSRS（間隔反復）に反映され、学習分析・ホームの期限到来件数にも数えられます（解答記録には追加されません）。</p></main>;
}
