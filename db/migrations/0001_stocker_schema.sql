-- Schema, table, and roles for stocker.
-- Safe to re-run: every statement is idempotent.
-- Works on Supabase and on plain Postgres (local dev, CI).

begin;

-- Own schema, not "public": Supabase's Data API (PostgREST, pg_graphql)
-- only exposes schemas listed in its settings, which "stocker" is not.
create schema if not exists stocker;
revoke all on schema stocker from public;

create table if not exists stocker.quotes (
  symbol text        not null check (symbol ~ '^[A-Z][A-Z.-]{0,9}$'),
  price  numeric     not null check (price > 0),
  change numeric     not null,
  ts     timestamptz not null,
  -- The primary key is the unique (symbol, ts) constraint the sync job's
  -- ON CONFLICT relies on, and its index serves the API's
  -- "one symbol, time range" queries. No separate index needed.
  primary key (symbol, ts)
);

comment on table stocker.quotes is
  'Stock quotes copied from the homelab "stock" table by the sync job.';
comment on column stocker.quotes.ts is
  'Quote time from Finnhub ("t"), stored as UTC.';

-- Roles. LOGIN without a password: set passwords by hand with \password
-- so they never land in the repo or in shell history.
do $$
begin
  if not exists (select from pg_roles where rolname = 'stocker_writer') then
    create role stocker_writer login;
  end if;
  if not exists (select from pg_roles where rolname = 'stocker_reader') then
    create role stocker_reader login;
  end if;
end
$$;

-- Writer (sync job): SELECT to find the newest ts, INSERT for new rows.
-- ON CONFLICT DO NOTHING needs no UPDATE privilege.
grant usage on schema stocker to stocker_writer;
grant select, insert on stocker.quotes to stocker_writer;

-- Reader (API): SELECT only, read-only sessions, and a query time limit.
grant usage on schema stocker to stocker_reader;
grant select on stocker.quotes to stocker_reader;
alter role stocker_reader set default_transaction_read_only = on;
alter role stocker_reader set statement_timeout = '5s';

-- Supabase's API roles get nothing here, in case the schema is ever
-- added to the Data API's exposed schemas by mistake.
-- These roles only exist on Supabase, so skip them elsewhere.
do $$
declare
  r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select from pg_roles where rolname = r) then
      execute format('revoke all on schema stocker from %I', r);
      execute format('revoke all on all tables in schema stocker from %I', r);
    end if;
  end loop;
end
$$;

commit;
