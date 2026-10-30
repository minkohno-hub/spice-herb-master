// 画面コンポーネント（バンドル分割バッチE1で src/App.tsx から分割。docs/DECISIONS.md #23）
import { QUESTIONS, SAMPLE_QUESTIONS, KNOWLEDGE_UNITS } from "../data/questions";
import { IMPORTED_KNOWLEDGE_UNITS, KNOWLEDGE_IMPORT_META } from "../data/knowledge";
import { ALL_SECTIONS, CHAPTERS } from "../data/structure";
import { FORMAT_LABELS, type QuestionFormat } from "../domain/types";
import manifest from "../data/source-manifest.json";
import type { StoreData } from "../domain/store";
import { computeStats, computeCoverage } from "../domain/stats";
import { isDue } from "../domain/srs";
import { dateKeyOfIso } from "../domain/dates";

export default function Stats({store}:{store:StoreData}){
 const all=[...QUESTIONS,...SAMPLE_QUESTIONS]; const st=computeStats(store.records, all);
 const cov=computeCoverage({presentImages:manifest.totalPresent, expectedImages:manifest.totalPresent+manifest.totalMissing, units:IMPORTED_KNOWLEDGE_UNITS, totalSections:ALL_SECTIONS.length, questions:QUESTIONS, records:store.records});
 const pct=(v:number|null)=> v==null? "未測定（算出不能）" : Math.round(v*100)+"%";
 const chapterLabel=(id:string)=>{ const c=CHAPTERS.find(x=>x.id===id); return c? `${c.label} ${c.title}` : id; };
 const rows=(m:Map<string,{total:number;correct:number}>, label:(k:string)=>string=(k)=>k)=>[...m.entries()].map(([k,v])=><tr key={k}><th scope="row">{label(k)}</th><td>{v.total}</td><td>{v.total?Math.round(v.correct/v.total*100):0}%</td></tr>);
 return <main><h1>学習分析・可視化</h1><section className="card"><p>総解答数 {st.total} ／ 正答率 {pct(st.accuracy)} ／ 学習日数 {new Set(store.records.map(r=>dateKeyOfIso(r.answeredAt))).size}日</p>
 <h2>網羅率（5指標を分離表示）</h2><table><tbody>
 <tr><th scope="row">1. 教科書の取り込み率</th><td>{pct(cov.importedRatio)}（139/140画像）</td></tr>
 <tr><th scope="row">2. 知識単位の抽出率</th><td>{pct(cov.unitExtractionRatio)}（全文転記後に母数が確定）</td></tr>
 <tr><th scope="row">参考: 取り込み済み知識単位</th><td>{IMPORTED_KNOWLEDGE_UNITS.length}件（原文照合済み {IMPORTED_KNOWLEDGE_UNITS.filter(u=>u.status==="verified").length}件・未検証 {IMPORTED_KNOWLEDGE_UNITS.filter(u=>u.status==="unverified").length}件・一問一答ドラフト付き {KNOWLEDGE_IMPORT_META.draftQaTotal}件）／ 転記ベース知識単位 {KNOWLEDGE_UNITS.length}件（転記からの抽出は未実施）</td></tr>
 <tr><th scope="row">3. 問題化率</th><td>{pct(cov.questionizedRatio)}</td></tr>
 <tr><th scope="row">4. 学習済み率</th><td>{pct(cov.studiedRatio)}</td></tr>
 <tr><th scope="row">5. 習得済みと推定される割合</th><td>{pct(cov.masteredRatio)}（直近2回連続正解を推定基準とする・実測ではない）</td></tr></tbody></table>
 <p className="muted">合格可能性などの根拠のない予測は表示しません。</p></section>
 <section className="card"><h2>章別</h2><table><tbody>{rows(st.byChapter, chapterLabel)}</tbody></table><h2>形式別</h2><table><tbody>{rows(st.byFormat, (k)=>FORMAT_LABELS[k as QuestionFormat] ?? k)}</tbody></table><h2>難易度別</h2><table><tbody>{rows(st.byDifficulty, (k)=>`難易度 ${k}`)}</tbody></table>
 <h2>復習予定</h2><p>{Object.values(store.srs).filter(s=>isDue(s)).length}件が期限到来</p><h2>苦手分野</h2><p>{[...st.byChapter.entries()].filter(([,v])=>v.total>=5 && v.correct/v.total<0.6).map(([k])=>chapterLabel(k)).join(", ")||"データ不足のため未判定"}</p></section></main>;
}
