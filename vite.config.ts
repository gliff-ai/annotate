import { defineConfig } from 'vite'
import { ViteAliases } from 'vite-aliases'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    hmr: false,
  },
  esbuild: {
    jsxInject: `import React from 'react'`
  },
  plugins: [ViteAliases()]
})

