import { defaultServerConditions } from "vite";
import { defineConfig } from "vitest/config";

// Resolve packages the way production Node does. graphql 17 publishes a
// separate build under the "development" export condition, which Vite turns
// on in test mode. Our code would get that build while Yoga (loaded by Node)
// gets the normal one: two GraphQLError classes, so Yoga's instanceof check
// fails and our BAD_USER_INPUT errors get masked as "Unexpected error."
const conditions = defaultServerConditions.filter(
  (c) => c !== "development|production",
);

export default defineConfig({
  resolve: { conditions },
  ssr: { resolve: { conditions } },
  test: {
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    // Prepares the test database once before all tests (see compose.yaml).
    globalSetup: ["./test/global-setup.ts"],
  },
});
