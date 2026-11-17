// SQL de lecturas y nodos (HU-01, HU-04, HU-12). Solo SQL con parámetros; las reglas viven en los services.
import { query } from "../config/database.js";

// Devuelve { id, space_id, name } o null si la clave no existe.
export async function obtenerNodoPorApiKey(clave) {
  const { rows } = await query(
    `SELECT id_nodo AS id, id_espacio AS space_id, nombre AS name
       FROM nodo WHERE clave_api = $1`,
    [clave]
  );
  return rows[0] ?? null;
}

// radars se guarda como JSONB: hay que pasarlo como texto, porque pg convertiría un array JS en un array de Postgres.
export async function insertar(lectura) {
  const { rows } = await query(
    `INSERT INTO lectura
       (id_nodo, fecha_medicion, temperatura, humedad, nivel_ruido, radares, mesas_ocupadas, estado)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
     RETURNING id_lectura::int AS id`,
    [
      lectura.nodeId,
      lectura.deviceTs ?? null,
      lectura.temperature ?? null,
      lectura.humidity ?? null,
      lectura.noiseLevel,
      JSON.stringify(lectura.radars),
      lectura.tablesOccupied ?? null,
      lectura.state,
    ]
  );
  return rows[0].id;
}

export async function actualizarUltimaVista(nodeId) {
  await query(`UPDATE nodo SET ultima_vista = now() WHERE id_nodo = $1`, [nodeId]);
}

const COLUMNAS_LECTURA = `
  id_lectura::int AS id, fecha_recepcion AS received_at, fecha_medicion AS measured_at,
  temperatura AS temperature, humedad AS humidity, nivel_ruido AS noise_level,
  radares AS radars, mesas_ocupadas AS tables_occupied, estado AS state`;

export async function ultimaPorNodo(nodeId) {
  const { rows } = await query(
    `SELECT ${COLUMNAS_LECTURA} FROM lectura
      WHERE id_nodo = $1 ORDER BY fecha_recepcion DESC LIMIT 1`,
    [nodeId]
  );
  return rows[0] ?? null;
}

export async function ultimasPorNodo(nodeId, limit) {
  const { rows } = await query(
    `SELECT ${COLUMNAS_LECTURA} FROM lectura
      WHERE id_nodo = $1 ORDER BY fecha_recepcion DESC LIMIT $2`,
    [nodeId, limit]
  );
  return rows;
}

// Lecturas de los últimos `segundos` del nodo, de la más vieja a la más nueva (ventana del estado).
export async function ventana(nodeId, segundos) {
  const { rows } = await query(
    `SELECT ${COLUMNAS_LECTURA} FROM lectura
      WHERE id_nodo = $1 AND fecha_recepcion >= now() - make_interval(secs => $2)
      ORDER BY fecha_recepcion ASC`,
    [nodeId, segundos]
  );
  return rows;
}

// Última lectura de cada radar (zona) del nodo. Con dos placas que comparten clave,
// el estado "sin_conexion" debe mirar cada radar y no solo el nodo.
export async function ultimaPorRadar(nodeId, segundos) {
  const { rows } = await query(
    `SELECT r->>'id' AS radar_id, max(l.fecha_recepcion) AS last_reading_at
       FROM lectura l, jsonb_array_elements(l.radares) AS r
      WHERE l.id_nodo = $1 AND l.fecha_recepcion >= now() - make_interval(secs => $2)
      GROUP BY r->>'id'`,
    [nodeId, segundos]
  );
  return rows;
}

// Para /salud: el cálculo de "online" lo hace la ruta con OFFLINE_AFTER_S.
export async function listarNodos() {
  const { rows } = await query(
    `SELECT nombre AS node, ultima_vista AS last_seen FROM nodo ORDER BY id_nodo`
  );
  return rows;
}