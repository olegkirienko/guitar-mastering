/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEPLOY_TARGET: "pages" | "railway";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
