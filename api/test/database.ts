// Connection settings for the test database (compose.yaml locally, a service
// container in CI). TEST_PGHOST / TEST_PGPORT override the defaults.
import type pg from "pg";

const host = process.env["TEST_PGHOST"] ?? "localhost";
const port = Number(process.env["TEST_PGPORT"] ?? "54329");

// Superuser: only the global setup uses it, to reset the schema.
export const admin: pg.ClientConfig = {
  host,
  port,
  database: "postgres",
  user: "postgres",
  password: "postgres",
};

// The tests query as the same read-only role the API uses in production.
export const reader: pg.PoolConfig = {
  host,
  port,
  database: "postgres",
  user: "stocker_reader",
  password: "stocker_reader",
};
