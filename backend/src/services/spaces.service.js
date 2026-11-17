// Estado actual e historial de los espacios (HU-02 a HU-05).
import { env } from "../config/env.js";
import { AppError } from "../middlewares/error-handler.js";
import * as readingsRepo from "../repositories/readings.repository.js";
import * as spacesRepo from "../repositories/spaces.repository.js";
import { estadoConConexion } from "./status.service.js";

async function obtenerEspacio(slug) {
  const espacio = await spacesRepo.obtenerPorSlug(slug);
  if (!espacio) throw new AppError(404, "NO_ENCONTRADO", "El espacio no existe.");
  return espacio;
}

const nodosDe = (zonas) => [...new Set(zonas.map((z) => z.node_id))];
const aMs = (fecha) => new Date(fecha).getTime();

// Estado de UN espacio con la forma del contrato (GET /spaces).
async function estadoDeEspacio(espacio) {
  const zonas = await spacesRepo.zonasConBandas(espacio.id);
  const nodos = nodosDe(zonas);
  const ahora = new Date();

  const sinDatos = {
    slug: espacio.slug,
    name: espacio.name,
    mode: espacio.mode,
    state: "sin_conexion",
    tables_occupied: null,
    total_tables: espacio.total_tables,
    temperature: null,
    humidity: null,
    noise_level: null,
    last_reading_at: null,
    seconds_since_last: null,
  };

  // Última lectura del espacio (la más reciente entre sus nodos).
  const ultimas = (await Promise.all(nodos.map((id) => readingsRepo.ultimaPorNodo(id)))).filter(Boolean);
  if (ultimas.length === 0) return sinDatos; // nunca hubo lecturas
  const ultima = ultimas.sort((a, b) => aMs(b.received_at) - aMs(a.received_at))[0];

  // sin_conexion por ZONA: con dos placas que comparten clave, el nodo puede seguir enviando
  // aunque una placa se haya caído. La zona con la lectura más vieja manda; si una zona no
  // tiene lecturas dentro de OFFLINE_AFTER_S, el espacio queda sin conexión.
  let masAntigua = null;
  let completo = true;
  for (const nodeId of nodos) {
    const filas = await readingsRepo.ultimaPorRadar(nodeId, env.OFFLINE_AFTER_S);
    const porRadar = new Map(filas.map((f) => [f.radar_id, f.last_reading_at]));
    for (const zona of zonas.filter((z) => z.node_id === nodeId)) {
      const ts = porRadar.get(zona.code);
      if (!ts) {
        completo = false;
      } else if (masAntigua === null || aMs(ts) < aMs(masAntigua)) {
        masAntigua = ts;
      }
    }
  }

  const state = estadoConConexion(ultima.state, completo ? masAntigua : null, ahora, env.OFFLINE_AFTER_S);
  const conectado = state !== "sin_conexion";

  return {
    ...sinDatos,
    state,
    tables_occupied: conectado ? ultima.tables_occupied : null,
    temperature: conectado ? ultima.temperature : null,
    humidity: conectado ? ultima.humidity : null,
    noise_level: conectado ? ultima.noise_level : null,
    last_reading_at: ultima.received_at,
    seconds_since_last: Math.max(0, Math.round((ahora.getTime() - aMs(ultima.received_at)) / 1000)),
  };
}

// Lo usa también checks.service (verificación manual).
export async function estadoActual(slug) {
  return estadoDeEspacio(await obtenerEspacio(slug));
}

export async function listar() {
  const espacios = await spacesRepo.listarEspacios();
  return Promise.all(espacios.map(estadoDeEspacio));
}

// Promedio por minuto (máx. 48 h; el límite lo valida el validador).
export async function historial(slug, hours) {
  const espacio = await obtenerEspacio(slug);
  return spacesRepo.historialPorMinuto(espacio.id, hours);
}

// Últimas N lecturas con radars, de todos los nodos del espacio (para calibración).
export async function crudas(slug, limit) {
  const espacio = await obtenerEspacio(slug);
  const zonas = await spacesRepo.zonasConBandas(espacio.id);
  const porNodo = await Promise.all(nodosDe(zonas).map((id) => readingsRepo.ultimasPorNodo(id, limit)));
  return porNodo
    .flat()
    .sort((a, b) => aMs(b.received_at) - aMs(a.received_at))
    .slice(0, limit);
}