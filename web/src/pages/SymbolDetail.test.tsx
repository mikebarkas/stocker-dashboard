import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MAX_QUOTES, rangeStart } from "../format";
import { SymbolDetailDocument, SymbolQuotesDocument } from "../gql/graphql";
import { mock, renderPage } from "../test/render";
import { SymbolDetail } from "./SymbolDetail";

const summary = {
  symbol: "MSFT",
  samples: 1053,
  low: 352.83,
  high: 551.06,
  latest: {
    price: 525.49,
    change: -7.46,
    timestamp: "2026-10-22T14:14:43.000Z",
  },
};

const monthQuotes = [
  { price: 510.0, timestamp: "2026-09-23T14:00:00.000Z" },
  { price: 551.06, timestamp: "2026-10-10T14:00:00.000Z" },
  { price: 525.49, timestamp: "2026-10-22T14:14:43.000Z" },
];

const weekQuotes = [
  { price: 531.55, timestamp: "2026-10-16T14:00:00.000Z" },
  { price: 525.49, timestamp: "2026-10-22T14:14:43.000Z" },
];

// The page asks for quotes since rangeStart(range): the same calculation
// here gives the exact variables the mock must match.
function quotesMock(range: "1w" | "1m", quotes: typeof monthQuotes) {
  return mock(
    SymbolQuotesDocument,
    { symbol: "MSFT", from: rangeStart(range), limit: MAX_QUOTES },
    { data: { quotes } },
  );
}

const summaryMock = mock(
  SymbolDetailDocument,
  { symbol: "MSFT" },
  { data: { summary } },
);

function renderDetail(
  route: string,
  mocks: Parameters<typeof renderPage>[1]["mocks"],
) {
  return renderPage(<SymbolDetail />, {
    route,
    path: "/symbol/:symbol",
    mocks,
  });
}

describe("SymbolDetail", () => {
  it("shows the summary stats and the chart summary", async () => {
    renderDetail("/symbol/MSFT", [summaryMock, quotesMock("1m", monthQuotes)]);

    expect(
      await screen.findByRole("heading", { level: 1, name: "MSFT" }),
    ).toBeInTheDocument();

    // Stats are a description list: each term (<dt>) is paired with its
    // value (<dd>, role "definition") in the same group.
    const stat = (term: string) =>
      within(screen.getByText(term).closest("div") as HTMLElement).getByRole(
        "definition",
      );
    expect(stat("All-time low")).toHaveTextContent("$352.83");
    expect(stat("All-time high")).toHaveTextContent("$551.06");
    expect(stat("Quotes recorded")).toHaveTextContent("1,053");
    expect(stat("Latest")).toHaveTextContent("$525.49");

    // The chart's text summary (the accessible version of the chart).
    expect(
      await screen.findByText(
        /MSFT, last month: \$510\.00 on Sep 23 to \$525\.49 on Oct 22 \(\+3\.04%\)\. Low \$510\.00, high \$551\.06, 3 quotes\./,
      ),
    ).toBeInTheDocument();
  });

  it("accepts a lowercase symbol in the URL", async () => {
    renderDetail("/symbol/msft", [summaryMock, quotesMock("1m", monthQuotes)]);
    expect(
      await screen.findByRole("heading", { level: 1, name: "MSFT" }),
    ).toBeInTheDocument();
  });

  it("changes the range from the selector and keeps it in the URL", async () => {
    const user = userEvent.setup();
    renderDetail("/symbol/MSFT", [
      summaryMock,
      quotesMock("1m", monthQuotes),
      quotesMock("1w", weekQuotes),
    ]);
    await screen.findByText(/last month/);

    // A user clicks the "1W" radio button.
    await user.click(screen.getByRole("radio", { name: "1W" }));

    expect(screen.getByRole("radio", { name: "1W" })).toBeChecked();
    expect(screen.getByTestId("current-location")).toHaveTextContent(
      "/symbol/MSFT?range=1w",
    );
    expect(await screen.findByText(/MSFT, last week:/)).toBeInTheDocument();
  });

  it("shows an empty state for a symbol with no data", async () => {
    renderDetail("/symbol/AAPL", [
      mock(
        SymbolDetailDocument,
        { symbol: "AAPL" },
        { data: { summary: null } },
      ),
      mock(
        SymbolQuotesDocument,
        { symbol: "AAPL", from: rangeStart("1m"), limit: MAX_QUOTES },
        { data: { quotes: [] } },
      ),
    ]);
    expect(await screen.findByText(/No data for AAPL/)).toBeInTheDocument();
  });

  it("shows an error", async () => {
    renderDetail("/symbol/MSFT", [
      mock(
        SymbolDetailDocument,
        { symbol: "MSFT" },
        { error: new Error("Network down") },
      ),
      quotesMock("1m", monthQuotes),
    ]);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load MSFT: Network down",
    );
  });
});
