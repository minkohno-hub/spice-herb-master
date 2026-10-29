// 画面コンポーネント（バンドル分割バッチE1で src/App.tsx から分割。docs/DECISIONS.md #23）
import { QUESTIONS, SAMPLE_QUESTIONS, KNOWLEDGE_UNITS } from "../data/questions";
import { IMPORTED_KNOWLEDGE_UNITS, KNOWLEDGE_IMPORT_META } from "../data/knowledge";
import manifest from "../data/source-manifest.json";
import { validateQuestion, findDuplicateCandidates } from "../domain/validate";

export default function QaPage(){
 const all=[...QUESTIONS,...SAMPLE_QUESTIONS];
 const issues=all.flatMap(q=>validateQuestion(q, [...KNOWLEDGE_UNITS, ...IMPORTED_KNOWLEDGE_UNITS]));
 const dup=findDuplicateCandidates(all);
 const exportJson=()=>{ const blob=new Blob([JSON.stringify({proposals:[],issues,dup},null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="qa-proposals.json"; a.click(); };
 return <main><h1>品質管理（管理・監査）</h1><section className="card">
 <p>未検証/サンプル問題: {all.filter(q=>q.status!=="verified").length}件 ／ 出典不明（正式なのに出典なし）: {issues.filter(i=>i.code==="no-source").length}件 ／ 重複候補: {dup.length}組 ／ 未出題の知識単位: {KNOWLEDGE_UNITS.filter(u=>!u.questionIds.length).length + IMPORTED_KNOWLEDGE_UNITS.filter(u=>!QUESTIONS.some(q=>q.knowledgeUnitIds.includes(u.id))).length}件 ／ 教材未読取: {manifest.entries.filter((e:any)=>e.extractionStatus==="未処理").length}件 ／ 欠落: {manifest.entries.filter((e:any)=>e.extractionStatus==="欠落").length}件</p>
 <p>取り込み済み知識単位: {IMPORTED_KNOWLEDGE_UNITS.length}件（原文照合済み {IMPORTED_KNOWLEDGE_UNITS.filter(u=>u.status==="verified").length}件・未検証 {IMPORTED_KNOWLEDGE_UNITS.filter(u=>u.status==="unverified").length}件・出典ページ付き・出典: {KNOWLEDGE_IMPORT_META.origin}）／ 検証済み知識単位: {KNOWLEDGE_UNITS.length}件 ／ 一問一答ドラフト付き: {KNOWLEDGE_IMPORT_META.draftQaTotal}件（正式問題・正式カードの生成元。生成と検証は scripts/generate-questions.mjs）</p>
 <ul>{issues.map((i,idx)=><li key={idx}>[{i.severity}/{i.code}] {i.targetId}: {i.message}</li>)}</ul>
 <button onClick={exportJson}>修正案JSONを出力</button><p className="muted">GitHubへ直接書き込む機構は実装しません。修正案は構造化データとして出力し、開発側でリポジトリに反映します。</p></section></main>;
}
