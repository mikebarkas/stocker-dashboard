"""Copy new rows from the homelab "stock" table to Supabase "stocker.quotes".

For each symbol, find the newest ts already in Supabase and copy only newer
rows from homelab. Inserts use ON CONFLICT DO NOTHING, so re-runs are safe.
On an empty target the first run copies everything (the backfill).
"""

import logging
import ssl
import sys
from datetime import UTC, datetime
from itertools import batched

import pg8000.native

from stocker_sync import config
from stocker_sync.mapping import InvalidRow, Quote, to_quote

log = logging.getLogger("stocker_sync")

BATCH_SIZE = 1000

# Lower bound for a symbol that is not in Supabase yet: copy all its rows.
NO_WATERMARK = datetime(1, 1, 1, tzinfo=UTC)

SELECT_WATERMARKS = "select symbol, max(ts) from stocker.quotes group by symbol"

SELECT_SYMBOLS = "select distinct symbol from stock where symbol is not null"

SELECT_NEW_ROWS = """
select symbol, current, change, timestamp
from stock
where symbol = :symbol and timestamp > :since
order by timestamp
"""

# One statement per batch: the arrays are expanded into rows by unnest.
INSERT_QUOTES = """
insert into stocker.quotes (symbol, price, change, ts)
select * from unnest(
  cast(:symbols as text[]),
  cast(:prices as numeric[]),
  cast(:changes as numeric[]),
  cast(:timestamps as timestamptz[])
)
on conflict (symbol, ts) do nothing
"""


def connect_source(db: config.DbConfig) -> pg8000.native.Connection:
    # Homelab Postgres is reached inside the cluster (or via port-forward)
    # and does not use TLS, same as the collector CronJobs.
    return pg8000.native.Connection(
        db.user,
        host=db.host,
        port=db.port,
        database=db.database,
        password=db.password,
        ssl_context=False,
        application_name="stocker-sync",
        timeout=30,
    )


def connect_target(db: config.DbConfig, ca_file: str) -> pg8000.native.Connection:
    # verify-full: check the certificate chain against Supabase's CA and
    # check the hostname. create_default_context does both.
    tls = ssl.create_default_context(cafile=ca_file)
    # Python 3.13+ also turns on strict X.509 checks, which reject Supabase's
    # "Intermediate 2021 CA": it has no keyUsage extension. Turn off only that
    # flag; the chain and hostname are still verified. libpq (psql) does not
    # apply this check, which is why psql connects with the same CA file.
    tls.verify_flags &= ~ssl.VERIFY_X509_STRICT
    return pg8000.native.Connection(
        db.user,
        host=db.host,
        port=db.port,
        database=db.database,
        password=db.password,
        ssl_context=tls,
        application_name="stocker-sync",
        timeout=30,
    )


def insert(target: pg8000.native.Connection, quotes: list[Quote]) -> int:
    """Insert quotes in batches; return how many rows were actually new."""
    inserted = 0
    for batch in batched(quotes, BATCH_SIZE, strict=False):
        target.run(
            INSERT_QUOTES,
            symbols=[q.symbol for q in batch],
            prices=[q.price for q in batch],
            changes=[q.change for q in batch],
            timestamps=[q.ts for q in batch],
        )
        inserted += target.row_count
    return inserted


def sync(source: pg8000.native.Connection, target: pg8000.native.Connection) -> int:
    """Copy new rows for every symbol. Return the total number inserted."""
    watermarks = dict(target.run(SELECT_WATERMARKS))
    symbols = sorted(row[0] for row in source.run(SELECT_SYMBOLS))

    total = 0
    for symbol in symbols:
        since = watermarks.get(symbol, NO_WATERMARK)
        rows = source.run(SELECT_NEW_ROWS, symbol=symbol, since=since)

        quotes: list[Quote] = []
        skipped = 0
        for row in rows:
            try:
                quotes.append(to_quote(*row))
            except InvalidRow as e:
                log.warning("skip %s %s: %s", symbol, row[3], e)
                skipped += 1

        inserted = insert(target, quotes)
        total += inserted
        log.info(
            "%s: since=%s read=%d inserted=%d skipped=%d",
            symbol,
            "none" if since is NO_WATERMARK else since.isoformat(),
            len(rows),
            inserted,
            skipped,
        )
    return total


def main() -> int:
    logging.basicConfig(
        stream=sys.stdout,
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    source = target = None
    try:
        cfg = config.load()
        source = connect_source(cfg.source)
        target = connect_target(cfg.target, str(cfg.target_ssl_root_cert))
        total = sync(source, target)
    except Exception as e:
        # Log the error type and message only: no traceback with local
        # variables, and DbConfig never prints its password.
        log.error("sync failed: %s: %s", type(e).__name__, e)
        return 1
    finally:
        for conn in (source, target):
            if conn is not None:
                conn.close()

    log.info("sync done: %d rows inserted", total)
    return 0
