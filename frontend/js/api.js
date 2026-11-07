export const POLL_MS = 3000;

export class ErrorApi extends Error {
  constructor(status, codigo, mensaje) {
    super(mensaje);
    this.name = "ErrorApi";
    this.status = status;
    this.codigo = codigo;
  }
}

export async function api(ruta, opciones = {}) {
  const headers = new Headers(opciones.headers);
  let body = opciones.body;

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    if (typeof body !== "string") body = JSON.stringify(body);
  }

  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, { ...opciones, headers, body });
  } catch {
    throw new ErrorApi(0, "RED_NO_DISPONIBLE", "No se pudo conectar con el servidor.");
  }

  let datos;
  try {
    datos = await respuesta.json();
  } catch {
    if (respuesta.ok) {
      throw new ErrorApi(respuesta.status, "RESPUESTA_INVALIDA", "El servidor devolvió una respuesta inválida.");
    }
    throw new ErrorApi(respuesta.status, "ERROR_HTTP", `Error del servidor (${respuesta.status}).`);
  }

  if (!respuesta.ok) {
    const error = datos?.error;
    throw new ErrorApi(
      respuesta.status,
      error?.codigo ?? "ERROR_HTTP",
      error?.mensaje ?? `Error del servidor (${respuesta.status}).`,
    );
  }

  return datos;
}
