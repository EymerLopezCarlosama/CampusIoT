// PROMPT — routes/index.js
//
// Router raíz (montado en /api). Montar: readings, spaces, config (calibración), checks (incluye /manual-checks y /validation/*), metrics.
// Definir aquí GET /salud → { backend: "ok", base_datos: "ok"|"error", nodos: [{ node, last_seen, online }] } (usa probarConexion y readings.repository). Debe responder aunque la BD esté caída (base_datos: "error").
// Referencia: docs/api-contract.md ("Utilidades")
// Hecho cuando: /api/salud muestra el estado real de la BD y de cada nodo.
