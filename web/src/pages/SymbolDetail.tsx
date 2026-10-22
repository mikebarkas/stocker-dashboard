import { useQuery } from "@apollo/client/react";
import { Link, useParams, useSearchParams } from "react-router";
import { PriceChart } from "../components/PriceChart";
import { RangeSelector } from "../components/RangeSelector";
import { StatList } from "../components/StatList";
import {
  MAX_QUOTES,
  parseRange,
  rangeInfo,
  rangeStart,
  type RangeId,
} from "../format";
import { SymbolDetailDocument, SymbolQuotesDocument } from "../gql/graphql";

// Detail page for /symbol/:symbol?range=1m
export function SymbolDetail() {
  // useParams reads :symbol from the path. The API only accepts capitals,
  // so /symbol/msft works too.
  const symbol = (useParams().symbol ?? "").toUpperCase();

  // The chart range lives in the URL (?range=1w), not in component state:
  // it survives a refresh, can be shared, and the Back button undoes it.
  const [searchParams, setSearchParams] = useSearchParams();
  const range = parseRange(searchParams.get("range"));
  const setRange = (next: RangeId) => {
    setSearchParams({ range: next }, { replace: false });
  };

  // Two queries, each with its own loading/error state: the stats don't
  // wait for the chart data, and changing the range refetches only quotes.
  const summary = useQuery(SymbolDetailDocument, { variables: { symbol } });
  const quotes = useQuery(SymbolQuotesDocument, {
    variables: { symbol, from: rangeStart(range), limit: MAX_QUOTES },
  });

  if (summary.loading) return <p role="status">Loading {symbol}…</p>;
  if (summary.error) {
    return (
      <p role="alert">
        Could not load {symbol}: {summary.error.message} <BackLink />
      </p>
    );
  }
  // Empty state: the API returns summary: null for a symbol with no quotes.
  if (!summary.data?.summary) {
    return (
      <section>
        <title>{`${symbol} · Stocker`}</title>
        <h1>{symbol}</h1>
        <p>
          No data for {symbol}. <BackLink />
        </p>
      </section>
    );
  }

  return (
    <article aria-labelledby="symbol-heading">
      <title>{`${symbol} · Stocker`}</title>
      <BackLink />
      <h1 id="symbol-heading">{symbol}</h1>
      <StatList summary={summary.data.summary} />

      <section aria-labelledby="chart-heading">
        <div className="section-header">
          <h2 id="chart-heading">Price</h2>
          <RangeSelector value={range} onChange={setRange} />
        </div>
        {quotes.loading ? (
          <p role="status">Loading chart…</p>
        ) : quotes.error ? (
          <p role="alert">Could not load the chart: {quotes.error.message}</p>
        ) : (
          <PriceChart
            symbol={symbol}
            points={quotes.data?.quotes ?? []}
            rangeDescription={rangeInfo(range).description}
          />
        )}
      </section>
    </article>
  );
}

function BackLink() {
  return (
    <Link className="back" to="/">
      ← All stocks
    </Link>
  );
}
