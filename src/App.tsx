import { Suspense, lazy, useState } from "react";
import { Routes, Route, Link } from "react-router";
import { loadStore, saveStore, type StoreData } from "./domain/store";

/**
 * アプリシェル（バンドル分割バッチE1、docs/DECISIONS.md #23）。
 * 8画面は src/screens/ 配下に分割し、React.lazy でルート単位に遅延読み込みする。
 * 初期表示（ホーム）は軽量サマリ（src/data/summary.ts）の件数だけに依存し、
 * 問題・知識・転記の全データは各画面のチャンクとデータ種別チャンク
 * （vite.config.ts の manualChunks）側に分離される。全チャンクは PWA の
 * precache に含まれるため、オフラインでも全画面が従来どおり開ける。
 */
const Home = lazy(() => import("./screens/Home"));
const Practice = lazy(() => import("./screens/Practice"));
const Reader = lazy(() => import("./screens/Reader"));
const Cards = lazy(() => import("./screens/Cards"));
const Exam = lazy(() => import("./screens/Exam"));
const Stats = lazy(() => import("./screens/Stats"));
const SearchPage = lazy(() => import("./screens/SearchPage"));
const QaPage = lazy(() => import("./screens/QaPage"));

function useAppStore(){ const [store,setStore]=useState<StoreData>(()=>loadStore()); const update=(fn:(d:StoreData)=>StoreData)=>{ setStore(prev=>{ const n=fn(structuredClone(prev)); saveStore(n); return n; }); }; return {store,update}; }

function ScreenLoading(){
 return <main><p className="card">読み込み中…</p></main>;
}

export default function App(){
 const {store,update}=useAppStore();
 return <div data-dark={store.reader.dark}>
 <header className="top"><nav className="main" aria-label="メインナビゲーション"><Link to="/">ホーム</Link><Link to="/practice">演習</Link><Link to="/reader">電子書籍</Link><Link to="/cards">単語帳</Link><Link to="/exam">模擬試験</Link><Link to="/stats">分析</Link><Link to="/search">検索</Link><Link to="/qa">品質管理</Link></nav></header>
 <Suspense fallback={<ScreenLoading/>}>
 <Routes><Route path="/" element={<Home store={store} update={update}/>}/><Route path="/practice" element={<Practice store={store} update={update}/>}/><Route path="/reader" element={<Reader store={store} update={update}/>}/><Route path="/cards" element={<Cards/>}/><Route path="/exam" element={<Exam store={store} update={update}/>}/><Route path="/stats" element={<Stats store={store}/>}/><Route path="/search" element={<SearchPage/>}/><Route path="/qa" element={<QaPage/>}/></Routes>
 </Suspense>
 <footer style={{padding:"1rem"}} className="muted">学習履歴はブラウザ内（localStorage）にのみ保存されます。ブラウザデータ削除・機種変更で消える可能性があります。同期・バックアップ機能はありません（要件）。</footer></div>;
}
