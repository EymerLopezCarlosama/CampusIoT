// PROMPT — repositories/spaces.repository.js — SQL de espacios, zonas y bandas
//
// listarEspacios(), obtenerPorSlug(slug), zonasConBandas(spaceId) (zona JOIN banda_mesa), historialPorMinuto(spaceId, horas) (date_trunc('minute', fecha_recepcion), avg de temperatura/humedad/ruido, estado más frecuente con mode()).
// SOLO SQL con parámetros. Devuelve filas simples.
//
// Las columnas están en español (docs/base-de-datos/diccionario-de-datos.md): usar alias AS para devolver los nombres del contrato de la API (ej. mesas_ocupadas AS tables_occupied).
//
// Depende de: config/database.js
// Referencia: database/schema.sql (espacio, zona, banda_mesa, lectura)
