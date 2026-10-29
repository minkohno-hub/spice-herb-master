
const KEY="spice-herb-master:v1";
export interface StoreData { records: import("./types").AnswerRecord[]; srs: Record<string, import("./types").SrsState>; favorites: string[]; goalPerDay: number; reader: import("./types").ReaderState; examDraft: unknown|null; }
export const defaultStore: StoreData = { records: [], srs: {}, favorites: [], goalPerDay: 10, reader: { sectionId: "", fontSize: 16, dark: false, bookmarks: [], highlights: {}, notes: {} }, examDraft: null };
export function loadStore(): StoreData { try { const raw = localStorage.getItem(KEY); if(!raw) return structuredClone(defaultStore); return { ...structuredClone(defaultStore), ...(JSON.parse(raw) as Partial<StoreData>) }; } catch { return structuredClone(defaultStore); } }
export function saveStore(d: StoreData): void { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* 容量超過等は呼び出し側UIで案内する設計。ここでは握りつぶさず再throwしない代わりに console に残す */ console.warn("localStorage save failed"); } }
export function exportStore(d: StoreData): string { return JSON.stringify(d, null, 2); }
