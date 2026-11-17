// Disponibilidad y retardo por nodo (HU-09, OE2).
import { env } from "../config/env.js";
import { AppError } from "../middlewares/error-handler.js";
import * as metricsRepo from "../repositories/metrics.repository.js";

const META = { availability_pct: 90, max_delay_s: 10 };
const RANGO_POR_DEFECTO_MS = 12 * 60 * 60 * 1000; // últimas 12 h

export async function obtener(from, to) {
  const fin = to ?? new Date();
  const inicio = from ?? new Date(fin.getTime() - RANGO_POR_DEFECTO_MS);
  if (!(fin > inicio)) {
    throw new AppError(400, "DATOS_INVALIDOS", "to debe ser posterior a from.");
  }

  const segundos = (fin.getTime() - inicio.getTime()) / 1000;
  const porZona = Math.floor(segundos / env.EXPECTED_INTERVAL_S);

  const filas = await metricsRepo.porNodo(inicio, fin);
  const nodes = filas.map((f) => {
    // Cada placa (zona) debe enviar una lectura por intervalo.
    const expected = porZona * f.zones;
    const pct = expected > 0 ? Math.min(100, (f.received / expected) * 100) : 0;
    return {
      node: f.node,
      expected,
      received: f.received,
      availability_pct: Math.round(pct * 10) / 10,
      avg_delay_s: f.avg_delay_s,
      max_delay_s: f.max_delay_s,
    };
  });

  return { nodes, goal: META };
}