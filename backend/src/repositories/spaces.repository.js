// SQL de espacios, zonas y bandas. Solo SQL con parámetros; devuelve filas simples.
// Por ahora solo lo que usa B6; historialPorMinuto llega en B8.
import { query } from "../config/database.js";

const COLUMNAS_ESPACIO = `
  id_espacio AS id, slug, nombre AS name, modo AS mode, total_mesas AS total_tables`;

export async function listarEspacios() {
  const { rows } = await query(`SELECT ${COLUMNAS_ESPACIO} FROM espacio ORDER BY id_espacio`);
  return rows;
}

export async function obtenerPorSlug(slug) {
  const { rows } = await query(`SELECT ${COLUMNAS_ESPACIO} FROM espacio WHERE slug = $1`, [slug]);
  return rows[0] ?? null;
}

export async function obtenerPorId(id) {
  const { rows } = await query(`SELECT ${COLUMNAS_ESPACIO} FROM espacio WHERE id_espacio = $1`, [id]);
  return rows[0] ?? null;
}

// Zonas del espacio con sus bandas por mesa: [{ node_id, code, tables: [{ table_no, min_cm, max_cm }] }].
// En el Sótano las zonas no tienen bandas (tables queda vacío).
export async function zonasConBandas(spaceId) {
  const { rows } = await query(
    `SELECT z.id_nodo AS node_id, z.codigo AS code,
            b.num_mesa AS table_no, b.min_cm, b.max_cm
       FROM zona z
       LEFT JOIN banda_mesa b ON b.id_zona = z.id_zona
      WHERE z.id_espacio = $1
      ORDER BY z.codigo, b.num_mesa`,
    [spaceId]
  );
  const zonas = new Map();
  for (const f of rows) {
    const clave = `${f.node_id}:${f.code}`;
    if (!zonas.has(clave)) zonas.set(clave, { node_id: f.node_id, code: f.code, tables: [] });
    if (f.table_no !== null) {
      zonas.get(clave).tables.push({ table_no: f.table_no, min_cm: f.min_cm, max_cm: f.max_cm });
    }
  }
  return [...zonas.values()];
}