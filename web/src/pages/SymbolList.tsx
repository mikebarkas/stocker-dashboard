import { useQuery } from "@apollo/client/react";
import { Link } from "react-router";
import { PriceChange } from "../components/PriceChange";
import { formatMarketTime, formatPrice } from "../format";
import { LatestQuotesDocument } from "../gql/graphql";

// Home page: a card per symbol with its latest price and change. Every data
// view handles the three states before showing data: loading, error, empty.
export function SymbolList() {
  // useQuery is a hook: it runs the query when the component first renders,
  // and re-renders the component when the result (or an error) arrives.
  const { data, loading, error } = useQuery(LatestQuotesDocument);

  return (
    <section aria-labelledby="stocks-heading">
      {/* React 19 moves <title> into <head>: each page sets its own. */}
      <title>Stocker</title>
      <h1 id="stocks-heading">Stocks</h1>
      {loading ? (
        <p role="status">Loading prices…</p>
      ) : error ? (
        <p role="alert">Could not load prices: {error.message}</p>
      ) : !data?.latestQuotes.length ? (
        <p>No quotes yet.</p>
      ) : (
        <ul className="cards">
          {/* key: lets React match list items between renders */}
          {data.latestQuotes.map((quote) => (
            <li key={quote.symbol}>
              <Link
                className="card"
                to={`/symbol/${encodeURIComponent(quote.symbol)}`}
              >
                <span className="card-symbol">{quote.symbol}</span>
                <span className="card-price">{formatPrice(quote.price)}</span>
                <PriceChange price={quote.price} change={quote.change} />
                <span className="muted">
                  {formatMarketTime(quote.timestamp)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
