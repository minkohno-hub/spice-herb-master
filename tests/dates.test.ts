import { describe, it, expect } from "vitest";
import { localDateKey, dateKeyOfIso, todayKey } from "../src/domain/dates";

// 監査C-09回帰: 「今日」の判定は UTC ではなく端末ローカル日付で行う。
// ローカル時刻コンストラクタとローカル getter はどのタイムゾーンでも整合するため、
// このテストは実行環境の TZ に依存しない。
describe("local date keys (C-09)", () => {
  it("ローカル深夜0時30分はその日のキーになる（UTCでは前日になる時刻）", () => {
    const d = new Date(2026, 9, 30, 0, 30); // ローカル 2026-10-30 00:30
    expect(localDateKey(d)).toBe("2026-10-30");
    expect(dateKeyOfIso(d.toISOString())).toBe("2026-10-30");
  });
  it("ISO文字列経由でもローカル日付と一致する", () => {
    const d = new Date(2026, 0, 5, 23, 59);
    expect(dateKeyOfIso(d.toISOString())).toBe(localDateKey(d));
  });
  it("todayKey は今日のローカル日付", () => {
    expect(todayKey()).toBe(localDateKey(new Date()));
  });
});
