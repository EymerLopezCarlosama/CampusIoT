// Configuración de vitest: `npm test` corre solo las pruebas unitarias (sin BD, aptas para el CI).
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tests/unit/**/*.test.js"] },
});