// PROMPT — repositories/metrics.repository.js — SQL de métricas
//
// porNodo(from, to) → por nodo: count(*) de lecturas, avg y max de extract(epoch from (received_at - device_ts)) filtrando device_ts IS NOT NULL y retardo ≥ 0.
//
// Depende de: config/database.js
// Referencia: database/schema.sql (readings, nodes)
