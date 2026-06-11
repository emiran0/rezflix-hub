import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const root = dirname(fileURLToPath(import.meta.url))

// Unit/component tests (jsdom). Playwright e2e lives in ./e2e and is excluded here.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror the tsconfig `@/*` -> repo-root alias. Regex so it never swallows
    // scoped packages like `@testing-library/react`.
    alias: [{ find: /^@\//, replacement: `${root}/` }],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "dist", "e2e"],
  },
})
