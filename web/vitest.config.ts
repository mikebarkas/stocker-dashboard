import { defaultServerConditions, mergeConfig } from "vite";
import { defineConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

// Resolve packages the way production does. graphql 17 publishes a separate
// build under the "development" export condition, which Vite turns on in
// test mode; our code and Apollo would load different copies of graphql
// (see api/vitest.config.ts for the bug this caused there).
const conditions = defaultServerConditions.filter(
  (c) => c !== "development|production",
);

export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: { conditions },
    ssr: { resolve: { conditions } },
    test: {
      // jsdom: a browser DOM implemented in Node, so components can render.
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
    },
  }),
);
