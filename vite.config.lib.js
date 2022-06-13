"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vite_1 = require("vite");
var path = require("path");
var vite_aliases_1 = require("vite-aliases");
var vite_plugin_checker_1 = require("vite-plugin-checker");
// https://vitejs.dev/config/
exports.default = (0, vite_1.defineConfig)({
    build: {
        minify: false,
        lib: {
            entry: path.resolve(__dirname, "src/index.tsx"),
            name: "@gliff-ai/annotate",
            formats: ["es"],
            fileName: "index",
        },
        rollupOptions: {
            external: [
                "react",
                "react-dom",
                "react-router-dom",
                "@mui/material",
                "@mui/icons-material",
                "@mui/styles",
                "@mui/system",
                "@emotion/react",
                "@emotion/styled",
                "@gliff-ai/style",
                "@gliff-ai/upload",
            ],
            output: {
                minifyInternalExports: false,
                manualChunks: function (id) {
                    if (id.includes("evaluateBezier")) {
                        return "evaluateBezier";
                    }
                    return "main";
                },
                globals: {},
            },
        },
    },
    esbuild: {
        jsxInject: "import React from 'react'",
    },
    plugins: [(0, vite_aliases_1.ViteAliases)(), (0, vite_plugin_checker_1.default)({ typescript: true } /** TS options */)],
});
