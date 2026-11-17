// Verificación manual (HU-07, HU-08): sin SQL ni reglas, delega en checks.service.
import * as checksService from "../services/checks.service.js";

export async function crear(req, res, next) {
  try {
    res.status(201).json(await checksService.registrar(req.body));
  } catch (err) {
    next(err);
  }
}

export async function listar(req, res, next) {
  try {
    res.json(await checksService.listar());
  } catch (err) {
    next(err);
  }
}

export async function resumen(req, res, next) {
  try {
    res.json(await checksService.resumen());
  } catch (err) {
    next(err);
  }
}

export async function exportarCsv(req, res, next) {
  try {
    const csv = await checksService.exportarCsv();
    res.set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="verificacion.csv"',
    });
    res.send(csv);
  } catch (err) {
    next(err);
  }
}