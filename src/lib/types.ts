export type QType = 'input' | 'choice' | 'tf' | 'reverse' | 'essay' | 'match' | 'order';

export interface RubricPoint {
  label: string;
  keywords: string[];
  src: string;
}

export interface Question {
  id: string;
  type: QType;
  prompt: string;
  answer: string;
  alt?: string[];
  choices?: string[];
  pairs?: { left: string; right: string }[];
  items?: { id: string; text: string }[];
  rubric?: RubricPoint[];
  explain: string;
  src: string[];
  ch: string;
  p: number;
  sec?: string;
  spice?: string;
  grades: number[];
  diff: number;
  status: string;
}

export interface Unit {
  id: string;
  ch: string;
  sec?: string;
  p: number;
  fact: string;
  cat?: string;
  spice?: string;
  status: string;
}

export interface SpiceMeta {
  id: string;
  name: string;
  p: number;
  grades: number[];
  level: string;
  family?: string;
  part?: string;
  origin?: string;
  aliases?: string[];
  mix?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  pages: [number, number];
}

export interface DataIndex {
  version: string;
  generatedFrom: string;
  chapters: Chapter[];
  spices: SpiceMeta[];
  counts: { units: number; questions: number; byType: Record<string, number>; byChapter: Record<string, number> };
  coverage: { unitsTotal: number; unitsWithQuestion: number; uncoveredUnits: string[] };
  search: { id: string; ch: string; p: number; t: string }[];
}

export const TYPE_LABEL: Record<QType, string> = {
  choice: '四択',
  input: '用語入力',
  tf: '正誤',
  reverse: '逆引き',
  essay: '記述',
  match: '組み合わせ',
  order: '並べ替え',
};
