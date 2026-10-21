// Configuration from environment variables only. See .env.example.
import { readFileSync } from "node:fs";

export interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  // PEM text of the CA certificate that signs the database's TLS certificate.
  ca: string;
}

export interface Config {
  port: number;
  // The only origin browsers may call the API from (CORS).
  allowedOrigin: string;
  // GraphiQL, the in-browser query editor: development only.
  graphiql: boolean;
  db: DbConfig;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const missing: string[] = [];
  const get = (name: string): string => {
    const value = env[name];
    if (!value) missing.push(name);
    return value ?? "";
  };

  const config = {
    port: Number(env["PORT"] ?? "4000"),
    allowedOrigin: get("ALLOWED_ORIGIN"),
    graphiql: env["NODE_ENV"] !== "production",
    host: get("PGHOST"),
    dbPort: Number(get("PGPORT")),
    database: get("PGDATABASE"),
    user: get("PGUSER"),
    password: get("PGPASSWORD"),
    caFile: get("PGSSLROOTCERT"),
  };

  // Names only, never values.
  if (missing.length > 0) {
    throw new Error(`missing environment variables: ${missing.join(", ")}`);
  }
  for (const [name, port] of [
    ["PORT", config.port],
    ["PGPORT", config.dbPort],
  ] as const) {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`${name} must be a port number`);
    }
  }

  return {
    port: config.port,
    allowedOrigin: config.allowedOrigin,
    graphiql: config.graphiql,
    db: {
      host: config.host,
      port: config.dbPort,
      database: config.database,
      user: config.user,
      password: config.password,
      ca: readFileSync(config.caFile, "utf8"),
    },
  };
}
