// PROMPT — validators/config.validator.js — Validación (zod) de la calibración
//
// actualizarConfigSchema: config (objeto de claves permitidas → número: umbral_personas, umbral_lleno, ventana_s; opcional) · zone_tables (array de { zone: string, table_no: entero ≥ 1, min_cm: entero ≥ 0, max_cm: entero > min_cm }; opcional). Al menos uno de los dos. Claves desconocidas → error.
//
// Referencia: docs/api-contract.md ("Calibración")
