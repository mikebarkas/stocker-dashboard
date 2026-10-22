// Test helpers: render a page with a mocked Apollo client and a router.
import type { TypedDocumentNode } from "@apollo/client";
import type { MockLink } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing/react";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";

type MockedResponse = MockLink.MockedResponse;

/**
 * A mocked response for one query and exact variables. Typed from the
 * generated document, so mock data that doesn't match the query (a
 * missing field, a wrong type) fails `tsc`, like a real component would.
 */
export function mock<
  TData extends Record<string, unknown>,
  TVariables extends Record<string, unknown>,
>(
  query: TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  response: { data: TData } | { error: Error },
): MockedResponse {
  return "data" in response
    ? { request: { query, variables }, result: { data: response.data } }
    : { request: { query, variables }, error: response.error };
}

interface RenderOptions {
  mocks: MockedResponse[];
  // The URL to start at, e.g. "/symbol/MSFT?range=1w".
  route?: string;
  // The route pattern the page is mounted at, e.g. "/symbol/:symbol".
  path?: string;
}

/**
 * Render `page` the way the app does: inside Apollo (mocked: no network)
 * and a router (in memory: no browser URL). Also renders the current
 * location as text, so tests can check what the URL changed to.
 */
export function renderPage(
  page: ReactElement,
  { mocks, route = "/", path = "/" }: RenderOptions,
) {
  return render(
    <MockedProvider mocks={mocks}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={page} />
        </Routes>
        <CurrentLocation />
      </MemoryRouter>
    </MockedProvider>,
  );
}

function CurrentLocation() {
  const location = useLocation();
  // A plain div: an <output> element would have the implicit ARIA role
  // "status" and be mistaken for the page's loading message.
  return (
    <div data-testid="current-location">
      {location.pathname + location.search}
    </div>
  );
}
