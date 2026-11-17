// Verificación manual (HU-07, HU-08): compara lo que ve el equipo con el estado del sistema.
import { AppError } from "../middlewares/error-handler.js";
import * as checksRepo from "../repositories/checks.repository.js";
import * as spacesRepo from "../repositories/spaces.repository.js";
import { estadoActual } from "./spaces.service.js";

const TOTAL = 40; // 2 espacios x 10 franjas x 2 días (OE4)
const META_PCT = 80;

export async function registrar(datos) {
  const espacio = await spacesRepo.obtenerPorSlug(datos.space);
  if (!espacio) throw new AppError(404, "NO_ENCONTRADO", "El espacio no existe.");

  // Estado del sistema en este instante; ya aplica sin_conexion (cuenta como no coincidente).
  const { state: systemState } = await estadoActual(datos.space);
  const match = datos.manual_state === systemState;

  try {
    const id = await checksRepo.insertar({
      spaceId: espacio.id,
      day: datos.day,
      slot: datos.slot,
      manualState: datos.manual_state,
      manualTables: datos.manual_tables_occupied,
      systemState,
      match,
      observer: datos.observer,
    });
    return { id, system_state: systemState, match };
  } catch (err) {
    if (err.code === "23505") {
      throw new AppError(
        409,
        "FRANJA_DUPLICADA",
        `Ya existe una verificación de ${espacio.name} para el día ${datos.day} en la franja ${datos.slot}.`
      );
    }
    throw err;
  }
}

export async function listar() {
  return checksRepo.listar();
}

// coincidence_pct se calcula siempre sobre las 40 previstas, no sobre las registradas.
export async function resumen() {
  const { registered, matches } = await checksRepo.contarCoincidencias();
  const pct = Math.round((matches / TOTAL) * 1000) / 10;
  return {
    total: TOTAL,
    registered,
    matches,
    coincidence_pct: pct,
    goal_pct: META_PCT,
    goal_met: pct >= META_PCT,
  };
}

// Escapa comas, comillas y saltos de línea. Si el texto empieza con =, +, - o @ se le antepone
// una comilla para que Excel no lo ejecute como fórmula (el observador lo escribe una persona).
function celda(valor) {
  if (valor == null) return "";
  let texto = valor instanceof Date ? valor.toISOString() : String(valor);
  if (/^[=+\-@]/.test(texto)) texto = `'${texto}`;
  return /[",\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

const COLUMNAS = ["space", "day", "slot", "manual_state", "system_state", "match", "observer", "created_at"];

export async function exportarCsv() {
  const filas = await checksRepo.listar();
  const lineas = [COLUMNAS.join(",")];
  for (const f of filas) lineas.push(COLUMNAS.map((c) => celda(f[c])).join(","));
  // BOM al inicio para que Excel muestre bien las tildes (UTF-8).
  return "\uFEFF" + lineas.join("\r\n") + "\r\n";
}