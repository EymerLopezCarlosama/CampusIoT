// PROMPT — services/spaces.service.js — Estado actual e historial (HU-02 a HU-05)
//
// estadoActual(slug): estado de UN espacio = última lectura de su nodo + status.estadoConConexion con env.OFFLINE_AFTER_S. Si nunca hubo lecturas → "sin_conexion" con valores en null. Slug inexistente → AppError(404). Lo usa también checks.service.
// listar(): estadoActual de cada espacio, con la forma del contrato (GET /spaces).
// historial(slug, hours): promedio por minuto de temperatura, humedad y ruido, y estado más frecuente del minuto (máx. 48 h). Slug inexistente → AppError(404).
// crudas(slug, limit): últimas N lecturas con radars (para calibración).
//
// Depende de: repositories/spaces.repository.js, repositories/readings.repository.js, services/status.service.js, config/env.js
// Referencia: docs/api-contract.md ("Espacios")
