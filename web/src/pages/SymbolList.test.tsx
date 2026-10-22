import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LatestQuotesDocument } from "../gql/graphql";
import { mock, renderPage } from "../test/render";
import { SymbolList } from "./SymbolList";

const quotes = [
  {
    symbol: "MSFT",
    price: 525.49,
    change: -7.46,
    timestamp: "2026-10-22T14:14:43.000Z",
  },
  {
    symbol: "TMUS",
    price: 158.94,
    change: 5.19,
    timestamp: "2026-10-22T14:24:32.000Z",
  },
];

function renderList(response: Parameters<typeof mock>[2]) {
  return renderPage(<SymbolList />, {
    mocks: [mock(LatestQuotesDocument, {}, response)],
  });
}

describe("SymbolList", () => {
  it("shows a loading message first", () => {
    renderList({ data: { latestQuotes: quotes } });
    // Synchronous: the query has not answered yet.
    expect(screen.getByRole("status")).toHaveTextContent("Loading prices");
  });

  it("shows a card per symbol with price and change", async () => {
    renderList({ data: { latestQuotes: quotes } });

    // findBy* waits for the mocked response to arrive and React to render.
    const msft = await screen.findByRole("link", { name: /MSFT/ });
    expect(msft).toHaveAttribute("href", "/symbol/MSFT");
    expect(msft).toHaveTextContent("$525.49");
    expect(msft).toHaveTextContent("-$7.46 (-1.40%)");

    // Not color alone: screen readers hear "Down"/"Up" (the arrow is
    // aria-hidden), and it is part of the link's accessible name.
    expect(msft).toHaveAccessibleName(/Down/);
    expect(screen.getByRole("link", { name: /TMUS/ })).toHaveAccessibleName(
      /Up/,
    );
  });

  it("shows an error", async () => {
    renderList({ error: new Error("Network down") });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load prices: Network down",
    );
  });

  it("shows an empty state when there are no quotes", async () => {
    renderList({ data: { latestQuotes: [] } });
    expect(await screen.findByText("No quotes yet.")).toBeInTheDocument();
  });
});
