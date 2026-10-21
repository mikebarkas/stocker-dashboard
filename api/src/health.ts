// GET /health: is the API able to answer queries? Checks the database with a
// trivial query. Yoga's built-in liveness check ("is the process up?", no
// database) is moved to /live in index.ts.
import type pg from "pg";
import { useReadinessCheck } from "graphql-yoga";

const TIMEOUT_MS = 2_000;

export function databaseHealthCheck(pool: pg.Pool) {
  return useReadinessCheck({
    endpoint: "/health",
    check: async ({ fetchAPI }) => {
      try {
        await Promise.race([
          pool.query("select 1"),
          new Promise((_resolve, reject) =>
            setTimeout(() => reject(new Error("timed out")), TIMEOUT_MS),
          ),
        ]);
        return fetchAPI.Response.json({ status: "ok" });
      } catch (error) {
        // Details go to the server log, not to the caller.
        console.error("health check failed:", (error as Error).message);
        return fetchAPI.Response.json(
          { status: "db unavailable" },
          { status: 503 },
        );
      }
    },
  });
}
