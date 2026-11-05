const DEFAULT_URL = "http://localhost:3000/api/readings";
const DEFAULT_INTERVAL_S = 3;
const CYCLE_STAGE_S = 60;
const OUTAGE_DURATION_MS = 60_000;
const NODES = [
  { slug: "gastronomia", key: "dev-key-gastronomia" },
  { slug: "sotano", key: "dev-key-sotano" },
];
const SCENARIOS = new Set(["vacio", "parcial", "lleno", "ciclo"]);

function mostrarUso() {
  console.error(
    "Uso: node tools/simulator.js [--url URL] [--interval SEGUNDOS] " +
      "[--escenario vacio|parcial|lleno|ciclo] [--caida gastronomia|sotano]",
  );
}

function leerArgumentos(argumentos) {
  const opciones = {
    url: DEFAULT_URL,
    intervalS: DEFAULT_INTERVAL_S,
    escenario: "ciclo",
    caida: null,
  };
  const valores = new Map([
    ["--url", "url"],
    ["--interval", "intervalS"],
    ["--escenario", "escenario"],
    ["--caida", "caida"],
  ]);

  for (let i = 0; i < argumentos.length; i += 1) {
    const nombre = argumentos[i];
    const opcion = valores.get(nombre);
    if (!opcion || argumentos[i + 1] === undefined || argumentos[i + 1].startsWith("--")) {
      throw new Error(`Opción o valor inválido: ${nombre}`);
    }

    const valor = argumentos[++i];
    if (opcion === "url") {
      let url;
      try {
        url = new URL(valor);
      } catch {
        throw new Error(`URL inválida: ${valor}`);
      }
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("La URL debe usar http o https.");
      }
      opciones.url = url.toString();
    } else if (opcion === "intervalS") {
      const intervalS = Number(valor);
      if (!Number.isFinite(intervalS) || intervalS < 1) {
        throw new Error("El intervalo debe ser un número de al menos 1 segundo.");
      }
      opciones.intervalS = intervalS;
    } else if (opcion === "escenario") {
      if (!SCENARIOS.has(valor)) {
        throw new Error(`Escenario inválido: ${valor}`);
      }
      opciones.escenario = valor;
    } else {
      if (!NODES.some((nodo) => nodo.slug === valor)) {
        throw new Error(`Nodo inválido para --caida: ${valor}`);
      }
      if (opciones.caida) throw new Error("Solo se puede simular la caída de un nodo.");
      opciones.caida = valor;
    }
  }

  return opciones;
}

function valorSuave(elapsedS, offset, min, max, periodS) {
  const wave = (Math.sin((2 * Math.PI * elapsedS) / periodS + offset) + 1) / 2;
  return min + wave * (max - min);
}

function crearLectura(slug, elapsedS, index, escenario) {
  const offset = slug === "gastronomia" ? 0.4 : 2.1;
  const temperature = valorSuave(elapsedS, offset, 22, 27, 180);
  const humidity = valorSuave(elapsedS, offset + 1.7, 50, 70, 240);
  const noise = valorSuave(elapsedS, offset + 3.2, 20, 70, 95);
  const lectura = {
    device_ts: Date.now(),
    temperature: Number(temperature.toFixed(1)),
    humidity: Number(humidity.toFixed(1)),
    noise_level: Math.round(noise),
  };

  if (slug === "gastronomia") {
    const fase =
      escenario === "ciclo"
        ? Math.floor(elapsedS / CYCLE_STAGE_S) % 3
        : { vacio: 0, parcial: 1, lleno: 2 }[escenario];

    let radarA = {
      id: "A",
      present: false,
      target: "none",
      distance_cm: 0,
      energy: 0,
    };
    if (fase === 1) {
      radarA = { id: "A", present: true, target: "static", distance_cm: 200, energy: 70 };
    } else if (fase === 2) {
      const banda = Math.floor(index / 3) % 3;
      radarA = {
        id: "A",
        present: true,
        target: "static",
        distance_cm: [75, 225, 375][banda],
        energy: 70,
      };
    }

    lectura.radars = [
      radarA,
      { id: "B", present: false, target: "none", distance_cm: 0, energy: 0 },
    ];
    return lectura;
  }

  const energy = Math.round(valorSuave(elapsedS, offset + 0.8, 0, 100, 50));
  const present = energy > 0;
  lectura.radars = [
    {
      id: "S",
      present,
      target: present ? "static" : "none",
      distance_cm: present ? 180 : 0,
      energy,
    },
  ];
  return lectura;
}

async function enviarLectura(url, nodo, lectura) {
  try {
    const respuesta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": nodo.key,
      },
      body: JSON.stringify(lectura),
    });
    const texto = await respuesta.text();
    let datos;
    try {
      datos = texto ? JSON.parse(texto) : {};
    } catch {
      datos = null;
    }

    const estado = datos?.state ? ` · estado: ${datos.state}` : "";
    const mensajeError = datos?.error?.mensaje || texto || respuesta.statusText;
    const detalle = respuesta.ok ? estado : ` · error: ${mensajeError}`;
    console.log(`[${new Date().toLocaleTimeString("es-CO")}] ${nodo.slug} HTTP ${respuesta.status}${detalle}`);
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString("es-CO")}] ${nodo.slug} ERROR · ${error.message}`);
  }
}

async function main() {
  let opciones;
  try {
    opciones = leerArgumentos(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    mostrarUso();
    process.exitCode = 1;
    return;
  }

  const inicio = Date.now();
  const indices = new Map(NODES.map((nodo) => [nodo.slug, 0]));
  const caidaHasta = opciones.caida ? inicio + OUTAGE_DURATION_MS : 0;
  if (opciones.caida) {
    console.log(`Simulando caída de ${opciones.caida} durante 60 s; luego volverá a enviar lecturas.`);
  }
  if (opciones.escenario === "ciclo") {
    console.log("El escenario ciclo cambia cada 60 s para respetar la ventana de ocupación del seed.");
  }
  console.log(`Enviando lecturas a ${opciones.url} cada ${opciones.intervalS} s. Ctrl+C para detener.`);

  const enviar = async () => {
    const elapsedS = (Date.now() - inicio) / 1000;
    await Promise.all(
      NODES.map(async (nodo) => {
        if (nodo.slug === opciones.caida && Date.now() < caidaHasta) return;
        const index = indices.get(nodo.slug);
        indices.set(nodo.slug, index + 1);
        await enviarLectura(
          opciones.url,
          nodo,
          crearLectura(nodo.slug, elapsedS, index, opciones.escenario),
        );
      }),
    );
  };

  await enviar();
  const timer = setInterval(enviar, opciones.intervalS * 1000);
  const detener = () => {
    clearInterval(timer);
    console.log("\nSimulador detenido.");
  };
  process.once("SIGINT", detener);
  process.once("SIGTERM", detener);
}

await main();
