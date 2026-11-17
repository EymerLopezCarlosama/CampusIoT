// Métricas (HU-09): sin lógica, delega en metrics.service.
import * as metricsService from "../services/metrics.service.js";

export async function obtener(req, res, next) {
  try {
    res.json(await metricsService.obtener(req.query.from, req.query.to));
  } catch (err) {
    next(err);
  }
}