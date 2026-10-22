import {
  direction,
  formatChange,
  formatPercent,
  percentChange,
} from "../format";

interface PriceChangeProps {
  price: number;
  change: number;
}

const ARROW = { up: "▲", down: "▼", flat: "■" };
const SPOKEN = { up: "Up", down: "Down", flat: "Unchanged" };

// The change since the previous close: "▲ +$1.08 (+0.20%)". Color is never
// the only signal: the arrow shows it visually, and screen readers hear
// "Up" or "Down" (the arrow itself is hidden from them).
export function PriceChange({ price, change }: PriceChangeProps) {
  const dir = direction(change);
  return (
    <span className={`change change-${dir}`}>
      <span aria-hidden="true">{ARROW[dir]} </span>
      <span className="visually-hidden">{SPOKEN[dir]} </span>
      {formatChange(change)} ({formatPercent(percentChange(price, change))})
    </span>
  );
}
