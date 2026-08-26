import { describe, expect, it } from "vitest";
import { formatMoney, toMinorUnits, toMajorUnits } from "./money";

describe("formatMoney", () => {
  it("formats USD minor units as dollars and cents", () => {
    expect(formatMoney(50000, "USD")).toBe("$500.00");
    expect(formatMoney(150, "USD")).toBe("$1.50");
  });

  it("formats JPY as zero-decimal (no minor units)", () => {
    expect(formatMoney(500, "JPY")).toBe("¥500");
  });
});

describe("toMinorUnits / toMajorUnits round trip", () => {
  it("converts dollars to cents and back for USD", () => {
    expect(toMinorUnits(500, "USD")).toBe(50000);
    expect(toMajorUnits(50000, "USD")).toBe(500);
  });

  it("handles fractional dollar amounts without floating point drift", () => {
    expect(toMinorUnits(19.99, "USD")).toBe(1999);
  });

  it("treats JPY as already-whole-unit (no minor unit conversion)", () => {
    expect(toMinorUnits(500, "JPY")).toBe(500);
    expect(toMajorUnits(500, "JPY")).toBe(500);
  });
});
