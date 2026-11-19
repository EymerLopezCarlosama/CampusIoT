// Pruebas de integración (necesitan PostgreSQL local). Se corren con `npm run test:integration`.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.js"],
    fileParallelism: false, // comparten la misma base de datos
    testTimeout: 15000,
  },
});