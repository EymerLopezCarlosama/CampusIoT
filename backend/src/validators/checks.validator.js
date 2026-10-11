// PROMPT — validators/checks.validator.js — Validación (zod) de la verificación manual
//
// crearVerificacionSchema: space (slug) · day (1 o 2) · slot (texto 1-10, ej. "07:00") · manual_state ("libre"|"parcial"|"con_personas"|"lleno") · manual_tables_occupied (entero 0-7, opcional) · observer (texto ≤ 50, opcional).
// Regla extra: en "gastronomia" el estado "con_personas" no es válido (ahí se usa "parcial"); en "sotano" "parcial" no es válido.
//
// Referencia: docs/api-contract.md ("Verificación manual")
