// SQL de métricas por nodo (HU-09). Solo SQL con parámetros; alias al contrato de la API.
import { query } from "../config/database.js";

// Por nodo: zonas (placas), lecturas recibidas contadas por radar y retardo medio y máximo
// (fecha_recepcion - fecha_medicion, solo lecturas con fecha_medicion y retardo >= 0).
export async function porNodo(from, to) {
  const { rows } = await query(
    `SELECT n.nombre AS node,
            (SELECT count(*) FROM zona z WHERE z.id_nodo = n.id_nodo)::int AS zones,
            (SELECT count(*)
               FROM lectura l CROSS JOIN LATERAL jsonb_array_elements(l.radares)
              WHERE l.id_nodo = n.id_nodo
                AND l.fecha_recepcion >= $1 AND l.fecha_recepcion <= $2)::int AS received,
            (SELECT round(avg(extract(epoch FROM (l.fecha_recepcion - l.fecha_medicion)))::numeric, 1)::float8
               FROM lectura l
              WHERE l.id_nodo = n.id_nodo
                AND l.fecha_recepcion >= $1 AND l.fecha_recepcion <= $2
                AND l.fecha_medicion IS NOT NULL
                AND l.fecha_recepcion >= l.fecha_medicion) AS avg_delay_s,
            (SELECT round(max(extract(epoch FROM (l.fecha_recepcion - l.fecha_medicion)))::numeric, 1)::float8
               FROM lectura l
              WHERE l.id_nodo = n.id_nodo
                AND l.fecha_recepcion >= $1 AND l.fecha_recepcion <= $2
                AND l.fecha_medicion IS NOT NULL
                AND l.fecha_recepcion >= l.fecha_medicion) AS max_delay_s
       FROM nodo n
      ORDER BY n.id_nodo`,
    [from, to]
  );
  return rows;
}