import { describe, it, expect, beforeEach } from "vitest";
import { applyCardReview, qualityFromResult, qualityFromSelfEval, isDue } from "../src/domain/srs";
import { defaultStore, loadStore, saveStore, type StoreData } from "../src/domain/store";
import { CARDS, QUESTIONS } from "../src/data/questions";

// フラッシュカード自己評価UI（バッチC1、docs/DECISIONS.md #32）の単体テスト。
// 検証対象: (1) 自己評価→SM-2 quality の写像、(2) 評価の SRS 反映と累積、
// (3) 演習由来の SRS・解答記録との非干渉、(4) localStorage 永続化と後方互換。

describe("自己評価→quality 写像（C1）", () => {
  it("分かった=5 / あいまい=3 / 分からない=1", () => {
    expect(qualityFromSelfEval("known")).toBe(5);
    expect(qualityFromSelfEval("unsure")).toBe(3);
    expect(qualityFromSelfEval("unknown")).toBe(1);
  });
  it("qualityFromResult は selfEval を優先し、あいまい=3（旧来の素通り=1 から是正）", () => {
    expect(qualityFromResult(null, null, "known")).toBe(5);
    expect(qualityFromResult(null, null, "unsure")).toBe(3);
    expect(qualityFromResult(null, null, "unknown")).toBe(1);
    // selfEval なしの演習経路は従来どおり
    expect(qualityFromResult(true, 1)).toBe(5);
    expect(qualityFromResult(false, 0.6)).toBe(3);
    expect(qualityFromResult(false, 0)).toBe(1);
  });
});

describe("カード評価の SRS 反映（C1）", () => {
  const t0 = new Date("2026-01-01T12:00:00Z");
  it("未評価カードに「分かった」→ repetitions=1・intervalDays=1・翌日期限", () => {
    const s = applyCardReview(undefined, "card-x", "known", t0);
    expect(s.itemId).toBe("card-x");
    expect(s.repetitions).toBe(1);
    expect(s.intervalDays).toBe(1);
    expect(s.lastReviewedAt).toBe(t0.toISOString());
    expect(isDue(s, t0)).toBe(false);
    expect(isDue(s, new Date("2026-01-03T12:00:00Z"))).toBe(true);
  });
  it("未評価カードに「分からない」→ repetitions=0 のまま翌日期限（リセット相当）", () => {
    const s = applyCardReview(undefined, "card-x", "unknown", t0);
    expect(s.repetitions).toBe(0);
    expect(s.intervalDays).toBe(1);
  });
  it("未評価カードに「あいまい」→ quality 3 として repetitions=1・ease は 2.36 に低下", () => {
    const s = applyCardReview(undefined, "card-x", "unsure", t0);
    expect(s.repetitions).toBe(1);
    expect(s.intervalDays).toBe(1);
    expect(s.easeFactor).toBeCloseTo(2.36, 10);
  });
  it("評価は累積する: 「分かった」を2回→ repetitions=2・intervalDays=6", () => {
    let s = applyCardReview(undefined, "card-x", "known", t0);
    s = applyCardReview(s, "card-x", "known", new Date("2026-01-02T12:00:00Z"));
    expect(s.repetitions).toBe(2);
    expect(s.intervalDays).toBe(6);
  });
  it("進んだ状態で「分からない」→ repetitions リセット・ease は維持される", () => {
    let s = applyCardReview(undefined, "card-x", "known", t0);
    s = applyCardReview(s, "card-x", "known", new Date("2026-01-02T12:00:00Z"));
    const easeBefore = s.easeFactor;
    s = applyCardReview(s, "card-x", "unknown", new Date("2026-01-08T12:00:00Z"));
    expect(s.repetitions).toBe(0);
    expect(s.intervalDays).toBe(1);
    expect(s.easeFactor).toBe(easeBefore);
  });
});

