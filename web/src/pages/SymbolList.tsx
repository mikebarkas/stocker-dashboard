import { useQuery } from "@apollo/client/react";
import { Link } from "react-router";
import { SymbolsDocument } from "../gql/graphql";

// Home page: links to every symbol. Every data view handles the three states
// before showing data: loading, error, and empty.
export function SymbolList() {
  // useQuery is a hook: it runs the query when the component first renders,
  // and re-renders the component when the result (or an error) arrives.
  // `data` is typed from symbols.graphql via codegen.
  const { data, loading, error } = useQuery(SymbolsDocument);

  if (loading) return <p role="status">Loading symbols…</p>;
  if (error) {
    return <p role="alert">Could not load symbols: {error.message}</p>;
  }

  const symbols = data?.symbols ?? [];
  if (symbols.length === 0) return <p>No symbols yet.</p>;

  return (
    <section>
      <h1>Stocks</h1>
      <ul>
        {/* key: lets React match list items between renders */}
        {symbols.map((symbol) => (
          <li key={symbol}>
            <Link to={`/symbol/${encodeURIComponent(symbol)}`}>{symbol}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
