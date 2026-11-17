// Espacios (HU-02 a HU-05): sin SQL ni reglas de negocio, delega en spaces.service.
import * as spacesService from "../services/spaces.service.js";

export async function listar(req, res, next) {
  try {
    res.json(await spacesService.listar());
  } catch (err) {
    next(err);
  }
}

export async function historial(req, res, next) {
  try {
    res.json(await spacesService.historial(req.params.slug, req.query.hours));
  } catch (err) {
    next(err);
  }
}

export async function crudas(req, res, next) {
  try {
    res.json(await spacesService.crudas(req.params.slug, req.query.limit));
  } catch (err) {
    next(err);
  }
}