describe("演習由来の状態との非干渉（C1）", () => {
  it("カードIDと問題IDの名前空間は実データで分離されている（全カードが card- 接頭辞）", () => {
    const cardIds = [...CARDS].map((c) => c.id);
    const questionIds = new Set([...QUESTIONS].map((q) => q.id));
    expect(cardIds.length).toBeGreaterThan(0);
    for (const id of cardIds) {
      expect(id.startsWith("card-")).toBe(true);
      expect(questionIds.has(id)).toBe(false);
    }
  });
  it("画面と同じ更新手順でも、演習の SRS エントリと解答記録は変わらない", () => {
    const d: StoreData = structuredClone(defaultStore);
    d.srs["q1-sample"] = { itemId: "q1-sample", easeFactor: 2.5, intervalDays: 6, repetitions: 2, dueAt: "2026-01-07T12:00:00.000Z", lastReviewedAt: "2026-01-01T12:00:00.000Z" };
    d.records.push({ questionId: "q1-sample", answeredAt: "2026-01-01T12:00:00.000Z", correct: true, scoreRatio: 1, autoScoreRatio: 1, selfScoreRatio: null, responseMs: null });
    const srsBefore = structuredClone(d.srs["q1-sample"]);
    const recordsBefore = structuredClone(d.records);
    // Cards.tsx の evaluate と同じ手順（store のドラフトを書き換える）
    d.srs["card-x"] = applyCardReview(d.srs["card-x"], "card-x", "known", new Date("2026-01-01T12:00:00Z"));
    expect(d.srs["q1-sample"]).toEqual(srsBefore);
    expect(d.records).toEqual(recordsBefore); // 分析（computeStats は records のみから決まる）に影響しない
    expect(d.srs["card-x"].repetitions).toBe(1);
  });
});

describe("永続化と後方互換（C1）", () => {
  const KEY = "spice-herb-master:v1";
  let mem: Record<string, string>;
  beforeEach(() => {
    mem = {};
    (globalThis as any).localStorage = {
      getItem: (k: string) => (k in mem ? mem[k] : null),
      setItem: (k: string, v: string) => { mem[k] = String(v); },
      removeItem: (k: string) => { delete mem[k]; },
    };
  });
  it("カード評価は saveStore→loadStore で保持される", () => {
    const d: StoreData = structuredClone(defaultStore);
    d.srs["card-x"] = applyCardReview(undefined, "card-x", "unsure", new Date("2026-01-01T12:00:00Z"));
    saveStore(d);
    const loaded = loadStore();
    expect(loaded.srs["card-x"]).toEqual(d.srs["card-x"]);
  });
  it("旧形式の保存データ（カード評価なし・演習SRSのみ）でも壊れず、そのまま読み込める", () => {
    const legacy = {
      records: [{ questionId: "q1-sample", answeredAt: "2026-01-01T12:00:00.000Z", correct: true, scoreRatio: 1, autoScoreRatio: 1, selfScoreRatio: null, responseMs: null }],
      srs: { "q1-sample": { itemId: "q1-sample", easeFactor: 2.5, intervalDays: 1, repetitions: 1, dueAt: "2026-01-02T12:00:00.000Z", lastReviewedAt: "2026-01-01T12:00:00.000Z" } },
      favorites: [], goalPerDay: 10,
      reader: { sectionId: "", fontSize: 16, dark: false, bookmarks: [], highlights: {}, notes: {} },
      examDraft: null,
    };
    mem[KEY] = JSON.stringify(legacy);
    const loaded = loadStore();
    expect(loaded.srs["q1-sample"]?.repetitions).toBe(1);
    expect(loaded.records).toHaveLength(1);
    // この状態にカード評価を足しても既存エントリは保持される
    loaded.srs["card-x"] = applyCardReview(loaded.srs["card-x"], "card-x", "known", new Date("2026-01-01T12:00:00Z"));
    saveStore(loaded);
    const reloaded = loadStore();
    expect(reloaded.srs["q1-sample"]?.repetitions).toBe(1);
    expect(reloaded.srs["card-x"]?.repetitions).toBe(1);
  });
  it("srs フィールド自体が欠けた保存データは既定値で補完される", () => {
    mem[KEY] = JSON.stringify({ records: [], favorites: [] });
    const loaded = loadStore();
    expect(loaded.srs).toEqual({});
    expect(loaded.goalPerDay).toBe(defaultStore.goalPerDay);
  });
  it("破損した保存データは既定値にフォールバックする", () => {
    mem[KEY] = "{not-json";
    expect(loadStore()).toEqual(defaultStore);
  });
});

