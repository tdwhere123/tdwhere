import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'plugin-inspect-react-code'

// https://vite.dev/config/
// Production base matches the GitHub Pages project URL:
// https://tdwhere123.github.io/tdwhere/
export default defineConfig(({ command, isPreview }) => {
  const isDevServe = command === "serve" && isPreview !== true
  return {
    // Preview must keep the production base so /tdwhere/assets/* resolve.
    base: isDevServe ? "/" : "/tdwhere/",
    plugins: [
      ...(isDevServe ? [inspectAttr()] : []),
      react(),
    ],
    server: {
      port: 3000,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return
            if (id.includes("framer-motion")) return "framer-motion"
          },
        },
      },
    },
  }
});
