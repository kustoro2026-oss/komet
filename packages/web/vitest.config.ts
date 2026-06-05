import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@komet/shared": path.resolve(__dirname, "../shared/src"),
      "@komet/zernio-client": path.resolve(__dirname, "../zernio-client/src"),
      "@komet/auth": path.resolve(__dirname, "../auth/src"),
      "@komet/db": path.resolve(__dirname, "../db/src"),
    },
  },
});
