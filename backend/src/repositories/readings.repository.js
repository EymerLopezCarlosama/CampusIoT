// PROMPT — repositories/readings.repository.js — SQL de lecturas y nodos (HU-01, HU-04, HU-12)
//
// obtenerNodoPorApiKey(clave), insertar(lectura) (con state y tables_occupied), actualizarUltimaVista(nodeId), ultimaPorNodo(nodeId), ultimasPorNodo(nodeId, limit), ventana(nodeId, segundos) (para el índice del Sótano), listarNodos() (para /salud).
// SOLO SQL con parámetros ($1, $2...) usando el pool de pg. Nunca concatenar texto del usuario en el SQL.
//
// Las columnas están en español (docs/base-de-datos/diccionario-de-datos.md): usar alias AS para devolver los nombres del contrato de la API (ej. mesas_ocupadas AS tables_occupied).
//
// Depende de: config/database.js
// Referencia: database/schema.sql (lectura, nodo)
