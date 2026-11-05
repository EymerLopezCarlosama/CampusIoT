import { api } from "./api.js";

const spaceSelect = document.querySelector("#space-select");
const hoursSelect = document.querySelector("#hours-select");
const message = document.querySelector("#history-message");
const chartsSection = document.querySelector("#history-charts");
const chartInstances = new Map();
let activeSpace = null;
let requestId = 0;

const ESTADOS_OCUPACION = {
  libre: 0,
  parcial: 1,
  con_personas: 1,
  lleno: 2,
  sin_conexion: null,
};
const ETIQUETAS_OCUPACION = ["Libre", "Con ocupación", "Lleno"];
const SERIES = [
  {
    key: "temperature",
    canvas: "temperature-chart",
    label: "Temperatura",
    unit: "°C",
    color: "#b42318",
  },
  {
    key: "humidity",
    canvas: "humidity-chart",
    label: "Humedad",
    unit: "%",
    color: "#075985",
  },
  {
    key: "noise_level",
    canvas: "noise-chart",
    label: "Ruido",
    unit: "/100",
    color: "#865500",
  },
];

function mostrarMensaje(texto, tipo = "info") {
  message.className = `alert alert--${tipo}`;
  message.textContent = texto;
  message.hidden = false;
}

function ocultarMensaje() {
  message.hidden = true;
}

function destruirGraficas() {
  for (const chart of chartInstances.values()) chart.destroy();
  chartInstances.clear();
  chartsSection.hidden = true;
}

function formatearHora(valor) {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "Fecha inválida";
  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
}

