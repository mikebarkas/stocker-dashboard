// API tests against a real Postgres (see compose.yaml and fixture.sql).
// Requests go through yoga.fetch: the full GraphQL pipeline a client hits
// (parse, validate, resolve, mask errors, serialize), without opening a port.
import pg from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.ts";
import { reader } from "./database.ts";

const ORIGIN = "http://localhost:5173";

interface GraphQLResponse<T> {
  data?: T | null;
  errors?: { message: string; extensions?: { code?: string } }[];
}

interface QuoteFields {
  symbol: string;
  price: number;
  change: number;
  timestamp: string;
}

const pool = new pg.Pool(reader);
const app = createApp({ pool, allowedOrigin: ORIGIN, graphiql: false });

afterAll(async () => {
  await pool.end();
});

async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
  yoga = app,
): Promise<GraphQLResponse<T>> {
  const response = await yoga.fetch("http://localhost/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return (await response.json()) as GraphQLResponse<T>;
}

const QUOTES = `
  query Quotes($symbol: String!, $from: String, $to: String, $limit: Int) {
    quotes(symbol: $symbol, from: $from, to: $to, limit: $limit) {
      symbol price change timestamp
    }
  }
`;

async function quotes(variables: Record<string, unknown>) {
  return gql<{ quotes: QuoteFields[] }>(QUOTES, variables);
}

function timestamps(result: GraphQLResponse<{ quotes: QuoteFields[] }>) {
  expect(result.errors).toBeUndefined();
  return result.data?.quotes.map((q) => q.timestamp);
}

function errorCode(result: GraphQLResponse<unknown>) {
  return result.errors?.[0]?.extensions?.code;
}

describe("symbols", () => {
  it("lists every symbol A to Z", async () => {
    const result = await gql<{ symbols: string[] }>("{ symbols }");
    expect(result).toEqual({ data: { symbols: ["BRK.B", "MSFT", "NVDA"] } });
  });
});

describe("quotes", () => {
  it("returns quotes oldest first with schema types", async () => {
    const result = await quotes({ symbol: "NVDA" });
    expect(result.data?.quotes).toEqual([
      {
        symbol: "NVDA",
        price: 180,
        change: 1,
        timestamp: "2026-10-20T14:00:00.000Z",
      },
      {
        symbol: "NVDA",
        price: 181.5,
        change: 2.5,
        timestamp: "2026-10-20T15:00:00.000Z",
      },
      {
        symbol: "NVDA",
        price: 179.25,
        change: 0.25,
        timestamp: "2026-10-20T16:00:00.000Z",
      },
    ]);
  });

  it("with a limit, returns the most recent quotes, oldest first", async () => {
    expect(timestamps(await quotes({ symbol: "MSFT", limit: 3 }))).toEqual([
      "2026-10-21T00:00:00.000Z",
      "2026-10-21T14:00:00.000Z",
      "2026-10-21T20:00:00.000Z",
    ]);
  });

  describe("date range filter", () => {
    it("a date-only range covers the whole UTC day, both ends inclusive", async () => {
      const result = await quotes({
        symbol: "MSFT",
        from: "2026-10-20",
        to: "2026-10-20",
      });
      // Excludes 2026-10-19T23:59:59.999Z and 2026-10-21T00:00:00Z.
      expect(timestamps(result)).toEqual([
        "2026-10-20T00:00:00.000Z",
        "2026-10-20T14:00:00.000Z",
        "2026-10-20T23:59:59.999Z",
      ]);
    });

    it("accepts date-times with a time zone offset", async () => {
      const result = await quotes({
        symbol: "MSFT",
        from: "2026-10-20T10:00:00-04:00", // 14:00 UTC
        to: "2026-10-21T00:00:00Z",
      });
      expect(timestamps(result)).toEqual([
        "2026-10-20T14:00:00.000Z",
        "2026-10-20T23:59:59.999Z",
        "2026-10-21T00:00:00.000Z",
      ]);
    });

    it("an open-ended range with a limit keeps the most recent", async () => {
      const result = await quotes({
        symbol: "MSFT",
        from: "2026-10-20",
        limit: 2,
      });
      expect(timestamps(result)).toEqual([
        "2026-10-21T14:00:00.000Z",
        "2026-10-21T20:00:00.000Z",
      ]);
    });

    it("rejects from after to", async () => {
      const result = await quotes({
        symbol: "MSFT",
        from: "2026-10-21",
        to: "2026-10-20",
      });
      expect(errorCode(result)).toBe("BAD_USER_INPUT");
      expect(result.errors?.[0]?.message).toBe("from must be before to");
    });
  });

  describe("limit cap", () => {
    it("allows the maximum, 1000", async () => {
      const result = await quotes({ symbol: "MSFT", limit: 1000 });
      expect(result.data?.quotes).toHaveLength(7);
    });

    it.each([0, -1, 1001])("rejects %i", async (limit) => {
      const result = await quotes({ symbol: "MSFT", limit });
      expect(errorCode(result)).toBe("BAD_USER_INPUT");
      expect(result.errors?.[0]?.message).toMatch(/between 1 and 1000/);
      // quotes is non-null ([Quote!]!), so the error nulls out `data`.
      expect(result.data).toBeNull();
    });
  });

  describe("invalid date", () => {
    it.each([
      ["2026-02-30", /not a real date/],
      ["yesterday", /must be YYYY-MM-DD/],
      ["2026-10-20T14:00:00", /must be YYYY-MM-DD/], // no time zone
    ])("rejects %j", async (from, message) => {
      const result = await quotes({ symbol: "MSFT", from });
      expect(errorCode(result)).toBe("BAD_USER_INPUT");
      expect(result.errors?.[0]?.message).toMatch(message);
    });
  });

  it("rejects an invalid symbol before any SQL runs", async () => {
    const result = await quotes({ symbol: "MSFT'; drop table x;--" });
    expect(errorCode(result)).toBe("BAD_USER_INPUT");
  });
});

describe("unknown symbol", () => {
  it("is not an error: no quotes and a null summary", async () => {
    const result = await gql(
      `{ quotes(symbol: "AAPL") { price } summary(symbol: "AAPL") { samples } }`,
    );
    expect(result).toEqual({ data: { quotes: [], summary: null } });
  });
});

describe("summary", () => {
  it("returns all-time statistics and the latest quote", async () => {
    const result = await gql(`{
      summary(symbol: "MSFT") {
        symbol samples low high
        latest { price change timestamp }
      }
    }`);
    expect(result).toEqual({
      data: {
        summary: {
          symbol: "MSFT",
          samples: 7,
          low: 400,
          high: 415.5,
          latest: {
            price: 402.75,
            change: -8.5,
            timestamp: "2026-10-21T20:00:00.000Z",
          },
        },
      },
    });
  });
});

describe("GraphQL validation", () => {
  it("rejects unknown fields before any resolver runs", async () => {
    const result = await gql(`{ quotes(symbol: "MSFT") { volume } }`);
    expect(errorCode(result)).toBe("GRAPHQL_VALIDATION_FAILED");
  });
});

describe("when the database is down", () => {
  // Port 1: nothing listens there, so every query fails.
  const downPool = new pg.Pool({
    ...reader,
    port: 1,
    connectionTimeoutMillis: 1_000,
  });
  const downApp = createApp({
    pool: downPool,
    allowedOrigin: ORIGIN,
    graphiql: false,
  });

  afterAll(async () => {
    await downPool.end();
  });

  it("masks the error: no details or stack trace reach the client", async () => {
    const result = await gql("{ symbols }", undefined, downApp);
    expect(result.errors).toEqual([
      expect.objectContaining({ message: "Unexpected error." }),
    ]);
    const body = JSON.stringify(result);
    expect(body).not.toMatch(/ECONNREFUSED|stack|at .*\.ts/);
  });

  it("reports /health as 503", async () => {
    const response = await downApp.fetch("http://localhost/health");
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "db unavailable" });
  });
});

describe("HTTP endpoints", () => {
  it("/health is 200 when the database answers", async () => {
    const response = await app.fetch("http://localhost/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("/live is 200 without touching the database", async () => {
    const response = await app.fetch("http://localhost/live");
    expect(response.status).toBe(200);
  });

  it("CORS announces only the web app's origin", async () => {
    const response = await app.fetch("http://localhost/graphql", {
      method: "OPTIONS",
      headers: {
        origin: "https://evil.example",
        "access-control-request-method": "POST",
      },
    });
    // The browser compares this with its own origin and blocks a mismatch.
    expect(response.headers.get("access-control-allow-origin")).toBe(ORIGIN);
  });

  it("serves no GraphiQL page when it is off (production)", async () => {
    const response = await app.fetch("http://localhost/graphql", {
      headers: { accept: "text/html" },
    });
    expect(response.headers.get("content-type") ?? "").not.toMatch(
      /text\/html/,
    );
  });
});

describe("database role", () => {
  it("stocker_reader cannot write", async () => {
    await expect(
      pool.query("insert into stocker.quotes values ('TEST', 1, 0, now())"),
    ).rejects.toThrow(/read-only transaction|permission denied/);
  });
});