describe("カードの種別・絞り込み・シャッフル（FIX1、DECISIONS #34）: domain/cards・domain/shuffle", () => {
  it("cardKindOf は kind フィールドを優先し、未設定なら ID 接頭辞から判定する（後方互換）", async () => {
    const { cardKindOf } = await import("../src/domain/cards");
    const base = CARDS[0]!;
    expect(cardKindOf({ ...base, kind: "term" })).toBe("term"); // フィールド優先
    const bare = { ...base } as Record<string, unknown>;
    delete bare.kind;
    expect(cardKindOf({ ...bare, id: "card-term-x" } as never)).toBe("term");
    expect(cardKindOf({ ...bare, id: "card-rev-x" } as never)).toBe("reverse");
    expect(cardKindOf({ ...bare, id: "card-profile-x" } as never)).toBe("profile");
    expect(cardKindOf({ ...bare, id: "card-x" } as never)).toBe("qa");
    expect(cardKindOf({ ...bare, id: "card-sample-1" } as never)).toBe("qa"); // kind未設定は一問一答扱い
  });

  it("実データの種別別件数と、種別・章フィルタの結果が実測と一致する", async () => {
    const { countCardsByKind, filterCards } = await import("../src/domain/cards");
    expect(countCardsByKind(CARDS)).toEqual({ qa: 379, profile: 80, term: 80, reverse: 63 });
    expect(filterCards(CARDS, { kind: null, chapterId: null }).length).toBe(602);
    expect(filterCards(CARDS, { kind: "term", chapterId: null }).length).toBe(80);
    expect(filterCards(CARDS, { kind: "reverse", chapterId: null }).length).toBe(63);
    expect(filterCards(CARDS, { kind: "term", chapterId: "ch2" }).length).toBe(80); // 用語は全件第二章
    expect(filterCards(CARDS, { kind: "qa", chapterId: "ch2" }).length).toBe(138); // 第二章カード218件の内訳: 一問一答138＋プロフィール80
    expect(filterCards(CARDS, { kind: null, chapterId: "preface" }).length).toBe(91);
    // フィルタは入力順を保持する（並び替えはシャッフル側の責務）
    const terms = filterCards(CARDS, { kind: "term", chapterId: null });
    const ids = terms.map((c) => c.id);
    expect(ids).toEqual(CARDS.filter((c) => c.id.startsWith("card-term-")).map((c) => c.id));
  });

  it("seededShuffle は決定的で、要素の集合を変えず、入力を変更しない", async () => {
    const { seededShuffle, fnv1a } = await import("../src/domain/shuffle");
    const input = Array.from({ length: 50 }, (_, i) => i);
    const a = seededShuffle(input, "seed-a");
    const b = seededShuffle(input, "seed-a");
    expect(a).toEqual(b); // 同シード→同結果
    expect([...a].sort((x, y) => x - y)).toEqual(input); // 集合不変
    expect(input).toEqual(Array.from({ length: 50 }, (_, i) => i)); // 入力不変
    expect(seededShuffle(input, "seed-b")).not.toEqual(a); // 別シード→別順序
    expect(fnv1a("x")).toBe(fnv1a("x"));
    expect(seededShuffle([], "s")).toEqual([]);
  });
});
