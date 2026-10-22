import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    // The dev server forwards /graphql to the API (npm run dev -w api), so
    // the browser sees one origin: no CORS in development, same URL as in
    // production behind Caddy.
    proxy: {
      "/graphql": "http://localhost:4000",
    },
  },
});
