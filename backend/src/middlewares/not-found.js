// Responde 404 con el JSON estándar cuando ninguna ruta atendió la petición.
export function notFound(req, res) {
  res.status(404).json({
    error: { codigo: "NO_ENCONTRADO", mensaje: "La ruta no existe." },
  });
}