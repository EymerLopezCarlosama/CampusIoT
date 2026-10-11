// PROMPT — controllers/spaces.controller.js — Espacios (HU-02 a HU-05)
//
// listar (200: estado actual de cada espacio), historial (200, hours por defecto 6, máximo 48), crudas (200, últimas N lecturas con radars).
// Sin SQL ni reglas de negocio: extrae params ya validados, llama a spaces.service y responde. Errores → next(err).
//
// Depende de: services/spaces.service.js
// Referencia: docs/api-contract.md ("Espacios")
