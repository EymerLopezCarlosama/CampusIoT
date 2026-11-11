// PROMPT — js/verificacion.js (HU-07, HU-08)
//
// Maneja el formulario: adapta las opciones de "estado observado" al espacio elegido (Gastronomía: libre/parcial/lleno; Sótano: libre/con_personas/lleno), envía POST /manual-checks, muestra el error 409 FRANJA_DUPLICADA de forma entendible y refresca la tabla (GET /manual-checks) y el resumen (GET /validation/summary). Botón para descargar GET /validation/export.
// Después de guardar mostrar solo "Guardado" (no revelar aún el estado del sistema para no sesgar la siguiente observación).
//
// Depende de: js/api.js
// Referencia: docs/api-contract.md ("Verificación manual")
import { api, ErrorApi } from "./api.js";
import { textoEstado } from "./util.js";

const TOTAL_COMPARACIONES = 40;

// Las 10 franjas de la jornada. Deben ser las MISMAS que acuerde el equipo
// (docs/pruebas/protocolo-jornada-prueba.md): si cambian, se editan solo aquí.
const FRANJAS = [
  "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00", "21:00",
];

// Estados que se pueden observar en cada espacio (el Sótano no tiene "parcial").
const ESPACIOS = {
  gastronomia: {
    nombre: "Estudio Gastronomía",
    estados: ["libre", "parcial", "lleno"],
    usaMesas: true,
  },
  sotano: {
    nombre: "Sótano",
    estados: ["libre", "con_personas", "lleno"],
    usaMesas: false,
  },
};

const CLAVE_OBSERVADOR = "campusiot.observador";
const formatoPorcentaje = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

const porId = (id) => document.getElementById(id);
const formulario = porId("check-form");
const selEspacio = porId("space");
const selDia = porId("day");
const selFranja = porId("slot");
const selEstado = porId("state");
const inpMesas = porId("tables");
const inpObservador = porId("observer");
const bloqueMesas = porId("tables-field");
const botonGuardar = porId("save-button");
const mensajeForm = porId("form-message");
const mensajeTabla = porId("table-message");
const cuerpoTabla = porId("checks-body");
const textoResumen = porId("summary-text");
const textoMeta = porId("summary-goal");

function mostrarMensaje(elemento, tipo, texto) {
  elemento.className = `alert alert--${tipo}`;
  elemento.textContent = texto;
  elemento.hidden = !texto;
}

function agregarOpcion(select, valor, texto) {
  const opcion = document.createElement("option");
  opcion.value = valor;
  opcion.textContent = texto;
  select.append(opcion);
}

function poblarEspacios() {
  agregarOpcion(selEspacio, "", "Selecciona un espacio");
  for (const [slug, espacio] of Object.entries(ESPACIOS)) {
    agregarOpcion(selEspacio, slug, espacio.nombre);
  }
}

function poblarFranjas() {
  for (const franja of FRANJAS) agregarOpcion(selFranja, franja, franja);
}

// Las opciones de estado y el campo de mesas dependen del espacio elegido.
function actualizarSegunEspacio() {
  const espacio = ESPACIOS[selEspacio.value];
  selEstado.replaceChildren();
  agregarOpcion(selEstado, "", "Selecciona el estado");
  for (const estado of espacio?.estados ?? []) agregarOpcion(selEstado, estado, textoEstado(estado));

  bloqueMesas.hidden = !espacio?.usaMesas;
  if (bloqueMesas.hidden) inpMesas.value = "";
}

function estadoSegunMesas(mesas) {
  if (mesas === 0) return "libre";
  if (mesas === 4) return "lleno";
  return "parcial";
}

// Devuelve { datos } para enviar o { error } con el motivo en español.
function leerFormulario() {
  const space = selEspacio.value;
  const slot = selFranja.value;
  const manualState = selEstado.value;
  const observer = inpObservador.value.trim();

  if (!space) return { error: "Elige el espacio." };
  if (!slot) return { error: "Elige la franja." };
  if (!manualState) return { error: "Elige el estado que observaste." };
  if (!observer) return { error: "Escribe tu nombre como observador." };

  const datos = {
    space,
    day: Number(selDia.value),
    slot,
    manual_state: manualState,
    observer,
  };

  if (ESPACIOS[space].usaMesas && inpMesas.value !== "") {
    const mesas = Number(inpMesas.value);
    if (!Number.isInteger(mesas) || mesas < 0 || mesas > 4) {
      return { error: "Las mesas ocupadas deben ser un número entero de 0 a 4." };
    }
    const esperado = estadoSegunMesas(mesas);
    if (esperado !== manualState) {
      return {
        error: `Con ${mesas} mesas ocupadas el estado es "${textoEstado(esperado)}", no "${textoEstado(manualState)}". Revisa los datos.`,
      };
    }
    datos.manual_tables_occupied = mesas;
  }

  return { datos };
}

function guardarObservador(nombre) {
  try {
    localStorage.setItem(CLAVE_OBSERVADOR, nombre);
  } catch {
    // Sin almacenamiento disponible: solo se pierde la comodidad de recordar el nombre.
  }
}

function recuperarObservador() {
  try {
    return localStorage.getItem(CLAVE_OBSERVADOR) ?? "";
  } catch {
    return "";
  }
}

