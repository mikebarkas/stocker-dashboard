import { GraphQLError } from "graphql";
import { describe, expect, it } from "vitest";
import * as validate from "./validate.ts";

function expectBadInput(fn: () => unknown, message: RegExp) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(GraphQLError);
    expect((error as GraphQLError).extensions["code"]).toBe("BAD_USER_INPUT");
    expect((error as GraphQLError).message).toMatch(message);
    return;
  }
  throw new Error("expected a BAD_USER_INPUT error");
}

describe("symbol", () => {
  it.each(["MSFT", "BRK.B", "A", "ABCDEFGHIJ"])("accepts %s", (s) => {
    expect(validate.symbol(s)).toBe(s);
  });

  it.each(["msft", "", "1ABC", "ABCDEFGHIJK", "MS FT", "MSFT;--"])(
    "rejects %j",
    (s) => {
      expectBadInput(() => validate.symbol(s), /Invalid symbol/);
    },
  );
});

describe("limit", () => {
  it("defaults when omitted or null", () => {
    expect(validate.limit(undefined)).toBe(200);
    expect(validate.limit(null)).toBe(200);
  });

  it.each([1, 200, 1000])("accepts %i", (n) => {
    expect(validate.limit(n)).toBe(n);
  });

  it.each([0, -1, 1001])("rejects %i", (n) => {
    expectBadInput(() => validate.limit(n), /between 1 and 1000/);
  });
});

describe("dateRange", () => {
  it("allows no dates", () => {
    expect(validate.dateRange(null, undefined)).toEqual({
      from: null,
      to: null,
    });
  });

  it("treats a date-only range as whole UTC days", () => {
    const { from, to } = validate.dateRange("2026-10-20", "2026-10-20");
    expect(from?.toISOString()).toBe("2026-10-20T00:00:00.000Z");
    expect(to?.toISOString()).toBe("2026-10-20T23:59:59.999Z");
  });

  it("accepts ISO 8601 with Z or an offset", () => {
    const { from, to } = validate.dateRange(
      "2026-10-20T14:00:00Z",
      "2026-10-20T16:00:00-04:00",
    );
    expect(from?.toISOString()).toBe("2026-10-20T14:00:00.000Z");
    expect(to?.toISOString()).toBe("2026-10-20T20:00:00.000Z");
  });

  it.each([
    ["2026-10-20T14:00:00", "no time zone"],
    ["20/10/2026", "wrong format"],
    ["yesterday", "not a date"],
  ])("rejects %j (%s)", (value) => {
    expectBadInput(
      () => validate.dateRange(value, null),
      /from must be YYYY-MM-DD/,
    );
  });

  it.each(["2026-02-30", "2026-13-01", "2026-02-30T10:00:00-04:00"])(
    "rejects impossible date %j",
    (value) => {
      expectBadInput(() => validate.dateRange(null, value), /not a real date/);
    },
  );

  it("rejects from after to", () => {
    expectBadInput(
      () => validate.dateRange("2026-10-21", "2026-10-20"),
      /from must be before to/,
    );
  });
});
