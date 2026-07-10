import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    // The data-invariant suite imports the 10MB programs.ts — give it room.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
