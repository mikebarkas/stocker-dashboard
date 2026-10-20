"""Map rows from the homelab "stock" table to rows for Supabase "stocker.quotes".

The homelab table stores price and change as nullable text, so every row is
parsed and checked against the same rules as the Supabase table's constraints.
"""

import re
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation

# Same rule as the CHECK constraint on stocker.quotes.symbol.
SYMBOL_RE = re.compile(r"^[A-Z][A-Z.-]{0,9}$")

# Finnhub returns t=0 when it has no quote, which lands in 1969/1970.
# Nothing this old is real data.
EARLIEST_TS = datetime(2000, 1, 1, tzinfo=UTC)


class InvalidRow(ValueError):
    """A source row that cannot be copied. The message says why."""


@dataclass(frozen=True)
class Quote:
    symbol: str
    price: Decimal
    change: Decimal
    ts: datetime


def to_quote(
    symbol: str | None,
    current: str | None,
    change: str | None,
    timestamp: datetime | None,
) -> Quote:
    """Map one homelab row (symbol, current, change, timestamp) to a Quote.

    Raises InvalidRow if the row would break a constraint on stocker.quotes.
    """
    if symbol is None or not SYMBOL_RE.match(symbol):
        raise InvalidRow(f"invalid symbol {symbol!r}")

    price = _to_decimal("current", current)
    if price <= 0:
        raise InvalidRow(f"price must be > 0, got {price}")

    if timestamp is None or timestamp.tzinfo is None:
        raise InvalidRow(f"timestamp must be timezone-aware, got {timestamp!r}")
    if timestamp < EARLIEST_TS:
        raise InvalidRow(
            f"timestamp before {EARLIEST_TS:%Y-%m-%d}: {timestamp.isoformat()}"
        )

    return Quote(
        symbol=symbol,
        price=price,
        change=_to_decimal("change", change),
        ts=timestamp.astimezone(UTC),
    )


def _to_decimal(column: str, value: str | None) -> Decimal:
    # Decimal, not float: "412.37" stays exactly 412.37 in a numeric column.
    if value is None:
        raise InvalidRow(f"{column} is null")
    try:
        number = Decimal(value)
    except InvalidOperation:
        raise InvalidRow(f"{column} is not a number: {value!r}") from None
    if not number.is_finite():
        raise InvalidRow(f"{column} is not a finite number: {value!r}")
    return number
