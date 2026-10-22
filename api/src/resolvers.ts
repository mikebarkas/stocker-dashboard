// Resolvers: one function per field in `type Query`. GraphQL calls the
// resolver for each field the client asks for, with
// (parent, args, context, info). Fields of returned objects (Quote.price,
// ...) use the default resolver, which reads the property of the same name.
//
// Every query uses $1-style parameters: values travel separately from the
// SQL text, so input can never change the query (no SQL injection).
import type { Resolvers } from "./generated/graphql.ts";
import { type QuoteRow, toQuote } from "./db.ts";
import * as validate from "./validate.ts";

const SYMBOLS_SQL = `
  select distinct symbol from stocker.quotes order by symbol
`;

// The most recent $4 quotes in the range, then re-sorted oldest first so a
// chart can use them as they come. Missing bounds become -/+infinity.
const QUOTES_SQL = `
  select symbol, price, change, ts from (
    select symbol, price, change, ts
    from stocker.quotes
    where symbol = $1
      and ts >= coalesce($2::timestamptz, '-infinity')
      and ts <= coalesce($3::timestamptz, 'infinity')
    order by ts desc
    limit $4
  ) recent
  order by ts
`;

// One row per symbol: DISTINCT ON keeps the first row of each symbol in the
// ORDER BY, i.e. the newest. Walks the (symbol, ts) primary key index.
const LATEST_QUOTES_SQL = `
  select distinct on (symbol) symbol, price, change, ts
  from stocker.quotes
  order by symbol, ts desc
`;

const STATS_SQL = `
  select count(*)::int as samples, min(price) as low, max(price) as high
  from stocker.quotes
  where symbol = $1
`;

const LATEST_SQL = `
  select symbol, price, change, ts
  from stocker.quotes
  where symbol = $1
  order by ts desc
  limit 1
`;

interface StatsRow {
  samples: number;
  low: string | null;
  high: string | null;
}

export const resolvers: Resolvers = {
  Query: {
    symbols: async (_parent, _args, { pool }) => {
      const result = await pool.query<{ symbol: string }>(SYMBOLS_SQL);
      return result.rows.map((row) => row.symbol);
    },

    latestQuotes: async (_parent, _args, { pool }) => {
      const result = await pool.query<QuoteRow>(LATEST_QUOTES_SQL);
      return result.rows.map(toQuote);
    },

    quotes: async (_parent, args, { pool }) => {
      const symbol = validate.symbol(args.symbol);
      const { from, to } = validate.dateRange(args.from, args.to);
      const limit = validate.limit(args.limit);
      const result = await pool.query<QuoteRow>(QUOTES_SQL, [
        symbol,
        from,
        to,
        limit,
      ]);
      // An unknown symbol is not an error: it has no quotes yet.
      return result.rows.map(toQuote);
    },

    summary: async (_parent, args, { pool }) => {
      const symbol = validate.symbol(args.symbol);
      // Two small queries on the (symbol, ts) primary key, in parallel.
      const [stats, latest] = await Promise.all([
        pool.query<StatsRow>(STATS_SQL, [symbol]),
        pool.query<QuoteRow>(LATEST_SQL, [symbol]),
      ]);
      const row = stats.rows[0];
      const latestRow = latest.rows[0];
      // Unknown symbol: null, which the schema allows (summary has no "!").
      if (!row || row.samples === 0 || !latestRow) return null;
      return {
        symbol,
        latest: toQuote(latestRow),
        low: Number(row.low),
        high: Number(row.high),
        samples: row.samples,
      };
    },
  },
};
