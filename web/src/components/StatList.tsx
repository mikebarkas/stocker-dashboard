import type { SymbolDetailQuery } from "../gql/graphql";
import { formatMarketTime, formatPrice } from "../format";
import { PriceChange } from "./PriceChange";

// The summary object from the SymbolDetail query, minus the null case.
// Generated types can be reused as props: no hand-written duplicates.
type Summary = NonNullable<SymbolDetailQuery["summary"]>;

// All-time statistics as a description list (<dl>): term/value pairs are
// exactly what <dt>/<dd> are for, and screen readers announce them as such.
export function StatList({ summary }: { summary: Summary }) {
  const { latest } = summary;
  return (
    <dl className="stats">
      {latest && (
        <div>
          <dt>Latest</dt>
          <dd>
            <span className="stat-value">{formatPrice(latest.price)}</span>
            <PriceChange price={latest.price} change={latest.change} />
            <span className="muted">{formatMarketTime(latest.timestamp)}</span>
          </dd>
        </div>
      )}
      <div>
        <dt>All-time low</dt>
        <dd className="stat-value">
          {summary.low === null ? "–" : formatPrice(summary.low)}
        </dd>
      </div>
      <div>
        <dt>All-time high</dt>
        <dd className="stat-value">
          {summary.high === null ? "–" : formatPrice(summary.high)}
        </dd>
      </div>
      <div>
        <dt>Quotes recorded</dt>
        <dd className="stat-value">
          {summary.samples.toLocaleString("en-US")}
        </dd>
      </div>
    </dl>
  );
}
