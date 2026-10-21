// Runs once before all tests: reset the stocker schema, apply the real
// migration, give the read-only role a test password, and load the fixture.
import { readFileSync } from "node:fs";
import pg from "pg";
import { admin } from "./database.ts";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

export default async function setup() {
  const client = new pg.Client(admin);
  try {
    await client.connect();
  } catch (error) {
    // "localhost" tries IPv4 and IPv6, so a refused connection is an
    // AggregateError with an empty message; the code says what happened.
    const reason =
      (error as NodeJS.ErrnoException).code ?? (error as Error).message;
    throw new Error(
      `Cannot reach the test database at ${admin.host}:${admin.port} ` +
        `(${reason}). Start it with: docker compose up -d`,
      { cause: error },
    );
  }
  try {
    await client.query("drop schema if exists stocker cascade");
    await client.query(read("../../db/migrations/0001_stocker_schema.sql"));
    await client.query("alter role stocker_reader password 'stocker_reader'");
    await client.query(read("./fixture.sql"));
  } finally {
    await client.end();
  }
}
