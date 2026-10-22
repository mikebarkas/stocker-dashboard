import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatMarketDate,
  formatMarketTime,
  formatPercent,
  formatPrice,
  MAX_QUOTES,
} from "../format";

export interface ChartPoint {
  price: number;
  timestamp: string;
}

interface PriceChartProps {
  symbol: string;
  points: ChartPoint[];
  // Shown in the summary, e.g. "last month".
  rangeDescription: string;
}

// Price over time, plus a text summary of the same data. The summary is the
// accessible version of the chart: screen readers get little from an SVG,
// and it helps sighted readers too.
export function PriceChart({
  symbol,
  points,
  rangeDescription,
}: PriceChartProps) {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return <p>No quotes in this range.</p>;

  return (
    <figure className="chart">
      {/* The summary says everything the chart shows, so the SVG is hidden
          from screen readers to avoid reading hundreds of data points. */}
      <div className="chart-plot" aria-hidden="true">
        <LineChart
          responsive
          data={points}
          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          style={{ width: "100%", height: "100%" }}
        >
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatMarketDate}
            minTickGap={32}
            stroke="var(--muted)"
          />
          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={(value: number) => formatPrice(value)}
            width={80}
            stroke="var(--muted)"
          />
          <Tooltip
            formatter={(value) => [formatPrice(Number(value)), "Price"]}
            labelFormatter={(label) =>
              typeof label === "string" ? formatMarketTime(label) : ""
            }
          />
          <Line
            type="linear"
            dataKey="price"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </div>
      <figcaption>{summarize(symbol, points, rangeDescription)}</figcaption>
    </figure>
  );
}

function summarize(
  symbol: string,
  points: ChartPoint[],
  rangeDescription: string,
): string {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return "";
  const prices = points.map((p) => p.price);
  const change = formatPercent((last.price - first.price) / first.price);
  const capped =
    points.length >= MAX_QUOTES
      ? ` (the most recent ${MAX_QUOTES.toLocaleString("en-US")})`
      : "";
  return (
    `${symbol}, ${rangeDescription}: ${formatPrice(first.price)} on ` +
    `${formatMarketDate(first.timestamp)} to ${formatPrice(last.price)} on ` +
    `${formatMarketDate(last.timestamp)} (${change}). ` +
    `Low ${formatPrice(Math.min(...prices))}, high ` +
    `${formatPrice(Math.max(...prices))}, ` +
    `${points.length.toLocaleString("en-US")} quotes${capped}.`
  );
}
