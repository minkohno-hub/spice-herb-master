import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { load, save, type State } from './store';
import { loadIndex } from './data';
import type { DataIndex } from './types';

// ハッシュルーティング(GitHub Pages で404を避けるため)
export function parseHash(h: string): { path: string; params: URLSearchParams } {
  const raw = h.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  return { path, params: new URLSearchParams(qs ?? '') };
}

interface Ctx {
  state: State;
  update: (fn: (s: State) => State) => void;
  index?: DataIndex;
  indexError?: string;
  retryIndex: () => void;
  route: { path: string; params: URLSearchParams };
  go: (to: string) => void;
  toast: (msg: string) => void;
  saveOk: boolean;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => load());
  const [saveOk, setSaveOk] = useState(true);
  const [index, setIndex] = useState<DataIndex>();
  const [indexError, setIndexError] = useState<string>();
  const [route, setRoute] = useState(() => parseHash(location.hash));
  const [msg, setMsg] = useState<string>();
  const timer = useRef<number>();

  const retryIndex = useCallback(() => {
    setIndexError(undefined);
    loadIndex().then(setIndex).catch((e: Error) => setIndexError(e.message));
  }, []);
  useEffect(retryIndex, [retryIndex]);

  useEffect(() => {
    const on = () => {
      setRoute(parseHash(location.hash));
      window.scrollTo(0, 0);
    };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);

  useEffect(() => {
    setSaveOk(save(state));
  }, [state]);

  useEffect(() => {
    const { theme, fontScale, reduceMotion } = state.settings;
    const el = document.documentElement;
    if (theme === 'system') el.removeAttribute('data-theme');
    else el.setAttribute('data-theme', theme);
    el.style.setProperty('--scale', String(fontScale));
    el.classList.toggle('reduce-motion', reduceMotion);
  }, [state.settings]);

  const update = useCallback((fn: (s: State) => State) => setState((s) => fn(s)), []);
  const go = useCallback((to: string) => {
    location.hash = to;
  }, []);
  const toast = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(undefined), 2200);
  }, []);

  const value = useMemo(
    () => ({ state, update, index, indexError, retryIndex, route, go, toast, saveOk }),
    [state, update, index, indexError, retryIndex, route, go, toast, saveOk],
  );
  return (
    <AppCtx.Provider value={value}>
      {children}
      {msg && (
        <div className="toast" role="status">
          {msg}
        </div>
      )}
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error('AppProvider がありません');
  return c;
}

/** 非同期データ読み込みの共通フック(読み込み中・エラー・再試行) */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    setError(undefined);
    fn()
      .then((d) => alive && setData(d))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, n]);
  return { data, error, retry: () => setN((x) => x + 1) };
}
