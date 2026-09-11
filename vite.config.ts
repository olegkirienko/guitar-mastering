import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { createDeploymentConfig } from "./build/deployment-target";

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  const deployment = createDeploymentConfig(environment.VITE_DEPLOY_TARGET);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    base: deployment.base,
    define: {
      "import.meta.env.VITE_DEPLOY_TARGET": JSON.stringify(deployment.target),
    },
  };
});
