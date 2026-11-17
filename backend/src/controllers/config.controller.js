// Calibración (HU-06): sin lógica, delega en config.service.
import * as configService from "../services/config.service.js";

export async function obtener(req, res, next) {
  try {
    res.json(await configService.obtener(req.params.slug));
  } catch (err) {
    next(err);
  }
}

export async function actualizar(req, res, next) {
  try {
    res.json(await configService.actualizar(req.params.slug, req.body));
  } catch (err) {
    next(err);
  }
}