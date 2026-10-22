// 出題対象の絞り込みと並び順の決定(UI から独立させてテスト可能にする)
import type { Question, QType } from './types';
import type { State } from './store';
import { isMastered } from './srs';

export interface Filter {
  chapters?: string[];
  sec?: string;
  types?: QType[];
  grade?: number; // この級の出題範囲に含まれる問題に限定
  diffMin?: number;
  diffMax?: number;
  mode?: 'all' | 'unanswered' | 'wrong' | 'weak' | 'favorite' | 'due' | 'unmastered';
  keyword?: string;
  page?: number;
}

export function stats(state: State, id: string) {
  const at = state.attempts.filter((a) => a.q === id);
  const ok = at.filter((a) => a.ok).length;
  return { n: at.length, ok, rate: at.length ? ok / at.length : undefined, last: at.at(-1) };
}

export function applyFilter(qs: Question[], f: Filter, state: State, now: number): Question[] {
  const kw = f.keyword?.trim();
  return qs.filter((q) => {
    if (f.chapters?.length && !f.chapters.includes(q.ch)) return false;
    if (f.sec && q.sec !== f.sec) return false;
    if (f.types?.length && !f.types.includes(q.type)) return false;
    if (f.grade && !q.grades.includes(f.grade)) return false;
    if (f.diffMin && q.diff < f.diffMin) return false;
    if (f.diffMax && q.diff > f.diffMax) return false;
    if (f.page && q.p !== f.page) return false;
    if (kw && !(q.prompt + q.explain + (q.sec ?? '')).includes(kw)) return false;
    const st = f.mode && f.mode !== 'all' ? stats(state, q.id) : undefined;
    switch (f.mode) {
      case 'unanswered': return st!.n === 0;
      case 'wrong': return st!.last ? !st!.last.ok : false;
      case 'weak': return st!.n > 0 && (st!.rate ?? 1) < 0.6;
      case 'favorite': return state.favorites.includes(q.id);
      case 'due': return Boolean(state.cards[q.id] && state.cards[q.id].due <= now);
      case 'unmastered': return !isMastered(state.cards[q.id]);
      default: return true;
    }
  });
}

/** 決定的でないシャッフル(出題用) */
export function shuffle<T>(a: T[], rnd: () => number = Math.random): T[] {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

/** 弱点重点: 誤答率と未習得を重みにして抽出する */
export function weighted(qs: Question[], state: State, n: number, rnd: () => number = Math.random): Question[] {
  const w = qs.map((q) => {
    const s = stats(state, q.id);
    const miss = s.n ? 1 - (s.rate ?? 0) : 0.5;
    return { q, k: Math.pow(rnd(), 1 / (0.2 + miss * 3)) };
  });
  return w.sort((a, b) => b.k - a.k).slice(0, n).map((x) => x.q);
}

/** 今日の復習: 期限切れカードを期限の古い順に */
export function dueToday(qs: Question[], state: State, now: number): Question[] {
  return qs.filter((q) => state.cards[q.id] && state.cards[q.id].due <= now).sort((a, b) => state.cards[a.id].due - state.cards[b.id].due);
}
