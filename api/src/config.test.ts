import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.ts";

const caFile = join(mkdtempSync(join(tmpdir(), "stocker-api-")), "ca.crt");
writeFileSync(caFile, "-----BEGIN CERTIFICATE-----\ntest\n");

const valid = {
  ALLOWED_ORIGIN: "https://stocker.example.com",
  NODE_ENV: "production",
  PGHOST: "db.example.com",
  PGPORT: "5432",
  PGDATABASE: "postgres",
  PGUSER: "stocker_reader.ref",
  PGPASSWORD: "s3cret-value",
  PGSSLROOTCERT: caFile,
};

describe("loadConfig", () => {
  it("reads a complete environment", () => {
    const config = loadConfig(valid);
    expect(config).toMatchObject({
      port: 4000,
      allowedOrigin: "https://stocker.example.com",
      graphiql: false,
      db: { host: "db.example.com", port: 5432, user: "stocker_reader.ref" },
    });
    expect(config.db.ca).toContain("BEGIN CERTIFICATE");
  });

  it("turns GraphiQL on outside production", () => {
    expect(loadConfig({ ...valid, NODE_ENV: "development" }).graphiql).toBe(
      true,
    );
  });

  it("lists missing variables by name", () => {
    expect(() =>
      loadConfig({ ...valid, PGHOST: undefined, PGPASSWORD: "" }),
    ).toThrow("missing environment variables: PGHOST, PGPASSWORD");
  });

  it("never puts values in the error", () => {
    // The exact message: names only, so the password cannot be in it.
    expect(() => loadConfig({ ...valid, PGHOST: undefined })).toThrow(
      /^missing environment variables: PGHOST$/,
    );
  });

  it.each([
    ["PORT", "abc"],
    ["PORT", "70000"],
    ["PGPORT", "0"],
  ])("rejects %s=%s", (name, value) => {
    expect(() => loadConfig({ ...valid, [name]: value })).toThrow(
      `${name} must be a port number`,
    );
  });

  it("fails if the CA certificate file does not exist", () => {
    expect(() =>
      loadConfig({ ...valid, PGSSLROOTCERT: "/no/such/ca.crt" }),
    ).toThrow(/ENOENT/);
  });
});
