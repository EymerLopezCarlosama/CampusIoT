// Autenticación: clave del nodo (x-api-key) y clave de administración (x-admin-key).
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "./error-handler.js";
import { obtenerNodoPorApiKey } from "../repositories/readings.repository.js";

// Deja req.nodo = { id, space_id, name }. Sin clave o clave desconocida → 401.
export async function autenticarNodo(req, res, next) {
  try {
    const clave = req.get("x-api-key");
    const nodo = clave ? await obtenerNodoPorApiKey(clave) : null;
    if (!nodo) {
      throw new AppError(401, "API_KEY_INVALIDA", "La clave del nodo no es válida.");
    }
    req.nodo = nodo;
    next();
  } catch (err) {
    next(err);
  }
}

// Comparación en tiempo constante. timingSafeEqual lanza error si los largos difieren,
// por eso se compara primero el largo.
export function autenticarAdmin(req, res, next) {
  const enviada = Buffer.from(req.get("x-admin-key") ?? "");
  const esperada = Buffer.from(env.ADMIN_KEY);
  const valida = enviada.length === esperada.length && crypto.timingSafeEqual(enviada, esperada);
  if (!valida) {
    return next(new AppError(401, "ADMIN_KEY_INVALIDA", "La clave de administración no es válida."));
  }
  next();
}