import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE ?? "./",
  plugins: [react()],
  build: {
    target: "es2020",
    assetsInlineLimit: 0,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
