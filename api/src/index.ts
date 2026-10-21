// Entry point: load config, connect, start the HTTP server.
import { createServer } from "node:http";
import { createApp } from "./app.ts";
import { loadConfig } from "./config.ts";
import { createPool } from "./db.ts";

let config;
try {
  config = loadConfig();
} catch (error) {
  console.error("config error:", (error as Error).message);
  process.exit(1);
}

const pool = createPool(config.db);
const yoga = createApp({
  pool,
  allowedOrigin: config.allowedOrigin,
  graphiql: config.graphiql,
});

// Yoga's handler is async and handles its own errors; Node ignores a
// listener's return value, so `void` says we don't await it on purpose.
const server = createServer((req, res) => void yoga(req, res));
server.listen(config.port, () => {
  console.log(
    `stocker api listening on :${config.port}${yoga.graphqlEndpoint}`,
  );
});

// Containers stop with SIGTERM: finish open requests, then close the pool.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    console.log(`${signal} received, shutting down`);
    server.close(() => {
      void pool.end().then(() => process.exit(0));
    });
  });
}
