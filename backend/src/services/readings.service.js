// PROMPT — services/readings.service.js — Registrar lecturas (HU-01)
//
// registrar(nodo, lectura): 1) cargar zonas, bandas y config del espacio del nodo; 2) validar que cada radars[].id exista en las zonas del nodo, si no AppError(400, "RADAR_DESCONOCIDO"); 3) en modo "espacio" cargar las lecturas de la ventana (config.ventana_s); 4) status.service.calcularEstado; 5) insertar la lectura con state y tables_occupied; 6) actualizar nodo.ultima_vista. Devolver { id, state, tables_occupied }.
// device_ts llega en milisegundos: convertir a fecha; si viene absurdo (más de 1 día de diferencia con la hora del servidor) guardarlo en NULL.
//
// Depende de: repositories/readings.repository.js, repositories/spaces.repository.js, repositories/config.repository.js, services/status.service.js
// Referencia: docs/api-contract.md ("Lecturas")
