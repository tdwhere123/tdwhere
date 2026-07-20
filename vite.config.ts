import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'plugin-inspect-react-code'

// https://vite.dev/config/
// Production base matches the GitHub Pages project URL:
// https://tdwhere123.github.io/tdwhere/
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/tdwhere/" : "/",
  plugins: [inspectAttr(), react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
