// PROMPT — repositories/spaces.repository.js — SQL de espacios, zonas y bandas
//
// listarEspacios(), obtenerPorSlug(slug), zonasConBandas(spaceId) (zones JOIN zone_tables), historialPorMinuto(spaceId, horas) (date_trunc('minute', received_at), avg de temperatura/humedad/ruido, estado más frecuente con mode()).
// SOLO SQL con parámetros. Devuelve filas simples.
//
// Depende de: config/database.js
// Referencia: database/schema.sql (spaces, zones, zone_tables, readings)
