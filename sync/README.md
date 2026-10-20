# sync

Copies new rows from the homelab Postgres `stock` table to the Supabase `stocker.quotes` table. Runs as a Kubernetes CronJob in the homelab (homelab #31).

## How it works

1. Read the newest `ts` already in Supabase **for each symbol**.
2. For each symbol in homelab, select only rows newer than that. A symbol not yet in Supabase starts from the beginning, so the first run against an empty table is the backfill.
3. Map each row (`current` → `price`, `timestamp` → `ts`). The homelab table stores numbers as nullable text, so rows that would break a constraint on `stocker.quotes` are skipped and logged with a reason.
4. Insert in batches of 1,000 with one statement per batch (`INSERT … SELECT FROM unnest(arrays) ON CONFLICT (symbol, ts) DO NOTHING`). Re-runs are safe.

Why per symbol: with one watermark for the whole table, a symbol whose newest quote is older than another symbol's (a late collector run, a halted stock) would be skipped forever.

Logs one line per symbol (`read`, `inserted`, `skipped`) and a total. Exits 1 on any error, without printing passwords.

## Configuration

Environment variables only; see [.env.example](.env.example).

| Variable                                                            | Notes                                                                         |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `SOURCE_PGHOST`, `_PGPORT`, `_PGDATABASE`, `_PGUSER`, `_PGPASSWORD` | Homelab Postgres. No TLS: in-cluster only (or port-forward).                  |
| `TARGET_PGHOST`, `_PGPORT`, `_PGDATABASE`, `_PGUSER`, `_PGPASSWORD` | Supabase session pooler, port 5432. User is `stocker_writer.<project-ref>`.   |
| `TARGET_SSLROOTCERT`                                                | Path to Supabase's CA certificate. Required: the connection is `verify-full`. |

## Homelab read-only role

The sync reads homelab with its own role, not `postgres`. Create it once, as `postgres`, in the `stocker` database:

```sql
create role stocker_sync login;
\password stocker_sync
grant connect on database stocker to stocker_sync;
grant usage on schema public to stocker_sync;
grant select on public.stock to stocker_sync;
```

## Development

Requires [uv](https://docs.astral.sh/uv/). Python 3.14 (see `.python-version`).

```sh
cd sync
uv sync                    # create .venv with dependencies
uv run pytest              # unit tests
uv run ruff check          # lint
uv run ruff format         # format
```

## Running locally (and the one-time backfill)

```sh
# Terminal 1: reach homelab Postgres
kubectl port-forward -n postgres svc/postgres 15432:5432

# Terminal 2
cd sync
cp .env.example .env       # fill in passwords, Supabase host and project ref
uv run --env-file .env python -m stocker_sync
```

Running it again should log `inserted=0` for every symbol.

## Container

```sh
docker build -f sync/Containerfile -t stocker-sync sync
```

Two stages: uv installs the locked dependencies into a virtualenv; the runtime image (`python:3.14-slim`) gets only the virtualenv and the code, and runs as UID 10001.

Pushing a tag `sync-vX.Y.Z` builds amd64 and arm64 images and pushes `ghcr.io/mikebarkas/stocker-sync:X.Y.Z` ([workflow](../.github/workflows/sync-image.yml)).
