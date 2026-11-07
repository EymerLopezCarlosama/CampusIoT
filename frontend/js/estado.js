import { api, POLL_MS } from "./api.js";
import {
  hace,
  ENCUESTA_URL,
  formatearHumedad,
  formatearRuido,
  formatearTemperatura,
  textoEstado,
} from "./util.js";

const ETIQUETAS_CLASE_ESTADO = new Set([
  "libre",
  "parcial",
  "con_personas",
  "lleno",
  "sin_conexion",
]);
const contenedor = document.querySelector("#spaces");
const mensaje = document.querySelector("#page-message");
const horaActualizacion = document.querySelector("#last-updated");
let solicitudEnCurso = false;

function crearElemento(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

function crearMetrica(etiqueta, valor) {
  const metrica = crearElemento("div", "metric");
  metrica.append(
    crearElemento("span", "metric__label", etiqueta),
    crearElemento("span", "metric__value", valor),
  );
  return metrica;
}

function crearTarjeta(espacio) {
  const tarjeta = crearElemento("article", "space-card");
  tarjeta.setAttribute("aria-labelledby", `space-${espacio.slug}`);

  const encabezado = crearElemento("div", "space-card__header");
  const titulo = crearElemento("h2", "", espacio.name);
  titulo.id = `space-${espacio.slug}`;
  encabezado.append(titulo);

  const estadoClase = ETIQUETAS_CLASE_ESTADO.has(espacio.state)
    ? espacio.state.replace("_", "-")
    : "";
  const estado = crearElemento(
    "span",
    `status-badge${estadoClase ? ` status--${estadoClase}` : ""}`,
    textoEstado(espacio.state),
  );
  estado.setAttribute("aria-label", `Estado: ${textoEstado(espacio.state)}`);
  encabezado.append(estado);
  tarjeta.append(encabezado);

  if (espacio.mode === "mesas") {
    tarjeta.append(
      crearElemento(
        "p",
        "occupancy-summary",
        `${formatearNumeroEntero(espacio.tables_occupied)} de ${formatearNumeroEntero(espacio.total_tables)} mesas ocupadas`,
      ),
    );
  }

  const metricas = crearElemento("div", "metric-grid");
  metricas.append(
    crearMetrica("Temperatura", formatearTemperatura(espacio.temperature)),
    crearMetrica("Humedad", formatearHumedad(espacio.humidity)),
    crearMetrica("Ruido", formatearRuido(espacio.noise_level)),
  );
  tarjeta.append(metricas);

  tarjeta.append(
    crearElemento("p", "updated-at", `Última lectura ${hace(espacio.seconds_since_last)}`),
  );

  return tarjeta;
}

function formatearNumeroEntero(valor) {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return "—";
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(valor);
}

function mostrarError(error) {
  mensaje.className = "alert alert--error";
  mensaje.textContent = `No se pudo actualizar la información. ${error.message}`;
  mensaje.hidden = false;
}

async function actualizarEspacios() {
  if (solicitudEnCurso) return;
  solicitudEnCurso = true;

  try {
    const espacios = await api("/spaces");
    if (!Array.isArray(espacios)) {
      throw new Error("La respuesta de espacios no tiene el formato esperado.");
    }

    const tarjetas = document.createDocumentFragment();
    for (const espacio of espacios) {
      if (!espacio || typeof espacio.slug !== "string" || typeof espacio.name !== "string") {
        throw new Error("La respuesta contiene un espacio inválido.");
      }
      tarjetas.append(crearTarjeta(espacio));
    }

    contenedor.replaceChildren(tarjetas);
    if (espacios.length === 0) {
      mensaje.className = "alert alert--info";
      mensaje.textContent = "No hay espacios configurados todavía.";
      mensaje.hidden = false;
    } else {
      mensaje.hidden = true;
      const actualizacion = new Date();
      horaActualizacion.dateTime = actualizacion.toISOString();
      horaActualizacion.textContent = new Intl.DateTimeFormat("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(actualizacion);
    }
  } catch (error) {
    mostrarError(error instanceof Error ? error : new Error("Ocurrió un error inesperado."));
  } finally {
    solicitudEnCurso = false;
  }
}

if (ENCUESTA_URL) {
  const mensajeEncuesta = document.querySelector("#survey-message");
  const enlaceEncuesta = crearElemento("a", "", "Participa en la encuesta voluntaria");
  enlaceEncuesta.href = ENCUESTA_URL;
  enlaceEncuesta.target = "_blank";
  enlaceEncuesta.rel = "noopener noreferrer";
  mensajeEncuesta.replaceChildren(enlaceEncuesta);
}

actualizarEspacios();
window.setInterval(actualizarEspacios, POLL_MS);
