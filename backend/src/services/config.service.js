// Calibración (HU-06): lectura y actualización de bandas por mesa y parámetros de un espacio.
import { pool } from "../config/database.js";
import { AppError } from "../middlewares/error-handler.js";
import * as spacesRepo from "../repositories/spaces.repository.js";
import * as configRepo from "../repositories/config.repository.js";

async function obtenerEspacio(slug) {
  const espacio = await spacesRepo.obtenerPorSlug(slug);
  if (!espacio) throw new AppError(404, "NO_ENCONTRADO", "El espacio no existe.");
  return espacio;
}

const datosInvalidos = (mensaje) => new AppError(400, "DATOS_INVALIDOS", mensaje);

// Forma del contrato (GET /spaces/:slug/config).
async function leer(espacio) {
  const zonas = await spacesRepo.zonasConBandas(espacio.id);
  const config = await configRepo.obtenerConfig(espacio.id);
  return {
    slug: espacio.slug,
    zones: zonas.map((z) => ({ code: z.code, tables: z.tables })),
    config,
  };
}

export async function obtener(slug) {
  return leer(await obtenerEspacio(slug));
}

function validarConfig(espacio, cambios, actual) {
  // Los umbrales solo existen en el modo "espacio" (Sótano).
  if (espacio.mode === "mesas" && Object.keys(cambios).some((c) => c !== "ventana_s")) {
    throw datosInvalidos("En un espacio por mesas solo se puede cambiar ventana_s.");
  }
  const final = { ...actual, ...cambios };
  if (final.umbral_personas != null && final.umbral_lleno != null && final.umbral_personas >= final.umbral_lleno) {
    throw datosInvalidos("umbral_personas debe ser menor que umbral_lleno.");
  }
}

// La zona y la mesa deben existir (404); las bandas resultantes de cada zona tocada no se solapan.
// Bandas [min_cm, max_cm): 0-150 y 150-300 NO se solapan.
function validarBandas(zonas, zoneTables) {
  const resultado = new Map(); // código de zona -> Map(table_no -> banda)
  const vistas = new Set();

  for (const c of zoneTables) {
    const zona = zonas.find((z) => z.code === c.zone);
    if (!zona) {
      throw new AppError(404, "NO_ENCONTRADO", `La zona "${c.zone}" no existe en este espacio.`);
    }
    if (!zona.tables.some((t) => t.table_no === c.table_no)) {
      throw new AppError(404, "NO_ENCONTRADO", `La mesa ${c.table_no} no existe en la zona "${c.zone}".`);
    }
    const clave = `${c.zone}:${c.table_no}`;
    if (vistas.has(clave)) {
      throw datosInvalidos(`La mesa ${c.table_no} de la zona "${c.zone}" viene repetida.`);
    }
    vistas.add(clave);

    if (!resultado.has(zona.code)) {
      resultado.set(zona.code, new Map(zona.tables.map((t) => [t.table_no, { ...t }])));
    }
    resultado.get(zona.code).set(c.table_no, { table_no: c.table_no, min_cm: c.min_cm, max_cm: c.max_cm });
  }

  for (const [codigo, tablas] of resultado) {
    const orden = [...tablas.values()].sort((a, b) => a.min_cm - b.min_cm);
    for (let i = 1; i < orden.length; i++) {
      if (orden[i - 1].max_cm > orden[i].min_cm) {
        throw new AppError(
          400,
          "BANDAS_SOLAPADAS",
          `Las bandas de la zona "${codigo}" se solapan (mesas ${orden[i - 1].table_no} y ${orden[i].table_no}).`
        );
      }
    }
  }
}

export async function actualizar(slug, { config = {}, zone_tables = [] }) {
  const espacio = await obtenerEspacio(slug);
  const zonas = await spacesRepo.zonasConBandas(espacio.id);
  const actual = await configRepo.obtenerConfig(espacio.id);

  validarConfig(espacio, config, actual);
  validarBandas(zonas, zone_tables);

  // Todo o nada: si falla una escritura, no queda a medias.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [clave, valor] of Object.entries(config)) {
      await configRepo.upsertConfig(client, espacio.id, clave, valor);
    }
    for (const c of zone_tables) {
      const zona = zonas.find((z) => z.code === c.zone);
      await configRepo.upsertBanda(client, zona.zone_id, c.table_no, c.min_cm, c.max_cm);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return leer(espacio);
}