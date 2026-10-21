// Input checks for query arguments. They run before any SQL, and a failure
// becomes a GraphQL error with code BAD_USER_INPUT that the client can show.
import { GraphQLError } from "graphql";

// Same rule as the CHECK constraint on stocker.quotes.symbol.
const SYMBOL_RE = /^[A-Z][A-Z.-]{0,9}$/;

// YYYY-MM-DD, or a full ISO 8601 date-time with Z or an offset.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$/;

export const DEFAULT_LIMIT = 200;
export const MAX_LIMIT = 1000;

export function badInput(message: string): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: "BAD_USER_INPUT" },
  });
}

export function symbol(value: string): string {
  if (!SYMBOL_RE.test(value)) {
    throw badInput(
      `Invalid symbol "${value}": use 1-10 capital letters, dots, or dashes, e.g. MSFT`,
    );
  }
  return value;
}

export function limit(value: number | null | undefined): number {
  // null/undefined: the client omitted it or sent null explicitly.
  if (value == null) return DEFAULT_LIMIT;
  if (value < 1 || value > MAX_LIMIT) {
    throw badInput(`limit must be between 1 and ${MAX_LIMIT}, got ${value}`);
  }
  return value;
}

/**
 * Parse `from`/`to`. A date-only `to` means the end of that day (UTC),
 * so `from: "2026-10-20", to: "2026-10-20"` covers the whole day.
 */
export function dateRange(
  from: string | null | undefined,
  to: string | null | undefined,
): { from: Date | null; to: Date | null } {
  const start = from == null ? null : parseDate("from", from, "start");
  const end = to == null ? null : parseDate("to", to, "end");
  if (start && end && start > end) {
    throw badInput("from must be before to");
  }
  return { from: start, to: end };
}

function parseDate(name: string, value: string, edge: "start" | "end"): Date {
  let date: Date;
  if (DATE_RE.test(value)) {
    const time = edge === "start" ? "T00:00:00.000Z" : "T23:59:59.999Z";
    date = new Date(value + time);
  } else if (DATE_TIME_RE.test(value)) {
    date = new Date(value);
  } else {
    throw badInput(
      `${name} must be YYYY-MM-DD or ISO 8601 with a time zone, got "${value}"`,
    );
  }
  // The regexes check the shape; this catches impossible dates (2026-02-30).
  if (Number.isNaN(date.getTime()) || !sameDay(value, date)) {
    throw badInput(`${name} is not a real date: "${value}"`);
  }
  return date;
}

// new Date("2026-02-30T00:00:00Z") silently rolls over to March 2, so check
// the parsed date still has the same year-month-day as the input.
function sameDay(value: string, date: Date): boolean {
  const ymd = value.slice(0, 10);
  if (DATE_RE.test(value) || value.endsWith("Z")) {
    return date.toISOString().slice(0, 10) === ymd;
  }
  // With an offset the UTC day can differ; check the day in that offset.
  const offset = value.slice(-6);
  const sign = offset.startsWith("-") ? -1 : 1;
  const minutes =
    sign * (Number(offset.slice(1, 3)) * 60 + Number(offset.slice(4, 6)));
  const local = new Date(date.getTime() + minutes * 60_000);
  return local.toISOString().slice(0, 10) === ymd;
}
