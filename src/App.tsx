import { Component, Suspense, lazy, useState, type ReactNode } from "react";
import { Routes, Route, Link } from "react-router";
import { loadStore, saveStore, resetStoreData, type StoreData } from "./domain/store";

/**
 * アプリシェル（バンドル分割バッチE1、docs/DECISIONS.md #23）。
 * 8画面は src/screens/ 配下に分割し、React.lazy でルート単位に遅延読み込みする。
 * 初期表示（ホーム）は軽量サマリ（src/data/summary.ts）の件数だけに依存し、
 * 問題・知識・転記の全データは各画面のチャンクとデータ種別チャンク
 * （vite.config.ts の manualChunks）側に分離される。PWA の precache は
 * シェル（HTML/CSS/画面・基盤チャンク）に限り、データチャンクは初回利用時に
 * runtime caching（CacheFirst）で保存される（監査E-06/E-07是正、AD-3）。
 * そのためオフラインでも、一度開いた画面は従来どおり開ける。
 */
const Home = lazy(() => import("./screens/Home"));
const Practice = lazy(() => import("./screens/Practice"));
const Reader = lazy(() => import("./screens/Reader"));
const Cards = lazy(() => import("./screens/Cards"));
const Exam = lazy(() => import("./screens/Exam"));
const Stats = lazy(() => import("./screens/Stats"));
const SearchPage = lazy(() => import("./screens/SearchPage"));
const QaPage = lazy(() => import("./screens/QaPage"));

function useAppStore(){ const [store,setStore]=useState<StoreData>(()=>loadStore()); const [saveFailed,setSaveFailed]=useState(false); const update=(fn:(d:StoreData)=>StoreData)=>{ setStore(prev=>{ const n=fn(structuredClone(prev)); setSaveFailed(!saveStore(n)); return n; }); }; return {store,update,saveFailed}; }

/** 監査C-12是正: 描画例外で白画面のまま復旧不能にならないよう、リセット導線付きの受け皿を置く。 */
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }>{
 state = { failed: false };
 static getDerivedStateFromError(){ return { failed: true }; }
 render(){
  if (this.state.failed) return <main><div className="card"><h1>表示できませんでした</h1><p>保存データの形式が想定と異なる可能性があります。学習記録を消去して初期状態で起動できます（記録は失われます）。</p><p><button onClick={()=>{ resetStoreData(); location.reload(); }}>データをリセットして再起動</button></p></div></main>;
  return this.props.children;
 }
}

function ScreenLoading(){
 return <main><p className="card">読み込み中…</p></main>;
}

export default function App(){
 const {store,update,saveFailed}=useAppStore();
 return <div data-dark={store.reader.dark}>
 <header className="top" style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:".5rem"}}><nav className="main" aria-label="メインナビゲーション"><Link to="/">ホーム</Link><Link to="/practice">演習</Link><Link to="/reader">電子書籍</Link><Link to="/cards">単語帳</Link><Link to="/exam">模擬試験</Link><Link to="/stats">分析</Link><Link to="/search">検索</Link><Link to="/qa">品質管理</Link></nav><button type="button" className="ghost" aria-pressed={store.reader.dark} onClick={()=>update((d:StoreData)=>{d.reader.dark=!d.reader.dark; return d;})}>ダークモード切替</button></header>
 {saveFailed && <p role="alert" className="card">学習記録の保存に失敗しました（ブラウザの保存容量が不足している可能性があります）。このまま続けると記録が残らない場合があります。</p>}
 <ErrorBoundary>
 <Suspense fallback={<ScreenLoading/>}>
 <Routes><Route path="/" element={<Home store={store} update={update}/>}/><Route path="/practice" element={<Practice store={store} update={update}/>}/><Route path="/reader" element={<Reader store={store} update={update}/>}/><Route path="/cards" element={<Cards store={store} update={update}/>}/><Route path="/exam" element={<Exam store={store} update={update}/>}/><Route path="/stats" element={<Stats store={store}/>}/><Route path="/search" element={<SearchPage update={update}/>}/><Route path="/qa" element={<QaPage/>}/></Routes>
 </Suspense>
 </ErrorBoundary>
 <footer style={{padding:"1rem",paddingBottom:"calc(1rem + env(safe-area-inset-bottom))"}} className="muted">学習履歴はブラウザ内（localStorage）にのみ保存されます。ブラウザデータ削除・機種変更で消える可能性があります。同期・バックアップ機能はありません（要件）。</footer></div>;
}
