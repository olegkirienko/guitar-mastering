/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEPLOY_TARGET: "pages" | "worker";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
