from datetime import UTC, datetime, timedelta, timezone
from decimal import Decimal

import pytest

from stocker_sync.mapping import InvalidRow, Quote, to_quote

TS = datetime(2026, 10, 20, 18, 9, 54, tzinfo=UTC)


def test_valid_row_maps_columns():
    assert to_quote("MSFT", "412.37", "-1.23", TS) == Quote(
        symbol="MSFT",
        price=Decimal("412.37"),
        change=Decimal("-1.23"),
        ts=TS,
    )


def test_decimals_are_exact():
    quote = to_quote("MSFT", "0.1", "0.2", TS)
    assert quote.price + quote.change == Decimal("0.3")


def test_symbol_with_dot_is_valid():
    assert to_quote("BRK.B", "1", "0", TS).symbol == "BRK.B"


def test_timestamp_is_normalized_to_utc():
    eastern = timezone(timedelta(hours=-4))
    quote = to_quote(
        "MSFT", "1", "0", datetime(2026, 10, 20, 14, 9, 54, tzinfo=eastern)
    )
    assert quote.ts == TS
    assert quote.ts.tzinfo == UTC


@pytest.mark.parametrize(
    ("symbol", "current", "change", "timestamp", "reason"),
    [
        (None, "1", "0", TS, "invalid symbol"),
        ("msft", "1", "0", TS, "invalid symbol"),
        ("TOOLONGSYMBOL", "1", "0", TS, "invalid symbol"),
        ("MSFT", None, "0", TS, "current is null"),
        ("MSFT", "abc", "0", TS, "current is not a number"),
        ("MSFT", "NaN", "0", TS, "not a finite number"),
        ("MSFT", "0", "0", TS, "price must be > 0"),
        ("MSFT", "-5", "0", TS, "price must be > 0"),
        ("MSFT", "1", None, TS, "change is null"),
        ("MSFT", "1", "", TS, "change is not a number"),
        ("MSFT", "1", "0", None, "timezone-aware"),
        ("MSFT", "1", "0", datetime(2026, 10, 20, 18, 9, 54), "timezone-aware"),
        (
            "MSFT",
            "1",
            "0",
            datetime(1969, 12, 31, 21, tzinfo=UTC),
            "timestamp before 2000",
        ),
    ],
)
def test_invalid_rows_are_rejected(symbol, current, change, timestamp, reason):
    with pytest.raises(InvalidRow, match=reason):
        to_quote(symbol, current, change, timestamp)
