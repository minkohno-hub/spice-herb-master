// 画面コンポーネント（バンドル分割バッチE1で src/App.tsx から分割。docs/DECISIONS.md #23）
import { Link } from "react-router";
import { APP_DATA_SUMMARY } from "../data/summary";
import { ALL_SECTIONS } from "../data/structure";
const SECTION_TITLE = new Map(ALL_SECTIONS.map((s) => [s.id, s.title]));
import type { StoreData } from "../domain/store";
import { computeStats } from "../domain/stats";
import { isDue } from "../domain/srs";
import { dateKeyOfIso, todayKey } from "../domain/dates";

export default function Home({store,update}:{store:StoreData;update:any}){
 const due = Object.values(store.srs).filter(s=>isDue(s)).length;
 // ホームで使うのは total / accuracy のみで、どちらも records だけで決まる（domain/stats.ts）。
 // 章別等の内訳は問題データが必要だがホームでは表示しないため、空配列を渡して全データへの依存を断つ（E1）。
 const stats = computeStats(store.records, []);
 const today = todayKey(); const todayCount = store.records.filter(r=>dateKeyOfIso(r.answeredAt)===today).length;
 return <main><h1>スパイス＆ハーブ検定1級 学習アプリ</h1>
 <p className="badge">正式問題は、原文照合済み（verified）の知識単位から生成し、出典・正答の検証を通ったものだけを登録しています。本文の全文転記は {APP_DATA_SUMMARY.transcribedPages}ページまで転記済みです（未転記の節はリーダーで明示します）。</p>
 <section className="grid" aria-label="主要機能">
  <div className="card"><h2>とりあえず5問</h2><p>設定なしで、正式問題からランダムに5問だけ出題します</p><Link className="btn" to="/practice" state={{ focus: "all", count: 5 }}>5問始める</Link></div>
  <div className="card"><h2>前回の続き</h2><p>{store.reader.sectionId? `読書位置: ${SECTION_TITLE.get(store.reader.sectionId) ?? store.reader.sectionId}` : "まだ読書位置がありません"}</p><Link className="btn" to="/reader">電子書籍を開く</Link></div>
  <div className="card"><h2>今日の復習</h2><p>復習予定: {due}件 ／ 今日の解答: {todayCount}件</p><Link className="btn" to="/practice" state={{ focus: "due" }}>復習を始める</Link></div>
  <div className="card"><h2>ランダム演習</h2><p>正式問題 {APP_DATA_SUMMARY.formalQuestions}問</p><Link className="btn" to="/practice">演習設定へ</Link></div>
  <div className="card"><h2>苦手克服</h2><p>誤答記録: {store.records.filter(r=>r.correct===false).length}件</p><Link className="btn" to="/practice" state={{ focus: "wrong" }}>誤答を復習する</Link> <Link to="/stats">学習分析へ</Link></div>
  <div className="card"><h2>模擬試験</h2><p>練習用（公式形式の再現とは断定しません）</p><Link className="btn" to="/exam">模試へ</Link></div>
  <div className="card"><h2>単語帳</h2><p>正式カード {APP_DATA_SUMMARY.formalCards}件／サンプル {APP_DATA_SUMMARY.sampleCards}件</p><Link className="btn" to="/cards">カードへ</Link></div>
  <div className="card"><h2>4訂版の改訂ポイント</h2><p>旧版から変わった点（1級対象の追加・削除、原産地・別名・語源などの改訂）を、財団の公式資料から抜粋してまとめました。2027年以降の検定は4訂版からのみ出題されます。</p><Link className="btn" to="/revision">改訂ポイントを見る</Link></div>
  <div className="card"><h2>全種類を覚える（暗記モード）</h2><p>スパイス＆ハーブ全80種のプロフィール（科名・原産地・利用部位・別名・対象級）を、ひたすら回して覚えるモードです。一周したら、覚えていないものを中心に次の周が自動で始まります。</p><Link className="btn" to="/memorize">暗記を始める</Link></div>
  <div className="card"><h2>学習進捗</h2><p>総解答 {stats.total} ／ 正答率 {stats.accuracy==null?"—":Math.round(stats.accuracy*100)+"%"}</p><Link className="btn" to="/stats">進捗を見る</Link></div>
  <div className="card"><h2>今日の目標</h2><label>1日の目標（問）<input type="number" min={1} value={store.goalPerDay} onChange={e=>update((d:StoreData)=>({...d,goalPerDay:Number(e.target.value)||10}))}/></label><p>達成: {todayCount}/{store.goalPerDay}</p></div>
 </section>
 <section className="card"><h2>教材の状態（正直な表示）</h2><p>取り込み済み画像: {APP_DATA_SUMMARY.presentImages}件 ／ 欠落: {APP_DATA_SUMMARY.missingImages}件（IMG_9647.PNG）／ 全文転記: {APP_DATA_SUMMARY.transcribedPages}ページ転記済み（原本画像 {APP_DATA_SUMMARY.presentImages}件中。それ以外は未実施） ／ 取り込み済み知識単位: {APP_DATA_SUMMARY.importedKnowledgeUnits}件（原文照合済み {APP_DATA_SUMMARY.verifiedImportedKnowledgeUnits}件・未検証 {APP_DATA_SUMMARY.unverifiedImportedKnowledgeUnits}件・出典: {APP_DATA_SUMMARY.knowledgeImportOrigin}）／ 検証済み知識単位: {APP_DATA_SUMMARY.verifiedKnowledgeUnits}件 ／ 正式問題: {APP_DATA_SUMMARY.formalQuestions}問</p><p className="muted">「全文収録済み」ではありません。収録範囲は本文テキスト・表データと、各ページの原画（スキャンを圧縮した画像）です。原画は電子書籍リーダーの各ページで表示できます。取り込み済み知識単位は、原本画像との照合を終えたものだけを「原文照合済み」として区別表示します。詳細は docs/SOURCE_COVERAGE.md を参照。</p></section>
 </main>;
}
