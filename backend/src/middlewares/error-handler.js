// PROMPT — middlewares/error-handler.js
//
// 1) Definir y exportar la clase `AppError extends Error` con (status, codigo, mensaje).
// 2) Middleware de 4 parámetros (err, req, res, next) que responde SIEMPRE { error: { codigo, mensaje } }.
// Mapeo: AppError → su status/codigo · ZodError → 400 DATOS_INVALIDOS (mensaje con el primer problema) · error de pg con code 23505 (unique) → 409 · cualquier otro → 500 ERROR_INTERNO (sin exponer el stack; registrarlo con logger.error).
// Referencia: docs/api-contract.md ("Error estándar")
// Hecho cuando: un throw new AppError(409, "FRANJA_DUPLICADA", "...") dentro de un service llega al cliente como 409 con ese JSON.
