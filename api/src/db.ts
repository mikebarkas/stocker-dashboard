import pg from "pg";
import type { DbConfig } from "./config.ts";
import type { Quote } from "./generated/graphql.ts";

export function createPool(db: DbConfig): pg.Pool {
  const pool = new pg.Pool({
    host: db.host,
    port: db.port,
    database: db.database,
    user: db.user,
    password: db.password,
    // verify-full: the server certificate must chain to this CA, and Node
    // checks the hostname by default.
    ssl: { ca: db.ca, rejectUnauthorized: true },
    // Small pool: one API instance on a shared t3.micro, and each connection
    // holds a session on Supabase's pooler.
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    application_name: "stocker-api",
  });
  // An idle connection can drop (network blip, pooler restart). Without this
  // listener, pg emits an unhandled "error" event and the process exits.
  pool.on("error", (err) => {
    console.error("idle database connection error:", err.message);
  });
  return pool;
}

// A row from stocker.quotes as pg returns it: numeric columns come back as
// strings (to avoid silently losing precision), timestamptz as a Date.
export interface QuoteRow {
  symbol: string;
  price: string;
  change: string;
  ts: Date;
}

// Database row -> GraphQL Quote. Float is fine for display: prices have at
// most a few decimal places.
export function toQuote(row: QuoteRow): Quote {
  return {
    symbol: row.symbol,
    price: Number(row.price),
    change: Number(row.change),
    timestamp: row.ts.toISOString(),
  };
}
