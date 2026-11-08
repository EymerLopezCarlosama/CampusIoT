// Cálculo del estado de cada espacio (HU-02, HU-04, HU-06).
// Funciones PURAS: sin BD ni red. Los umbrales y bandas llegan por parámetro (vienen de la BD).
//
// Formas de los datos (nombres del contrato de la API, docs/api-contract.md):
//   lectura = { radars: [{ id, present, target, distance_cm, energy }] }
//   zonas   = [{ code: "A", tables: [{ table_no, min_cm, max_cm }] }]   (bandas [min_cm, max_cm))
//   espacio = { mode: "mesas" | "espacio", total_tables }
//   config  = { ventana_s, umbral_personas?, umbral_lleno? }
// `lecturasVentana` ya viene filtrada por ventana_s y trae la lectura actual incluida.

function radaresPresentes(lectura) {
  const radars = Array.isArray(lectura?.radars) ? lectura.radars : [];
  return radars.filter((r) => r && r.present === true);
}

function exigirNumero(config, clave) {
  const valor = config?.[clave];
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    throw new Error(`Falta el parámetro de calibración numérico "${clave}".`);
  }
  return valor;
}

/**
 * Cuenta mesas distintas ocupadas en la ventana. El LD2410C ve UN objetivo por lectura,
 * así que una mesa cuenta si en alguna lectura de la ventana el objetivo cayó en su banda.
 * Zona de 1 mesa: cuenta 1 si hubo present en la ventana (sin mirar la distancia).
 */
export function mesasOcupadas(lecturasVentana, zonas) {
  const ocupadas = new Set();
  const zonasPorCodigo = new Map((zonas ?? []).map((z) => [z.code, z]));

  for (const lectura of lecturasVentana ?? []) {
    for (const radar of radaresPresentes(lectura)) {
      const zona = zonasPorCodigo.get(radar.id);
      if (!zona) continue;
      const mesas = zona.tables ?? [];

      if (mesas.length === 1) {
        ocupadas.add(`${zona.code}:${mesas[0].table_no}`);
        continue;
      }
      for (const mesa of mesas) {
        if (radar.distance_cm >= mesa.min_cm && radar.distance_cm < mesa.max_cm) {
          ocupadas.add(`${zona.code}:${mesa.table_no}`);
        }
      }
    }
  }
  return ocupadas.size;
}

/** 0 → libre · 1 a total-1 → parcial · total → lleno. */
export function estadoGastronomia(ocupadas, totalMesas) {
  if (ocupadas <= 0) return "libre";
  if (ocupadas >= totalMesas) return "lleno";
  return "parcial";
}

/** Energía promedio de la ventana (0 cuando no hay presencia) contra los umbrales de la BD. */
export function estadoSotano(lecturasVentana, config) {
  const umbralPersonas = exigirNumero(config, "umbral_personas");
  const umbralLleno = exigirNumero(config, "umbral_lleno");

  const lecturas = lecturasVentana ?? [];
  if (lecturas.length === 0) return "libre";

  const suma = lecturas.reduce((acc, lectura) => {
    const energias = radaresPresentes(lectura).map((r) => Number(r.energy) || 0);
    return acc + (energias.length ? Math.max(...energias) : 0);
  }, 0);
  const indice = suma / lecturas.length;

  if (indice < umbralPersonas) return "libre";
  if (indice < umbralLleno) return "con_personas";
  return "lleno";
}

/** Estado según el modo del espacio. tables_occupied es null en modo "espacio". */
export function calcularEstado(espacio, zonas, config, lecturasVentana) {
  if (espacio.mode === "mesas") {
    const ocupadas = mesasOcupadas(lecturasVentana, zonas);
    return {
      state: estadoGastronomia(ocupadas, espacio.total_tables),
      tables_occupied: ocupadas,
    };
  }
  return { state: estadoSotano(lecturasVentana, config), tables_occupied: null };
}

/** "sin_conexion" si la última lectura tiene más de offlineAfterS segundos (30 s exactos aún cuenta). */
export function estadoConConexion(estado, ultimaLecturaTs, ahora, offlineAfterS) {
  if (ultimaLecturaTs == null) return "sin_conexion";
  const ultima = new Date(ultimaLecturaTs).getTime();
  const actual = new Date(ahora).getTime();
  if (Number.isNaN(ultima) || Number.isNaN(actual)) return "sin_conexion";
  return (actual - ultima) / 1000 > offlineAfterS ? "sin_conexion" : estado;
}