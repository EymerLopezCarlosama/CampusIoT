// SQL de verificacion_manual. Solo SQL con parámetros.
// insertar() NO captura el error 23505 (franja repetida): sube al service, que lo convierte en 409.
import { query } from "../config/database.js";

export async function insertar(check) {
  const { rows } = await query(
    `INSERT INTO verificacion_manual
       (id_espacio, dia, franja, estado_manual, mesas_manual, estado_sistema, coincide, observador)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id_verificacion::int AS id`,
    [
      check.spaceId,
      check.day,
      check.slot,
      check.manualState,
      check.manualTables ?? null,
      check.systemState,
      check.match,
      check.observer ?? null,
    ]
  );
  return rows[0].id;
}

export async function listar() {
  const { rows } = await query(
    `SELECT v.id_verificacion::int AS id, e.slug AS space, v.dia AS day, v.franja AS slot,
            v.estado_manual AS manual_state, v.mesas_manual AS manual_tables_occupied,
            v.estado_sistema AS system_state, v.coincide AS match,
            v.observador AS observer, v.fecha_registro AS created_at
       FROM verificacion_manual v
       JOIN espacio e ON e.id_espacio = v.id_espacio
      ORDER BY v.id_verificacion`
  );
  return rows;
}

export async function contarCoincidencias() {
  const { rows } = await query(
    `SELECT count(*)::int AS registered,
            (count(*) FILTER (WHERE coincide))::int AS matches
       FROM verificacion_manual`
  );
  return rows[0];
}