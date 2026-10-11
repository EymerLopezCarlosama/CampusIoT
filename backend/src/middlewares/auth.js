// PROMPT — middlewares/auth.js
//
// Exportar dos middlewares:
//  - `autenticarNodo`: lee el header x-api-key, busca el nodo en la BD (repositories/readings.repository.js · obtenerNodoPorApiKey) y deja req.nodo = { id, space_id, name }. Sin clave o clave desconocida → AppError(401, "API_KEY_INVALIDA", ...).
//  - `autenticarAdmin`: compara el header x-admin-key con env.ADMIN_KEY (comparación en tiempo constante, crypto.timingSafeEqual). Falla → 401 ADMIN_KEY_INVALIDA.
//
// Depende de: middlewares/error-handler.js (AppError), config/env.js, repositories/readings.repository.js
// Hecho cuando: POST /api/readings sin clave devuelve 401 y con la clave del seed (dev-key-gastronomia) pasa.
