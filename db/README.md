# db

Database schema for stocker. Supabase is used only as a managed Postgres; nothing here depends on Supabase features.

## Migrations

`migrations/` holds plain SQL files, applied in order with `psql`. Each file is idempotent, so re-running one is safe. The same files set up the local and CI test databases (#5).

| File                      | What                                                          |
| ------------------------- | ------------------------------------------------------------- |
| `0001_stocker_schema.sql` | `stocker` schema, `stocker.quotes` table, reader/writer roles |

### Tables

`stocker.quotes`: one row per quote. Primary key `(symbol, ts)`.

| Column   | Type          | Notes                                    |
| -------- | ------------- | ---------------------------------------- |
| `symbol` | `text`        | Uppercase ticker, e.g. `MSFT`            |
| `price`  | `numeric`     | Finnhub `c` (current price), must be > 0 |
| `change` | `numeric`     | Finnhub `d` (change from previous close) |
| `ts`     | `timestamptz` | Finnhub `t` (quote time), UTC            |

### Roles

| Role             | Used by       | Privileges                                         |
| ---------------- | ------------- | -------------------------------------------------- |
| `stocker_writer` | sync job (#3) | `SELECT`, `INSERT` on `stocker.quotes`             |
| `stocker_reader` | API (#4)      | `SELECT` only; read-only sessions; 5 s query limit |

## Applying to Supabase

Connect as the `postgres` user through the session pooler (see below). `psql` prompts for the password.

```sh
psql "postgresql://postgres.<project-ref>@<pooler-host>:5432/postgres?sslmode=require" \
  -v ON_ERROR_STOP=1 -f db/migrations/0001_stocker_schema.sql
```

No local `psql`? Use the Postgres image:

```sh
docker run --rm -it -v "$PWD/db:/db:ro" postgres:17-alpine \
  psql "postgresql://postgres.<project-ref>@<pooler-host>:5432/postgres?sslmode=require" \
  -v ON_ERROR_STOP=1 -f /db/migrations/0001_stocker_schema.sql
```

Then set the role passwords in the same `psql` session. `\password` hashes the password before sending it, so it never appears in logs or shell history:

```
\password stocker_writer
\password stocker_reader
```

Store the passwords somewhere safe, like a password manager. (not in a repo 🤪)

### Lock down the Data API

The `stocker` schema is not exposed by default. Confirm it in the dashboard:

- **Project Settings → Data API**: turn the Data API off entirely (this project does not use PostgREST or pg_graphql), or at least make sure `stocker` is not in **Exposed schemas**.
- **Advisors → Security Advisor**: should report nothing for `stocker`.

## Connecting

| Setting  | Value                                                        |
| -------- | ------------------------------------------------------------ |
| Host     | Session pooler host from **Connect** in the dashboard        |
| Port     | `5432` (session mode)                                        |
| Database | `postgres`                                                   |
| User     | `<role>.<project-ref>`, e.g. `stocker_reader.abcdefghijklmn` |
| SSL      | Required: `sslmode=verify-full` with Supabase's CA cert      |

Why these choices:

- **Pooler, not the direct host.** The direct host (`db.<project-ref>.supabase.co`) is IPv6-only unless you pay for the IPv4 add-on. The pooler is reachable over IPv4 from both the homelab and EC2.
- **Session mode (port 5432), not transaction mode (6543).** The API keeps a small, long-lived connection pool, so session mode behaves like a normal Postgres connection. Transaction mode is for many short-lived clients (serverless) and does not support some features, such as named prepared statements.
- **`verify-full`.** `require` only encrypts. `verify-full` also checks the server certificate, which stops a man-in-the-middle. Download the CA certificate from **Project Settings → Database → SSL Configuration**.

Connection strings are set through environment variables; each app commits a `.env.example` showing the names.
