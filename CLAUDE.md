# stocker-dashboard

React + TypeScript dashboard and a TypeScript GraphQL API for stock quotes collected by Kubernetes CronJobs in a homelab. The goal is to show a frontend, an API, a data pipeline, and the infrastructure it runs on.

## Architecture

```
homelab k3s CronJobs (existing, homelab repo apps/stocker)
  -> homelab Postgres, table "stock" (symbol, current, change, timestamp)
  -> sync job (this repo, sync/; runs as a CronJob in homelab)
  -> Supabase Postgres, schema "stocker", table "quotes" (database only)
  -> GraphQL API (this repo, api/; container on the cloudlab EC2)
  -> React app (this repo, web/; static, served by Caddy on a subdomain over HTTPS)
```

Supabase is used **only as a managed Postgres**. Do not use Supabase's auto-generated APIs (PostgREST, pg_graphql); the GraphQL API is ours. Keep the data out of the `public` schema so Supabase does not expose it.

## Layout

- `api/`: TypeScript, GraphQL Yoga (or Apollo Server), `pg`, Vitest
- `web/`: Vite, React, TypeScript (`strict`), Apollo Client, GraphQL Code Generator, React Router, Recharts, Vitest + React Testing Library
- `sync/`: Python, copies new rows from homelab Postgres to Supabase (idempotent: `ON CONFLICT (symbol, ts) DO NOTHING`)
- `db/`: plain SQL migrations for Supabase, applied with `psql`; also used for local and CI test databases

## Issues (work in this order)

This repo: #1 scaffold + CI → #2 Supabase schema and roles → #3 sync job → #4 API schema/resolvers → #5 API tests → #6 API container → #7 web app setup → #8 list + detail pages → #9 web tests + build → #10 README, screenshots, release

Other repos:

- homelab #31: run the sync job as a CronJob (after #3)
- homelab #32: run stocker CronJobs in America/New_York and store UTC timestamps
- cloudlab #43: Cloudflare DNS records
- cloudlab #44: deploy API and web with Ansible and Caddy on the existing EC2

**Done when:** live over HTTPS on a subdomain, CI passing with API and web tests, README with architecture and screenshots, release tagged.

## Constraints

- AWS spend under **$25/month** total. The API shares a t3.micro (1 GB RAM) with the AutoCorp stack: measure memory before deciding anything.
- Database roles: `stocker_writer` (sync only), `stocker_reader` (SELECT only, used by the API).
- No secrets in the repo: no `.env` files, connection strings, or keys. Commit `.env.example` files instead.
- Images publish to GHCR from GitHub Actions, multi-arch (amd64 + arm64).

## Git workflow

- Every change starts from an issue. Branch `<issue#>--short-slug` (e.g. `4--graphql-schema`) from `dev`.
- Commit messages start with the issue number: `4: Add quotes resolver`.
- PRs into `dev`, then `dev` into `main`. Merge with "Create a merge commit"; no squash or rebase.
- Tag releases on `main`.

## Working rules

- **Stay in scope.** Suggest extra features instead of building them.
- **Show diffs; a human reviews and commits.** Don't push, merge, deploy, or create releases unless asked.

@CLAUDE.local.md
