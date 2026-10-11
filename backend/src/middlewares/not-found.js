// PROMPT — middlewares/not-found.js
//
// Para rutas /api que no existen responder 404 { error: { codigo: "NO_ENCONTRADO", mensaje } }. (Las rutas que no empiezan por /api ya las atendió express.static.)
// Hecho cuando: GET /api/loquesea devuelve 404 con el JSON estándar.
