import { defineConfig } from 'vite'
import { ViteAliases } from 'vite-aliases'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: parseInt(process.env.PORT) || 3000,
    hmr: {
      port: process.env.PORT || process.env.CODESPACES ? 443 : 3000
    }
  },
  esbuild: {
    jsxInject: `import React from 'react'`
  },
  plugins: [ViteAliases()],
  publicDir: "examples/samples",
})

