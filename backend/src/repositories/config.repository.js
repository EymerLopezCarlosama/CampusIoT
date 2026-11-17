// SQL de config_espacio y banda_mesa. Por ahora solo la lectura; las escrituras con transacción llegan en B9.
import { query } from "../config/database.js";

// Devuelve { clave: valor }, por ejemplo { ventana_s: 45 }.
export async function obtenerConfig(spaceId) {
  const { rows } = await query(
    `SELECT clave, valor FROM config_espacio WHERE id_espacio = $1`,
    [spaceId]
  );
  return Object.fromEntries(rows.map((f) => [f.clave, f.valor]));
}