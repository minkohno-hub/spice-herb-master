// 教材・問題データは章ごとに分割されたJSONを必要な分だけ取得する。
import type { DataIndex, Question, Unit } from './types';

const base = import.meta.env.BASE_URL;
const cache = new Map<string, Promise<unknown>>();

async function getJson<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    const p = fetch(`${base}data/${path}`).then((r) => {
      if (!r.ok) throw new Error(`データを取得できませんでした (${r.status})`);
      return r.json();
    });
    p.catch(() => cache.delete(path)); // 失敗時は再試行できるようにする
    cache.set(path, p);
  }
  return cache.get(path) as Promise<T>;
}

export const loadIndex = () => getJson<DataIndex>('index.json');
export const loadQuestions = (ch: string) => getJson<Question[]>(`questions-${ch}.json`);
export const loadUnits = (ch: string) => getJson<Unit[]>(`units-${ch}.json`);

export async function loadAllQuestions(chapters: string[]): Promise<Question[]> {
  return (await Promise.all(chapters.map(loadQuestions))).flat();
}
export async function loadAllUnits(chapters: string[]): Promise<Unit[]> {
  return (await Promise.all(chapters.map(loadUnits))).flat();
}
