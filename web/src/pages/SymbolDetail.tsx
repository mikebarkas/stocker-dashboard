import { useQuery } from "@apollo/client/react";
import { Link, useParams } from "react-router";
import { SymbolDetailDocument } from "../gql/graphql";

// Detail page for /symbol/:symbol. Minimal on purpose: #8 adds the chart,
// range selector, and styling.
export function SymbolDetail() {
  // useParams reads the :symbol part of the URL. The API only accepts
  // capitals, so /symbol/msft works too.
  const symbol = (useParams().symbol ?? "").toUpperCase();

  const { data, loading, error } = useQuery(SymbolDetailDocument, {
    variables: { symbol },
  });

  if (loading) return <p role="status">Loading {symbol}…</p>;
  if (error) {
    return (
      <p role="alert">
        Could not load {symbol}: {error.message} <BackLink />
      </p>
    );
  }

  // Empty state: the API returns summary: null for a symbol with no quotes.
  const summary = data?.summary;
  if (!summary) {
    return (
      <p>
        No data for {symbol}. <BackLink />
      </p>
    );
  }

  return (
    <section>
      <h1>{summary.symbol}</h1>
      <dl>
        {summary.latest && (
          <>
            <dt>Latest price</dt>
            <dd>
              {summary.latest.price} ({summary.latest.change >= 0 ? "+" : ""}
              {summary.latest.change})
            </dd>
            <dt>As of</dt>
            <dd>{new Date(summary.latest.timestamp).toLocaleString()}</dd>
          </>
        )}
        <dt>Low</dt>
        <dd>{summary.low}</dd>
        <dt>High</dt>
        <dd>{summary.high}</dd>
        <dt>Samples</dt>
        <dd>{summary.samples}</dd>
      </dl>
      <BackLink />
    </section>
  );
}

function BackLink() {
  return <Link to="/">Back to all symbols</Link>;
}
