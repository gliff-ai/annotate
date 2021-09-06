import { defineConfig } from "vite";
import { ViteAliases } from "vite-aliases";
import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: parseInt(process.env.PORT) || 3000,
    hmr: {
      port: process.env.PORT || process.env.CODESPACES ? 443 : 3000,
    },
  },
  esbuild: {
    jsxInject: `import React from 'react'`,
  },
  plugins: [ViteAliases(), checker({ typescript: true } /** TS options */)],
  publicDir: "examples/samples",
});
