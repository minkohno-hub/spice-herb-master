// 学習履歴・設定はブラウザの localStorage にのみ保存する(クラウド同期なし)。
import { initialCard, review, type CardState } from './srs';

export type Cause = '知識不足' | '用語の混同' | '記憶違い' | '記述不足' | '単純ミス';

export interface Attempt {
  q: string;
  ok: boolean;
  at: number;
  ms: number;
  score?: number; // 記述式の自動判定得点率(推定)
  self?: number; // 記述式の自己評価得点率
  cause?: Cause;
  text?: string; // 記述式の回答(再記述比較用。最新数件のみ保持)
}

export interface Session {
  kind: 'practice' | 'exam';
  title: string;
  ids: string[];
  pos: number;
  answers: Record<string, { ok: boolean; value: unknown; score?: number }>;
  startedAt: number;
  limitMin?: number;
  showRefs: boolean;
  autoNext: boolean;
}

export interface Settings {
  fontScale: number;
  theme: 'system' | 'light' | 'dark';
  dailyGoal: number;
  autoNext: boolean;
  reduceMotion: boolean;
}

export interface Bookmark { p: number; ch: string; at: number }

export interface State {
  v: 1;
  cards: Record<string, CardState>;
  attempts: Attempt[];
  favorites: string[];
  notes: Record<string, string>; // 知識単位 ID → メモ
  highlights: string[]; // 知識単位 ID
  bookmarks: Bookmark[];
  readPos?: { ch: string; p: number };
  session?: Session;
  examHistory: { at: number; title: string; total: number; correct: number; score: number }[];
  settings: Settings;
  days: string[]; // 学習した日(YYYY-MM-DD)
}

const KEY = 'shm-state-v1';
const MAX_ATTEMPTS = 5000;

export function emptyState(): State {
  return {
    v: 1, cards: {}, attempts: [], favorites: [], notes: {}, highlights: [], bookmarks: [], examHistory: [], days: [],
    settings: { fontScale: 1, theme: 'system', dailyGoal: 30, autoNext: false, reduceMotion: false },
  };
}

export function load(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): State {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<State>;
    const base = emptyState();
    return { ...base, ...parsed, settings: { ...base.settings, ...parsed.settings } } as State;
  } catch {
    return emptyState();
  }
}

export function save(s: State, storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage): boolean {
  try {
    storage?.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false; // 容量超過やプライベートモード
  }
}

export function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function recordAttempt(s: State, a: Attempt, grade: 0 | 1 | 2 | 3): State {
  const card = s.cards[a.q] ?? initialCard(a.at);
  const day = dayKey(a.at);
  // 記述回答本文は直近3件だけ残して容量を節約する
  const attempts = [...s.attempts, a];
  if (a.text) {
    const same = attempts.filter((x) => x.q === a.q && x.text);
    for (const old of same.slice(0, -3)) delete old.text;
  }
  return {
    ...s,
    cards: { ...s.cards, [a.q]: review(card, grade, a.at) },
    attempts: attempts.slice(-MAX_ATTEMPTS),
    days: s.days.includes(day) ? s.days : [...s.days, day],
  };
}

export function streak(days: string[], now: number): number {
  const set = new Set(days);
  let n = 0;
  let t = now;
  if (!set.has(dayKey(t))) t -= 86_400_000; // 今日未学習でも昨日まで続いていれば継続中
  while (set.has(dayKey(t))) {
    n++;
    t -= 86_400_000;
  }
  return n;
}
