// Types for import.meta.env. Vite exposes only VITE_* variables to the app,
// and bakes their values into the bundle at build time.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
