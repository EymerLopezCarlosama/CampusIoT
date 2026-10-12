// PROMPT — repositories/config.repository.js — SQL de config_espacio y banda_mesa
//
// obtenerConfig(spaceId) → objeto { clave: valor }, upsertConfig(client, spaceId, clave, valor), upsertBanda(client, zoneId, tableNo, minCm, maxCm). Las escrituras reciben un `client` de pg para que el service las agrupe en una transacción (BEGIN/COMMIT).
//
// Las columnas están en español (docs/base-de-datos/diccionario-de-datos.md): usar alias AS para devolver los nombres del contrato de la API (ej. mesas_ocupadas AS tables_occupied).
//
// Depende de: config/database.js
// Referencia: database/schema.sql (config_espacio, banda_mesa)
