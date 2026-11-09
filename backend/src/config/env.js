// Carga el .env de la raíz del repo y lo valida con zod. Exporta `env` ya tipado.
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// z.coerce.boolean() tomaría "false" como true, por eso se compara el texto.
const booleano = z
  .enum(["true", "false"])
  .default("false")
  .transform((valor) => valor === "true");

const esquema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "es obligatoria"),
  DATABASE_SSL: booleano,
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  OFFLINE_AFTER_S: z.coerce.number().positive().default(30),
  EXPECTED_INTERVAL_S: z.coerce.number().positive().default(3),
  ADMIN_KEY: z.string().min(1, "es obligatoria"),
});

const resultado = esquema.safeParse(process.env);

if (!resultado.success) {
  console.error("Configuración inválida en .env:");
  for (const problema of resultado.error.issues) {
    console.error(`  - ${problema.path.join(".")}: ${problema.message}`);
  }
  process.exit(1);
}

export const env = resultado.data;