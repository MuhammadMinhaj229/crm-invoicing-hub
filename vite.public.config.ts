import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const repositoryRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: resolve(repositoryRoot, "apps/public"),
  envDir: repositoryRoot,
  publicDir: resolve(repositoryRoot, "public"),
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths({ projects: [resolve(repositoryRoot, "tsconfig.json")] }),
  ],
  resolve: {
    alias: {
      "@": resolve(repositoryRoot, "src"),
    },
  },
  server: {
    fs: { allow: [repositoryRoot] },
  },
  build: {
    outDir: resolve(repositoryRoot, "apps/public/dist"),
    emptyOutDir: true,
  },
});
