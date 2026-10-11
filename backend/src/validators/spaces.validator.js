// PROMPT — validators/spaces.validator.js — Validación (zod) de espacios y métricas
//
// slugParamSchema (letras minúsculas y números, 1-30), historialQuerySchema (hours: z.coerce.number() entero 1-48, def. 6), crudasQuerySchema (limit entero 1-500, def. 60), rangoFechasQuerySchema (from/to: fechas ISO opcionales; to > from).
//
// Referencia: docs/api-contract.md ("Espacios", "Métricas")
