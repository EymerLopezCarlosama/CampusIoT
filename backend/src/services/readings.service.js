// Registrar lecturas (HU-01): valida los radares del nodo, calcula el estado y guarda.
import { AppError } from "../middlewares/error-handler.js";
import * as readingsRepo from "../repositories/readings.repository.js";
import * as spacesRepo from "../repositories/spaces.repository.js";
import * as configRepo from "../repositories/config.repository.js";
import { calcularEstado } from "./status.service.js";

const MAX_DESFASE_MS = 24 * 60 * 60 * 1000; // device_ts a más de 1 día de la hora del servidor se descarta

function fechaMedicion(deviceTs, ahoraMs) {
  if (deviceTs == null) return null;
  if (Math.abs(deviceTs - ahoraMs) > MAX_DESFASE_MS) return null;
  return new Date(deviceTs);
}

export async function registrar(nodo, lectura) {
  const espacio = await spacesRepo.obtenerPorId(nodo.space_id);
  const zonas = await spacesRepo.zonasConBandas(nodo.space_id);
  const config = await configRepo.obtenerConfig(nodo.space_id);

  if (config.ventana_s == null) {
    throw new AppError(500, "CONFIG_INCOMPLETA", "Falta ventana_s en config_espacio.");
  }

  // Cada clave solo acepta los radares de las zonas de su propio nodo.
  const radaresDelNodo = new Set(zonas.filter((z) => z.node_id === nodo.id).map((z) => z.code));
  const desconocido = lectura.radars.find((r) => !radaresDelNodo.has(r.id));
  if (desconocido) {
    throw new AppError(400, "RADAR_DESCONOCIDO", `El radar "${desconocido.id}" no pertenece a este nodo.`);
  }

  const ahoraMs = Date.now();

  // Ventana en AMBOS modos, con la lectura actual al final (todavía no está en la BD).
  // Si dos placas comparten clave, sus lecturas caen en la misma ventana y se combinan.
  const previas = await readingsRepo.ventana(nodo.id, config.ventana_s);
  const actual = { radars: lectura.radars, received_at: new Date(ahoraMs) };

  const { state, tables_occupied } = calcularEstado(espacio, zonas, config, [...previas, actual]);

  const id = await readingsRepo.insertar({
    nodeId: nodo.id,
    deviceTs: fechaMedicion(lectura.device_ts, ahoraMs),
    temperature: lectura.temperature,
    humidity: lectura.humidity,
    noiseLevel: lectura.noise_level,
    radars: lectura.radars,
    tablesOccupied: tables_occupied,
    state,
  });
  await readingsRepo.actualizarUltimaVista(nodo.id);

  return { id, state, tables_occupied };
}