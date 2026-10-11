// PROMPT — services/checks.service.js — Verificación manual (HU-07, HU-08)
//
// registrar(datos): obtener el estado ACTUAL del espacio (spaces.service, que ya aplica "sin_conexion"), guardar manual_state, system_state y match = (manual_state === system_state). Franja repetida (mismo espacio + día + franja) → AppError(409, "FRANJA_DUPLICADA"). Espacio inexistente → 404.
// listar(): todas las verificaciones.
// resumen(): { total: 40, registered, matches, coincidence_pct, goal_pct: 80, goal_met } con coincidence_pct = matches / 40 × 100 redondeado a 1 decimal (siempre sobre 40, no sobre lo registrado).
// exportarCsv(): texto CSV con columnas space, day, slot, manual_state, system_state, match, observer, created_at (escapar comas y comillas).
//
// Depende de: repositories/checks.repository.js, services/spaces.service.js
// Referencia: docs/api-contract.md ("Verificación manual") · docs/pruebas/protocolo-jornada-prueba.md
