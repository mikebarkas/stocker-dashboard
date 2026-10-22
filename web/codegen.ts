// Generates TypeScript types for the web app's queries from the API's schema
// (the same schema.graphql the server uses) and the .graphql files in src/.
// Run `npm run codegen -w web` after changing a query or the schema.
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "../api/src/schema.graphql",
  documents: ["src/**/*.graphql"],
  generates: {
    // For each query, e.g. SymbolDetail: SymbolDetailDocument (the query,
    // typed), SymbolDetailQuery (result type), SymbolDetailQueryVariables.
    "src/gql/": {
      preset: "client",
      presetConfig: { fragmentMasking: false },
      config: { useTypeImports: true },
    },
  },
};

export default config;
