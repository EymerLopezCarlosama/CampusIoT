// PROMPT — controllers/readings.controller.js — Lecturas (HU-01)
//
// crear (req,res,next): toma req.nodo y req.body ya validados, llama a readings.service.registrar y responde 201 { id, state, tables_occupied }. Errores → next(err).
// Sin SQL ni reglas de negocio.
//
// Depende de: services/readings.service.js
// Referencia: docs/api-contract.md ("Lecturas")
