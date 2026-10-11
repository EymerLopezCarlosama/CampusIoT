// PROMPT — routes/spaces.routes.js — Rutas de espacios (HU-02 a HU-05)
//
// Router de /spaces con: GET / · GET /:slug/history?hours= · GET /:slug/raw?limit= (esta última protegida con autenticarAdmin).
// Cada ruta: validate(...) → controller. Solo define rutas.
//
// Depende de: validators/spaces.validator.js, controllers/spaces.controller.js, middlewares/auth.js
// Referencia: docs/api-contract.md ("Espacios", "Calibración")
