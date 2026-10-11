// PROMPT — repositories/config.repository.js — SQL de space_config y zone_tables
//
// obtenerConfig(spaceId) → objeto { clave: valor }, upsertConfig(client, spaceId, clave, valor), upsertBanda(client, zoneId, tableNo, minCm, maxCm). Las escrituras reciben un `client` de pg para que el service las agrupe en una transacción (BEGIN/COMMIT).
//
// Depende de: config/database.js
// Referencia: database/schema.sql (space_config, zone_tables)
