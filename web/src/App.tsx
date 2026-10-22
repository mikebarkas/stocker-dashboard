import { Link, Route, Routes } from "react-router";
import { NotFound } from "./pages/NotFound";
import { SymbolDetail } from "./pages/SymbolDetail";
import { SymbolList } from "./pages/SymbolList";

// Maps URLs to pages. The router changes pages without reloading: a <Link>
// updates the URL and React renders the matching <Route>.
export function App() {
  return (
    <>
      <header>
        <Link to="/">Stocker</Link>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<SymbolList />} />
          <Route path="/symbol/:symbol" element={<SymbolDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
