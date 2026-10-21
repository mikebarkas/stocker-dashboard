// Generates TypeScript types for the resolvers from schema.graphql.
// Run `npm run codegen -w api` after changing the schema.
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "src/schema.graphql",
  generates: {
    "src/generated/graphql.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        useTypeImports: true,
        // The third argument every resolver receives (see src/context.ts).
        contextType: "../context.ts#Context",
      },
    },
  },
};

export default config;
