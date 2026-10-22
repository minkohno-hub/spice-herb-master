import type { ReactNode } from 'react';
import { useApp } from '../lib/app';

export function Top({ title, back = '/', right }: { title: string; back?: string | false; right?: ReactNode }) {
  const { go } = useApp();
  return (
    <header className="top">
      {back !== false && (
        <button className="back" onClick={() => go(back)} aria-label="戻る">
          ‹ 戻る
        </button>
      )}
      <h1>{title}</h1>
      {right}
    </header>
  );
}

export function Loading({ label = '読み込み中…' }: { label?: string }) {
  return (
    <p className="muted" role="status" aria-live="polite">
      {label}
    </p>
  );
}

export function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="feedback ng" role="alert">
      <strong>読み込みに失敗しました</strong>
      <p>{message}。通信状態を確認してください。</p>
      {retry && (
        <button className="btn" onClick={retry} style={{ marginTop: 8 }}>
          再試行
        </button>
      )}
    </div>
  );
}

export function Progress({ value }: { value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PageRef({ p }: { p: number }) {
  return <span className="chip">本書 p.{p}</span>;
}

const icons: Record<string, ReactNode> = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  study: <path d="M4 5h16v12H4zM8 21h8M12 17v4" />,
  cards: <path d="M5 4h11l3 3v13H5zM9 10h6M9 14h6" />,
  book: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 5v16" />,
  stats: <path d="M5 20V10M12 20V4M19 20v-7" />,
};

export function TabBar() {
  const { route, go } = useApp();
  const tabs = [
    ['/', 'ホーム', 'home'],
    ['/study', '演習', 'study'],
    ['/cards', '単語帳', 'cards'],
    ['/book', '教科書', 'book'],
    ['/stats', '成績', 'stats'],
  ] as const;
  return (
    <nav className="tabbar" aria-label="メインメニュー">
      {tabs.map(([to, label, icon]) => {
        const cur = to === '/' ? route.path === '/' : route.path.startsWith(to);
        return (
          <button key={to} onClick={() => go(to)} aria-current={cur ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
              {icons[icon]}
            </svg>
            {label}
          </button>
        );
      })}
    </nav>
  );
}
