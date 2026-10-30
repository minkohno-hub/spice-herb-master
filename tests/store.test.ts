import { describe, it, expect, beforeEach } from "vitest";
import { defaultStore, loadStore, saveStore, sanitizeStore } from "../src/domain/store";

// 監査C-12回帰: 型の壊れた保存データでも既定値へ安全に落とし、アプリが起動不能にならないこと。
describe("store sanitize (C-12)", () => {
  it("records が配列でない場合は空配列へ落とす", () => {
    const s = sanitizeStore({ records: {} });
    expect(Array.isArray(s.records)).toBe(true);
    expect(s.records).toEqual([]);
  });
  it("null・非オブジェクトは既定値そのもの", () => {
    expect(sanitizeStore(null)).toEqual(defaultStore);
    expect(sanitizeStore("broken")).toEqual(defaultStore);
    expect(sanitizeStore(42)).toEqual(defaultStore);
  });
  it("正常なフィールドは保持し、壊れたフィールドだけ落とす", () => {
    const s = sanitizeStore({
      records: [{ questionId: "q1", answeredAt: "2026-10-30T00:00:00.000Z", correct: true }, { nope: 1 }, "x"],
      favorites: ["q1", 42, "q2"],
      goalPerDay: 25,
      reader: { sectionId: "ch1-1", dark: true },
      srs: { q1: { questionId: "q1" }, bad: 7 },
    });
    expect(s.records).toHaveLength(1);
    expect(s.favorites).toEqual(["q1", "q2"]);
    expect(s.goalPerDay).toBe(25);
    expect(s.reader.sectionId).toBe("ch1-1");
    expect(s.reader.dark).toBe(true);
    expect(s.reader.highlights).toEqual({});
    expect(Object.keys(s.srs)).toEqual(["q1"]);
  });
  it("reader の部分欠落（highlights なし）でも既定値で補完される", () => {
    const s = sanitizeStore({ reader: { sectionId: "ch2-1" } });
    expect(s.reader.highlights).toEqual({});
    expect(s.reader.notes).toEqual({});
    expect(s.reader.bookmarks).toEqual([]);
  });
});

describe("store load/save (localStorage stub)", () => {
  const mem = new Map<string, string>();
  beforeEach(() => {
    mem.clear();
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => { mem.set(k, v); },
      removeItem: (k: string) => { mem.delete(k); },
    };
  });
  it("壊れた JSON は既定値で起動できる", () => {
    mem.set("spice-herb-master:v1", "{not json");
    expect(loadStore()).toEqual(defaultStore);
  });
  it("型異常データ（records がオブジェクト）でも配列として読み出せる", () => {
    mem.set("spice-herb-master:v1", JSON.stringify({ records: {} }));
    const s = loadStore();
    expect(Array.isArray(s.records)).toBe(true);
  });
  it("saveStore は成功時に true を返す", () => {
    expect(saveStore(structuredClone(defaultStore))).toBe(true);
    expect(loadStore().goalPerDay).toBe(defaultStore.goalPerDay);
  });
});
