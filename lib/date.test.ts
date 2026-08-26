import { describe, expect, it } from "vitest";
import { startOfWeek } from "./date";

function ymd(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

describe("startOfWeek", () => {
  it("returns the same Monday when given a Monday", () => {
    const monday = new Date(2026, 2, 16); // Mon Mar 16, 2026
    expect(ymd(startOfWeek(monday))).toBe("2026-03-16");
  });

  it("rolls a Sunday back to the previous Monday, not forward", () => {
    const sunday = new Date(2026, 2, 22); // Sun Mar 22, 2026
    expect(ymd(startOfWeek(sunday))).toBe("2026-03-16");
  });

  it("rolls a mid-week day back to that week's Monday", () => {
    const thursday = new Date(2026, 2, 19); // Thu Mar 19, 2026
    expect(ymd(startOfWeek(thursday))).toBe("2026-03-16");
  });

  it("zeroes out the time so the boundary is midnight", () => {
    const wednesdayAfternoon = new Date(2026, 2, 18, 15, 45, 30);
    const result = startOfWeek(wednesdayAfternoon);

    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  it("handles a week that crosses a month boundary", () => {
    const aprilFirst = new Date(2026, 3, 1); // Wed Apr 1, 2026
    expect(ymd(startOfWeek(aprilFirst))).toBe("2026-03-30");
  });
});
