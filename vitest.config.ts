/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true, // Enables global `expect`
    environment: "jsdom",
    setupFiles: "./src/__tests__/setupTests.ts", // Ensures Jest matchers are loaded
  },
});
