// SQL de config_espacio y banda_mesa. Solo SQL con parámetros.
// Las escrituras reciben un `client` de pg para que el service las agrupe en una transacción.
import { query } from "../config/database.js";

// Devuelve { clave: valor }, por ejemplo { ventana_s: 45 }.
export async function obtenerConfig(spaceId) {
  const { rows } = await query(
    `SELECT clave, valor FROM config_espacio WHERE id_espacio = $1`,
    [spaceId]
  );
  return Object.fromEntries(rows.map((f) => [f.clave, f.valor]));
}

export async function upsertConfig(client, spaceId, clave, valor) {
  await client.query(
    `INSERT INTO config_espacio (id_espacio, clave, valor) VALUES ($1, $2, $3)
     ON CONFLICT (id_espacio, clave) DO UPDATE SET valor = EXCLUDED.valor`,
    [spaceId, clave, valor]
  );
}

export async function upsertBanda(client, zoneId, tableNo, minCm, maxCm) {
  await client.query(
    `INSERT INTO banda_mesa (id_zona, num_mesa, min_cm, max_cm) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id_zona, num_mesa) DO UPDATE SET min_cm = EXCLUDED.min_cm, max_cm = EXCLUDED.max_cm`,
    [zoneId, tableNo, minCm, maxCm]
  );
}