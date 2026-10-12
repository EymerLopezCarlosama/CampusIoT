// PROMPT — repositories/metrics.repository.js — SQL de métricas
//
// porNodo(from, to) → por nodo: count(*) de lecturas, avg y max de extract(epoch from (fecha_recepcion - fecha_medicion)) filtrando fecha_medicion IS NOT NULL y retardo ≥ 0.
//
// Las columnas están en español (docs/base-de-datos/diccionario-de-datos.md): usar alias AS para devolver los nombres del contrato de la API (ej. mesas_ocupadas AS tables_occupied).
//
// Depende de: config/database.js
// Referencia: database/schema.sql (lectura, nodo)
