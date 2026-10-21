# stocker-dashboard

React + TypeScript dashboard and a GraphQL API for stock quotes collected by Kubernetes CronJobs in my homelab.

## Goal

A small, complete full-stack project: a frontend, an API, a data pipeline, and the infrastructure it runs on.

## Architecture

```
homelab k3s CronJobs ──> homelab Postgres (table "stock")
                               │
                               ▼
                     sync job (sync/, CronJob in homelab)
                               │
                               ▼
                     Supabase Postgres (schema "stocker", table "quotes")
                               │
                               ▼
                     GraphQL API (api/, container on EC2)
                               │
                               ▼
                     React app (web/, static files served by Caddy over HTTPS)
```

Supabase is used only as a managed Postgres. The GraphQL API is written here; Supabase's generated APIs are not used.

## Layout

| Path    | What                        | Stack                                                    |
| ------- | --------------------------- | -------------------------------------------------------- |
| `api/`  | GraphQL API                 | TypeScript, Node 24, `pg`, Vitest                        |
| `web/`  | Dashboard                   | Vite, React, TypeScript, Apollo Client, Recharts, Vitest |
| `sync/` | Homelab → Supabase sync job | Python                                                   |

## Development

Requires Node 24 (see `.nvmrc`) and Docker (for the API tests' database).

```sh
npm install
docker compose up -d     # throwaway Postgres for the API tests (compose.yaml)
npm run lint
npm run typecheck
npm test                 # API tests run against that database
npm run build
docker compose down      # stop it; the data is thrown away
```

## Status

Work in progress. Scaffold and CI are in place; the database, sync job, API, and web app are next.
