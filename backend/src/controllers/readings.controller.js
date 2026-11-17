// Lecturas (HU-01): sin SQL ni reglas de negocio, delega en readings.service.
import * as readingsService from "../services/readings.service.js";

export async function crear(req, res, next) {
  try {
    const resultado = await readingsService.registrar(req.nodo, req.body);
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}