// Builds the GraphQL server. No side effects: index.ts starts it for real,
// and tests call createApp with their own pool and send requests through
// yoga.fetch without opening a port.
import { readFileSync } from "node:fs";
import type pg from "pg";
import { createSchema, createYoga } from "graphql-yoga";
import type { Context } from "./context.ts";
import { databaseHealthCheck } from "./health.ts";
import { resolvers } from "./resolvers.ts";

export interface AppOptions {
  pool: pg.Pool;
  // The only origin browsers may call the API from (CORS).
  allowedOrigin: string;
  // GraphiQL, the in-browser query editor: development only.
  graphiql: boolean;
}

// The schema file is the contract; the build copies it next to app.js.
const typeDefs = readFileSync(
  new URL("./schema.graphql", import.meta.url),
  "utf8",
);

export function createApp({ pool, allowedOrigin, graphiql }: AppOptions) {
  return createYoga({
    schema: createSchema<Context>({ typeDefs, resolvers }),
    // Added to the context every resolver receives.
    context: { pool },
    // Browsers may only call the API from the web app's origin.
    cors: { origin: allowedOrigin, methods: ["GET", "POST"] },
    // GraphiQL at /graphql: development only.
    graphiql,
    landingPage: false,
    // Liveness at /live; /health (database check) comes from the plugin.
    healthCheckEndpoint: "/live",
    plugins: [databaseHealthCheck(pool)],
    // maskedErrors is on by default: unexpected errors reach the client as
    // "Unexpected error." with no stack trace; GraphQLErrors we throw on
    // purpose (BAD_USER_INPUT) pass through with their message.
  });
}
