import { describe, expect, it } from "vitest";
import {
  direction,
  formatChange,
  formatMarketDate,
  formatMarketTime,
  formatPercent,
  formatPrice,
  parseRange,
  percentChange,
  rangeStart,
} from "./format";

describe("money and percent", () => {
  it("formats prices as USD", () => {
    expect(formatPrice(532.95)).toBe("$532.95");
    expect(formatPrice(1234.5)).toBe("$1,234.50");
  });

  it("signs changes", () => {
    expect(formatChange(1.08)).toBe("+$1.08");
    expect(formatChange(-4.45)).toBe("-$4.45");
    expect(formatChange(0)).toBe("$0.00");
  });

  it("computes change against the previous close", () => {
    // 412 now, +12 today: previous close 400, so +3%.
    expect(percentChange(412, 12)).toBeCloseTo(0.03);
    expect(formatPercent(0.03)).toBe("+3.00%");
    expect(formatPercent(-0.0123)).toBe("-1.23%");
  });

  it.each([
    [1, "up"],
    [-1, "down"],
    [0, "flat"],
  ] as const)("direction(%d) is %s", (change, expected) => {
    expect(direction(change)).toBe(expected);
  });
});

describe("market time (US Eastern)", () => {
  it("shows the 4 PM close in ET, whatever the viewer's time zone", () => {
    // 20:00 UTC in October (daylight time) is 4:00 PM ET.
    expect(formatMarketTime("2026-10-21T20:00:00.000Z")).toBe(
      "Oct 21, 4:00 PM ET",
    );
  });

  it("uses the ET date near midnight UTC", () => {
    // 02:00 UTC on the 22nd is still the 21st in New York.
    expect(formatMarketDate("2026-10-22T02:00:00.000Z")).toBe("Oct 21");
  });
});

describe("ranges", () => {
  it("defaults unknown or missing values to 1M", () => {
    expect(parseRange(null)).toBe("1m");
    expect(parseRange("5y")).toBe("1m");
    expect(parseRange("1w")).toBe("1w");
  });

  it("starts 1W and 1M at a date, and All has no start", () => {
    const now = new Date("2026-10-22T15:30:00Z");
    expect(rangeStart("1w", now)).toBe("2026-10-15");
    expect(rangeStart("1m", now)).toBe("2026-09-22");
    expect(rangeStart("all", now)).toBeNull();
  });
});
