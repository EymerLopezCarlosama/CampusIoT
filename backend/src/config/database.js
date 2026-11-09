// Pool de conexiones a PostgreSQL y utilidades para consultar y probar la conexión.
import pg from "pg";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  // Supabase exige SSL; en Docker local DATABASE_SSL=false.
  ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : false,
});

// Sin este manejador, un error en una conexión inactiva tumbaría el proceso.
pool.on("error", (err) => {
  logger.error("Error en una conexión inactiva del pool:", err.message);
});

// Siempre con parámetros: query("SELECT * FROM espacio WHERE slug = $1", [slug])
export function query(texto, params) {
  return pool.query(texto, params);
}

export async function probarConexion() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (err) {
    logger.error("No se pudo conectar a la base de datos:", err.message || err.code);
    return false;
  }
}