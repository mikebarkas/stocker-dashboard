// Formatting and small calculations for prices and times. Pure functions,
// so they are easy to test (#9).

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const signedUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  signDisplay: "exceptZero",
});
const signedPercent = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

// Market time: prices are read in the exchange's time zone.
const marketDateTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const marketDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "short",
  day: "numeric",
});

export function formatPrice(price: number): string {
  return usd.format(price);
}

export function formatChange(change: number): string {
  return signedUsd.format(change);
}

/** Change as a fraction of the previous close (price - change). */
export function percentChange(price: number, change: number): number {
  const previousClose = price - change;
  return previousClose === 0 ? 0 : change / previousClose;
}

export function formatPercent(fraction: number): string {
  return signedPercent.format(fraction);
}

export type Direction = "up" | "down" | "flat";

export function direction(change: number): Direction {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "flat";
}

/** "Oct 21, 4:00 PM ET" */
export function formatMarketTime(iso: string): string {
  return `${marketDateTime.format(new Date(iso))} ET`;
}

/** "Oct 21" */
export function formatMarketDate(iso: string): string {
  return marketDate.format(new Date(iso));
}

// Chart ranges. "all" is the most recent 1,000 quotes (the API's cap).
export const RANGES = [
  { id: "1w", label: "1W", description: "last week", days: 7 },
  { id: "1m", label: "1M", description: "last month", days: 30 },
  { id: "all", label: "All", description: "all time", days: null },
] as const;

export type RangeId = (typeof RANGES)[number]["id"];

export const DEFAULT_RANGE: RangeId = "1m";
export const MAX_QUOTES = 1000;

export function parseRange(value: string | null): RangeId {
  return RANGES.find((r) => r.id === value)?.id ?? DEFAULT_RANGE;
}

export function rangeInfo(id: RangeId) {
  return RANGES.find((r) => r.id === id) ?? RANGES[1];
}

/**
 * The `from` date for a range, as YYYY-MM-DD (UTC), or null for "all".
 * A date, not a date-time, on purpose: it stays the same on every render,
 * so the query variables stay the same and Apollo does not refetch in a
 * loop (and can answer from its cache).
 */
export function rangeStart(id: RangeId, now = new Date()): string | null {
  const { days } = rangeInfo(id);
  if (days === null) return null;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return start.toISOString().slice(0, 10);
}
