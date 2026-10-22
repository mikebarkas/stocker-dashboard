import { lazy, Suspense } from "react";
import { Link, Route, Routes } from "react-router";
import { NotFound } from "./pages/NotFound";
import { SymbolList } from "./pages/SymbolList";

// Code splitting: the detail page (and Recharts, most of the JavaScript) is
// a separate file, downloaded the first time someone opens a symbol. The
// home page loads without it.
const SymbolDetail = lazy(() =>
  import("./pages/SymbolDetail").then((m) => ({ default: m.SymbolDetail })),
);

// Maps URLs to pages. The router changes pages without reloading: a <Link>
// updates the URL and React renders the matching <Route>.
export function App() {
  return (
    <>
      {/* First thing a keyboard user reaches: jump past the header. */}
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <Link className="site-title" to="/">
          Stocker
        </Link>
      </header>
      <main id="main" className="container">
        {/* Shown while a lazy page's code is downloading. */}
        <Suspense fallback={<p role="status">Loading…</p>}>
          <Routes>
            <Route path="/" element={<SymbolList />} />
            <Route path="/symbol/:symbol" element={<SymbolDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="site-footer container">
        Quotes from Finnhub, collected hourly during US market hours. Prices in
        USD; times in US Eastern (ET).
      </footer>
    </>
  );
}
