// PROMPT — validators/readings.validator.js — Validación (zod) de lecturas (HU-01)
//
// lecturaSchema: device_ts (entero positivo, opcional) · temperature (-40 a 80, nullable) · humidity (0-100, nullable) · noise_level (0-100) · radars (array de 1 a 3 con { id: string 1-4, present: boolean, target: "moving"|"static"|"both"|"none", distance_cm: entero 0-1200, energy: entero 0-100 }).
// Mensajes en español. Se aplica con middlewares/validate.js.
//
// Referencia: docs/api-contract.md ("Lecturas")
