import { describe, expect, it } from "vitest";
import { formatDuration, toDatetimeLocalValue } from "./format";

describe("formatDuration", () => {
  it("formats sub-hour durations as minutes only", () => {
    expect(formatDuration(5 * 60_000)).toBe("5m");
    expect(formatDuration(0)).toBe("0m");
  });

  it("formats durations over an hour as hours and minutes", () => {
    expect(formatDuration(90 * 60_000)).toBe("1h 30m");
    expect(formatDuration(2 * 60 * 60_000)).toBe("2h 0m");
  });

  it("rounds down to the nearest whole minute", () => {
    expect(formatDuration(119_000)).toBe("1m");
  });

  it("never goes negative for a zero or slightly negative span", () => {
    expect(formatDuration(-500)).toBe("0m");
  });

  it("handles a timer that runs across midnight into the next day", () => {
    // Started 23:50 on day 1, stopped 00:10 on day 2 — a real midnight rollover.
    const startedAt = new Date("2026-03-14T23:50:00.000Z");
    const endedAt = new Date("2026-03-15T00:10:00.000Z");
    const elapsed = endedAt.getTime() - startedAt.getTime();

    expect(elapsed).toBeGreaterThan(0);
    expect(formatDuration(elapsed)).toBe("20m");
  });

  it("handles a multi-hour timer spanning midnight", () => {
    const startedAt = new Date("2026-03-14T22:00:00.000Z");
    const endedAt = new Date("2026-03-15T02:30:00.000Z");
    const elapsed = endedAt.getTime() - startedAt.getTime();

    expect(formatDuration(elapsed)).toBe("4h 30m");
  });

  it("handles the DST fall-back day without going negative or NaN", () => {
    // US DST ends Nov 1, 2026 — a naive local-time diff could misbehave here.
    const startedAt = new Date("2026-11-01T05:30:00.000Z");
    const endedAt = new Date("2026-11-01T08:30:00.000Z");
    const elapsed = endedAt.getTime() - startedAt.getTime();

    expect(elapsed).toBe(3 * 60 * 60_000);
    expect(formatDuration(elapsed)).toBe("3h 0m");
  });
});

describe("toDatetimeLocalValue", () => {
  it("round-trips through Date parsing back to the same instant", () => {
    const original = new Date("2026-06-01T14:23:45.000Z");
    const local = toDatetimeLocalValue(original);
    const parsed = new Date(local);

    expect(parsed.getTime()).toBe(original.getTime());
  });

  it("preserves seconds precision (needed for sub-minute entries)", () => {
    const original = new Date("2026-06-01T14:23:45.000Z");
    const local = toDatetimeLocalValue(original);

    expect(local).toMatch(/:\d{2}:\d{2}$/);
  });
});
