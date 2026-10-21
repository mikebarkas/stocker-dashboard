import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { createSchema, createYoga } from "graphql-yoga";
import { loadConfig } from "./config.ts";
import type { Context } from "./context.ts";
import { createPool } from "./db.ts";
import { databaseHealthCheck } from "./health.ts";
import { resolvers } from "./resolvers.ts";

let config;
try {
  config = loadConfig();
} catch (error) {
  console.error("config error:", (error as Error).message);
  process.exit(1);
}

const pool = createPool(config.db);

// The schema file is the contract; the build copies it next to index.js.
const typeDefs = readFileSync(
  new URL("./schema.graphql", import.meta.url),
  "utf8",
);

const yoga = createYoga({
  schema: createSchema<Context>({ typeDefs, resolvers }),
  // Added to the context every resolver receives.
  context: { pool },
  // Browsers may only call the API from the web app's origin.
  cors: { origin: config.allowedOrigin, methods: ["GET", "POST"] },
  // GraphiQL (the in-browser query editor) at /graphql: development only.
  graphiql: config.graphiql,
  landingPage: false,
  // Liveness at /live; /health (database check) comes from the plugin.
  healthCheckEndpoint: "/live",
  plugins: [databaseHealthCheck(pool)],
  // maskedErrors is on by default: unexpected errors reach the client as
  // "Unexpected error." with no stack trace; GraphQLErrors we throw on
  // purpose (BAD_USER_INPUT) pass through with their message.
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