function crearOpcionesComunes() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: "index" },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => items[0]?.label ?? "",
          label: (context) => {
            const valor = context.parsed.y;
            if (valor == null) {
              return `${context.dataset.label}: ${context.dataset.stateLabels ? "Sin conexión" : "Sin datos"}`;
            }
            if (context.dataset.stateLabels) {
              return `${context.dataset.label}: ${ETIQUETAS_OCUPACION[valor] ?? "Desconocido"}`;
            }
            return `${context.dataset.label}: ${valor} ${context.dataset.unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Hora de lectura" },
        ticks: { maxTicksLimit: 7, maxRotation: 0 },
      },
      y: { beginAtZero: true },
    },
  };
}

function crearGrafica(canvasId, label, unit, filas, valores, color, overrides = {}) {
  const canvas = document.getElementById(canvasId);
  const config = {
    type: "line",
    data: {
      labels: filas.map((fila) => formatearHora(fila.t)),
      datasets: [
        {
          label,
          data: valores,
          unit,
          borderColor: color,
          backgroundColor: `${color}22`,
          borderWidth: 2,
          pointRadius: filas.length > 120 ? 0 : 2,
          pointHoverRadius: 4,
          spanGaps: false,
          tension: 0.2,
          fill: true,
          ...overrides.dataset,
        },
      ],
    },
    options: {
      ...crearOpcionesComunes(),
      scales: {
        ...crearOpcionesComunes().scales,
        y: { beginAtZero: true, ...overrides.y },
      },
    },
  };
  const chart = new Chart(canvas, config);
  chartInstances.set(canvasId, chart);
}

function validarHistorial(datos) {
  if (!Array.isArray(datos)) {
    throw new Error("El historial recibido tiene un formato inválido.");
  }
  for (const fila of datos) {
    if (!fila || typeof fila.t !== "string" || Number.isNaN(Date.parse(fila.t))) {
      throw new Error("El historial contiene una fecha inválida.");
    }
  }
  return datos;
}

function dibujarHistorial(filas) {
  destruirGraficas();
  if (filas.length === 0) return false;

  if (activeSpace.mode === "mesas") {
    crearGrafica(
      "occupancy-chart",
      "Mesas ocupadas",
      "mesas",
      filas,
      filas.map((fila) => numeroOVacio(fila.tables_occupied)),
      "#167447",
      { y: { suggestedMax: numeroOVacio(activeSpace.total_tables) ?? undefined } },
    );
    document.querySelector("#occupancy-title").textContent = "Mesas ocupadas";
  } else {
    crearGrafica(
      "occupancy-chart",
      "Estado del espacio",
      "",
      filas,
      filas.map((fila) =>
        Object.hasOwn(ESTADOS_OCUPACION, fila.state) ? ESTADOS_OCUPACION[fila.state] : null,
      ),
      "#167447",
      {
        dataset: { stateLabels: true },
        y: {
          min: 0,
          max: 2,
          ticks: {
            stepSize: 1,
            callback: (valor) => ETIQUETAS_OCUPACION[valor] ?? "",
          },
        },
      },
    );
    document.querySelector("#occupancy-title").textContent = "Estado del espacio";
  }

  for (const serie of SERIES) {
    crearGrafica(
      serie.canvas,
      serie.label,
      serie.unit,
      filas,
      filas.map((fila) => numeroOVacio(fila[serie.key])),
      serie.color,
    );
  }

  chartsSection.hidden = false;
  return true;
}

function numeroOVacio(valor) {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

async function cargarHistorial() {
  const id = ++requestId;
  const slug = spaceSelect.value;
  const hours = hoursSelect.value;
  if (!slug) {
    destruirGraficas();
    mostrarMensaje("Selecciona un espacio para consultar su historial.");
    return;
  }

  mostrarMensaje("Cargando historial…");
  try {
    const filas = validarHistorial(
      await api(`/spaces/${encodeURIComponent(slug)}/history?hours=${encodeURIComponent(hours)}`),
    );
    if (id !== requestId) return;

    if (!dibujarHistorial(filas)) {
      mostrarMensaje("No hay datos para este espacio y periodo.");
      return;
    }
    ocultarMensaje();
  } catch (error) {
    if (id !== requestId) return;
    destruirGraficas();
    mostrarMensaje(
      `No se pudo cargar el historial. ${error instanceof Error ? error.message : "Ocurrió un error inesperado."}`,
      "error",
    );
  }
}

async function iniciar() {
  if (typeof Chart === "undefined") {
    spaceSelect.disabled = true;
    hoursSelect.disabled = true;
    mostrarMensaje("No se pudo cargar Chart.js. Revisa tu conexión e inténtalo de nuevo.", "error");
    return;
  }

  mostrarMensaje("Cargando espacios…");
  try {
    const espacios = await api("/spaces");
    if (!Array.isArray(espacios)) throw new Error("La lista de espacios tiene un formato inválido.");

    const opciones = document.createDocumentFragment();
    for (const espacio of espacios) {
      if (!espacio || typeof espacio.slug !== "string" || typeof espacio.name !== "string") {
        throw new Error("La lista contiene un espacio inválido.");
      }
      const opcion = document.createElement("option");
      opcion.value = espacio.slug;
      opcion.textContent = espacio.name;
      opciones.append(opcion);
    }

    if (espacios.length === 0) {
      spaceSelect.replaceChildren(new Option("No hay espacios disponibles", ""));
      spaceSelect.disabled = true;
      mostrarMensaje("No hay espacios configurados todavía.");
      return;
    }

    spaceSelect.replaceChildren(opciones);
    spaceSelect.disabled = false;
    hoursSelect.disabled = false;
    activeSpace = espacios[0];
    spaceSelect.addEventListener("change", () => {
      activeSpace = espacios.find((espacio) => espacio.slug === spaceSelect.value);
      cargarHistorial();
    });
    hoursSelect.addEventListener("change", cargarHistorial);
    await cargarHistorial();
  } catch (error) {
    mostrarMensaje(
      `No se pudieron cargar los espacios. ${error instanceof Error ? error.message : "Ocurrió un error inesperado."}`,
      "error",
    );
  }
}

iniciar();
