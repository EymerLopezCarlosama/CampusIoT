// PROMPT — services/metrics.service.js — Disponibilidad y retardo (HU-09, OE2)
//
// obtener(from, to): por cada nodo → expected = floor((to - from) en segundos / env.EXPECTED_INTERVAL_S); received = lecturas en el rango; availability_pct = min(100, received / expected × 100) a 1 decimal; avg_delay_s y max_delay_s = fecha_recepcion − fecha_medicion (solo lecturas con device_ts y con retardo ≥ 0). Devolver también goal: { availability_pct: 90, max_delay_s: 10 }.
// Rango inválido (to ≤ from) → AppError(400, "DATOS_INVALIDOS").
//
// Depende de: repositories/metrics.repository.js, config/env.js
// Referencia: docs/api-contract.md ("Métricas") · indicador OE2 (Tabla 7 del documento)
