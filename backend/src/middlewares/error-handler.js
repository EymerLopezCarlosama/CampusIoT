// Error estándar de la API: clase AppError y middleware que responde { error: { codigo, mensaje } }.
import { ZodError } from "zod";
import { logger } from "../utils/logger.js";

export class AppError extends Error {
  constructor(status, codigo, mensaje) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
  }
}

function responder(res, status, codigo, mensaje) {
  return res.status(status).json({ error: { codigo, mensaje } });
}

// Los 4 parámetros son obligatorios: así Express lo reconoce como manejador de errores.
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return responder(res, err.status, err.codigo, err.message);
  }

  if (err instanceof ZodError) {
    const primero = err.issues[0];
    const campo = primero.path.join(".");
    const mensaje = campo ? `${campo}: ${primero.message}` : primero.message;
    return responder(res, 400, "DATOS_INVALIDOS", mensaje);
  }

  // JSON mal formado: lo lanza express.json() antes de llegar a las rutas.
  if (err?.type === "entity.parse.failed") {
    return responder(res, 400, "DATOS_INVALIDOS", "El cuerpo de la petición no es un JSON válido.");
  }

  // Violación de UNIQUE en PostgreSQL (los services pueden capturarlo antes con un código más específico).
  if (err?.code === "23505") {
    return responder(res, 409, "CONFLICTO", "El registro ya existe.");
  }

  logger.error("Error no controlado:", err);
  return responder(res, 500, "ERROR_INTERNO", "Error interno del servidor.");
}