function mensajeDeError(error) {
  if (error instanceof ErrorApi && error.codigo === "FRANJA_DUPLICADA") {
    return "Esa franja ya está registrada para este espacio y día.";
  }
  if (error instanceof ErrorApi) return error.message;
  return "No se pudo guardar la verificación. Inténtalo de nuevo.";
}

// Después de guardar, se pasa a la siguiente franja para agilizar la jornada.
function prepararSiguienteRegistro() {
  selEstado.value = "";
  inpMesas.value = "";
  const siguiente = FRANJAS[FRANJAS.indexOf(selFranja.value) + 1];
  if (siguiente) selFranja.value = siguiente;
}

async function guardar(evento) {
  evento.preventDefault();
  const { datos, error } = leerFormulario();
  if (error) {
    mostrarMensaje(mensajeForm, "error", error);
    return;
  }

  botonGuardar.disabled = true;
  try {
    const resultado = await api("/manual-checks", { method: "POST", body: datos });
    guardarObservador(datos.observer);
    const coincide = resultado.match ? "coincide" : "no coincide";
    mostrarMensaje(
      mensajeForm,
      "success",
      `Guardado: ${ESPACIOS[datos.space].nombre}, día ${datos.day}, franja ${datos.slot}. ` +
        `El sistema marcó "${textoEstado(resultado.system_state)}" y ${coincide}.`,
    );
    prepararSiguienteRegistro();
    await actualizarLista();
  } catch (errorGuardar) {
    mostrarMensaje(mensajeForm, "error", mensajeDeError(errorGuardar));
  } finally {
    botonGuardar.disabled = false;
  }
}

// El backend puede nombrar los campos como el contrato (inglés) o como la BD (español).
function leerCampo(fila, ...nombres) {
  for (const nombre of nombres) {
    if (fila[nombre] !== undefined && fila[nombre] !== null) return fila[nombre];
  }
  return null;
}

function celda(fila, texto) {
  const td = document.createElement("td");
  td.textContent = texto;
  fila.append(td);
  return td;
}

function celdaEstado(fila, estado) {
  const td = document.createElement("td");
  const insignia = document.createElement("span");
  insignia.className = `status-badge status--${String(estado).replaceAll("_", "-")}`;
  insignia.textContent = textoEstado(estado);
  td.append(insignia);
  fila.append(td);
}

function pintarTabla(verificaciones) {
  cuerpoTabla.replaceChildren();
  const lista = Array.isArray(verificaciones) ? verificaciones : [];

  if (lista.length === 0) {
    const fila = document.createElement("tr");
    const td = celda(fila, "Todavía no hay verificaciones guardadas.");
    td.colSpan = 7;
    cuerpoTabla.append(fila);
    return;
  }

  const filas = lista.map((item) => ({
    espacio: leerCampo(item, "space", "espacio"),
    dia: leerCampo(item, "day", "dia"),
    franja: leerCampo(item, "slot", "franja"),
    observado: leerCampo(item, "manual_state", "estado_manual"),
    sistema: leerCampo(item, "system_state", "estado_sistema"),
    coincide: leerCampo(item, "match", "coincide"),
    observador: leerCampo(item, "observer", "observador"),
  }));

  filas.sort(
    (a, b) =>
      Number(a.dia) - Number(b.dia) ||
      String(a.franja).localeCompare(String(b.franja)) ||
      String(a.espacio).localeCompare(String(b.espacio)),
  );

  for (const dato of filas) {
    const fila = document.createElement("tr");
    celda(fila, ESPACIOS[dato.espacio]?.nombre ?? String(dato.espacio ?? "—"));
    celda(fila, String(dato.dia ?? "—"));
    celda(fila, String(dato.franja ?? "—"));
    celdaEstado(fila, dato.observado);
    celdaEstado(fila, dato.sistema);
    celda(fila, dato.coincide ? "✓ Sí" : "✗ No");
    celda(fila, dato.observador ?? "—");
    cuerpoTabla.append(fila);
  }
}

function pintarResumen(resumen) {
  const total = resumen?.total ?? TOTAL_COMPARACIONES;
  const registradas = resumen?.registered ?? 0;
  const porcentaje = formatoPorcentaje.format(resumen?.coincidence_pct ?? 0);
  const meta = resumen?.goal_pct ?? 80;

  textoResumen.textContent = `${registradas} de ${total} · coincidencia ${porcentaje} % · meta ${meta} %`;
  textoMeta.textContent = resumen?.goal_met
    ? "Meta cumplida."
    : `Meta aún no cumplida. El porcentaje se calcula siempre sobre las ${total} comparaciones previstas.`;
}

async function actualizarLista() {
  try {
    const [verificaciones, resumen] = await Promise.all([
      api("/manual-checks"),
      api("/validation/summary"),
    ]);
    pintarTabla(verificaciones);
    pintarResumen(resumen);
    mostrarMensaje(mensajeTabla, "info", "");
  } catch (error) {
    const detalle = error instanceof ErrorApi ? error.message : "";
    mostrarMensaje(
      mensajeTabla,
      "error",
      `No se pudieron cargar las verificaciones guardadas. ${detalle}`.trim(),
    );
  }
}

poblarEspacios();
poblarFranjas();
inpObservador.value = recuperarObservador();
actualizarSegunEspacio();

selEspacio.addEventListener("change", actualizarSegunEspacio);
formulario.addEventListener("submit", guardar);
actualizarLista();