// Runs before every test file.
import "@testing-library/jest-dom/vitest"; // matchers like toBeInTheDocument
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount what each test rendered, so tests don't see each other's DOM.
afterEach(() => {
  cleanup();
});

// jsdom has no layout engine and no ResizeObserver. Recharts' responsive
// charts use it to measure their container; a no-op stub lets them render
// (at 0x0). Tests check the chart through its text summary instead.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??=
  ResizeObserverStub as unknown as typeof ResizeObserver;
