import { api, ErrorApi } from "./api.js";

const REFRESCO_MS = 2000;
const LECTURAS = 10;

const ETIQUETAS_CONFIG = {
  ventana_s: "Ventana de tiempo (s)",
  umbral_personas: "Umbral «con personas» (energía)",
  umbral_lleno: "Umbral «lleno» (energía)",
};
const ETIQUETAS_OBJETIVO = {
  none: "Ninguno",
  static: "Estático",
  moving: "En movimiento",
  both: "Estático y en movimiento",
};

const porId = (id) => document.getElementById(id);
const formAcceso = porId("access-form");
const selEspacio = porId("space");
const inpClave = porId("admin-key");
const botonConectar = porId("connect-button");
const botonDesconectar = porId("disconnect-button");
const mensajeAcceso = porId("access-message");
const seccionVivo = porId("live-section");
const estadoVivo = porId("live-status");
const contenedorRadares = porId("radars");
const seccionConfig = porId("config-section");
const formConfig = porId("config-form");
const camposConfig = porId("config-fields");
const mensajeConfig = porId("config-message");
const botonGuardar = porId("save-button");

// La clave de administrador vive solo en esta variable (nunca en localStorage ni en la URL).
let claveAdmin = null;
let espacioActual = null;
let configActual = null;
let sesion = 0; // cambia al conectar o desconectar para detener el bucle anterior

function mostrarMensaje(elemento, tipo, texto) {
  elemento.className = `alert alert--${tipo}`;
  elemento.textContent = texto;
  elemento.hidden = !texto;
}

const cabeceras = (clave) => ({ "x-admin-key": clave });
const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

function textoError(error) {
  if (error instanceof ErrorApi && error.status === 401) {
    return "La clave de administrador no es válida.";
  }
  return error instanceof ErrorApi ? error.message : "Ocurrió un error inesperado.";
}

// ---------- Lecturas en vivo ----------
function tiempoDe(lectura) {
  const valor = lectura.received_at ?? lectura.created_at ?? lectura.fecha_recepcion ?? lectura.t ?? lectura.device_ts;
  if (typeof valor === "number") return valor;
  const ms = Date.parse(valor);
  return Number.isNaN(ms) ? null : ms;
}

function horaDe(lectura) {
  const ms = tiempoDe(lectura);
  return ms === null ? "—" : new Date(ms).toLocaleTimeString("es-CO", { hour12: false });
}

// Devuelve las lecturas de la más reciente a la más antigua.
function ordenarLecturas(datos) {
  const lista = Array.isArray(datos) ? datos : (datos?.readings ?? datos?.lecturas ?? []);
  if (lista.every((lectura) => tiempoDe(lectura) !== null)) {
    return [...lista].sort((a, b) => tiempoDe(b) - tiempoDe(a));
  }
  return lista; // sin fechas fiables: se asume que el servidor las envía de la más reciente a la más antigua
}

function bandaDe(radar) {
  if (!radar.present || radar.target === "none") return "Sin objetivo";
  const zona = configActual?.zones?.find((z) => z.code === radar.id);
  if (!zona || !zona.tables?.length) return "No aplica (sin mesas)";
  const mesa = zona.tables.find((t) => radar.distance_cm >= t.min_cm && radar.distance_cm < t.max_cm);
  return mesa ? `Mesa ${mesa.table_no} (zona ${zona.code})` : "Fuera de las bandas";
}

function crearMetrica(etiqueta, valor) {
  const caja = document.createElement("div");
  caja.className = "metric";
  const nombre = document.createElement("span");
  nombre.className = "metric__label";
  nombre.textContent = etiqueta;
  const dato = document.createElement("strong");
  dato.className = "metric__value";
  dato.textContent = valor;
  caja.append(nombre, dato);
  return caja;
}

function crearTablaRadar(historial) {
  const envoltorio = document.createElement("div");
  envoltorio.className = "table-wrapper";
  const tabla = document.createElement("table");
  tabla.className = "data-table data-table--nowrap";
  const cabecera = tabla.createTHead().insertRow();
  for (const titulo of ["Hora", "Distancia", "Energía", "Objetivo"]) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = titulo;
    cabecera.append(th);
  }
  const cuerpo = tabla.createTBody();
  for (const { lectura, radar } of historial) {
    const fila = cuerpo.insertRow();
    fila.insertCell().textContent = horaDe(lectura);
    fila.insertCell().textContent = radar.present ? `${radar.distance_cm} cm` : "—";
    fila.insertCell().textContent = String(radar.energy ?? "—");
    fila.insertCell().textContent = ETIQUETAS_OBJETIVO[radar.target] ?? String(radar.target ?? "—");
  }
  envoltorio.append(tabla);
  return envoltorio;
}

function pintarLecturas(datos) {
  const lecturas = ordenarLecturas(datos);
  // Al redibujar, las tablas volverían al inicio: se recuerda cuánto las deslizó la persona.
  const posiciones = [...contenedorRadares.querySelectorAll(".table-wrapper")].map((t) => t.scrollLeft);
  contenedorRadares.replaceChildren();

  if (lecturas.length === 0) {
    estadoVivo.textContent = "Todavía no hay lecturas de este espacio.";
    return;
  }

  const ids = [...new Set(lecturas.flatMap((l) => (l.radars ?? []).map((r) => r.id)))].sort();
  for (const id of ids) {
    const historial = lecturas
      .map((lectura) => ({ lectura, radar: (lectura.radars ?? []).find((r) => r.id === id) }))
      .filter((item) => item.radar);
    const ultimo = historial[0].radar;

    const tarjeta = document.createElement("article");
    tarjeta.className = "card";
    const titulo = document.createElement("h3");
    titulo.textContent = `Radar ${id}`;
    const metricas = document.createElement("div");
    metricas.className = "metric-grid";
    metricas.append(
      crearMetrica("Distancia", ultimo.present ? `${ultimo.distance_cm} cm` : "—"),
      crearMetrica("Energía", String(ultimo.energy ?? "—")),
      crearMetrica("Objetivo", ETIQUETAS_OBJETIVO[ultimo.target] ?? String(ultimo.target ?? "—")),
      crearMetrica("Banda", bandaDe(ultimo)),
    );
    tarjeta.append(titulo, metricas, crearTablaRadar(historial));
    contenedorRadares.append(tarjeta);
  }
  contenedorRadares.querySelectorAll(".table-wrapper").forEach((tabla, i) => {
    tabla.scrollLeft = posiciones[i] ?? 0;
  });
  estadoVivo.textContent = `Última lectura a las ${horaDe(lecturas[0])} · se actualiza cada ${REFRESCO_MS / 1000} s`;
}

async function bucleLecturas(miSesion) {
  while (miSesion === sesion) {
    await esperar(REFRESCO_MS);
    if (miSesion !== sesion) return;
    try {
      const datos = await api(`/spaces/${espacioActual}/raw?limit=${LECTURAS}`, {
        headers: cabeceras(claveAdmin),
      });
      if (miSesion !== sesion) return;
      pintarLecturas(datos);
    } catch (error) {
      if (miSesion !== sesion) return;
      if (error instanceof ErrorApi && error.status === 401) {
        desconectar("La clave dejó de ser válida. Vuelve a conectarte.");
        return;
      }
      estadoVivo.textContent = `No se pudieron actualizar las lecturas. ${textoError(error)}`;
    }
  }
}

// ---------- Formulario de ajustes ----------
function crearCampo(id, etiqueta, valor, datos) {
  const campo = document.createElement("div");
  campo.className = "form-field";
  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = etiqueta;
  const entrada = document.createElement("input");
  entrada.id = id;
  entrada.className = "form-control";
  entrada.type = "number";
  entrada.inputMode = "numeric";
  entrada.step = "1";
  entrada.min = "0";
  entrada.value = String(valor);
  Object.assign(entrada.dataset, datos);
  campo.append(label, entrada);
  return campo;
}

function pintarFormulario() {
  camposConfig.replaceChildren();

  for (const zona of configActual.zones ?? []) {
    for (const mesa of zona.tables ?? []) {
      const grupo = document.createElement("fieldset");
      grupo.className = "form-grid";
      const leyenda = document.createElement("legend");
      leyenda.textContent = `Zona ${zona.code} · Mesa ${mesa.table_no}`;
      const base = `banda-${zona.code}-${mesa.table_no}`;
      grupo.append(
        leyenda,
        crearCampo(`${base}-min`, "Mínimo (cm)", mesa.min_cm, {
          tipo: "banda", zona: zona.code, mesa: mesa.table_no, campo: "min_cm",
        }),
        crearCampo(`${base}-max`, "Máximo (cm)", mesa.max_cm, {
          tipo: "banda", zona: zona.code, mesa: mesa.table_no, campo: "max_cm",
        }),
      );
      camposConfig.append(grupo);
    }
  }

  const numericos = Object.entries(configActual.config ?? {}).filter(([, v]) => typeof v === "number");
  if (numericos.length > 0) {
    const grupo = document.createElement("fieldset");
    grupo.className = "form-grid";
    const leyenda = document.createElement("legend");
    leyenda.textContent = "Parámetros del espacio";
    grupo.append(leyenda);
    for (const [clave, valor] of numericos) {
      grupo.append(
        crearCampo(`config-${clave}`, ETIQUETAS_CONFIG[clave] ?? clave, valor, { tipo: "config", clave }),
      );
    }
    camposConfig.append(grupo);
  }
}

// Compara lo escrito con lo cargado y arma solo los cambios, con un texto para el registro.
function leerCambios() {
  const entradas = [...camposConfig.querySelectorAll("input")];
  const cambiosConfig = {};
  const bandas = new Map();
  const resumen = [];

  for (const entrada of entradas) {
    if (entrada.value.trim() === "") return { error: "Completa todos los campos antes de guardar." };
    const valor = Number(entrada.value);
    if (!Number.isInteger(valor) || valor < 0) {
      return { error: "Todos los valores deben ser números enteros de 0 en adelante." };
    }
    const { tipo, clave, zona, mesa, campo } = entrada.dataset;

    if (tipo === "config") {
      const anterior = configActual.config[clave];
      if (valor !== anterior) {
        cambiosConfig[clave] = valor;
        resumen.push(`${ETIQUETAS_CONFIG[clave] ?? clave}: ${anterior} → ${valor}`);
      }
    } else {
      const zonaActual = configActual.zones.find((z) => z.code === zona);
      const mesaActual = zonaActual.tables.find((t) => String(t.table_no) === mesa);
      if (valor !== mesaActual[campo]) {
        const llave = `${zona}-${mesa}`;
        const fila = bandas.get(llave) ?? {
          zone: zona, table_no: mesaActual.table_no, min_cm: mesaActual.min_cm, max_cm: mesaActual.max_cm,
        };
        resumen.push(`Zona ${zona} · Mesa ${mesa} · ${campo === "min_cm" ? "mínimo" : "máximo"}: ${mesaActual[campo]} → ${valor} cm`);
        fila[campo] = valor;
        bandas.set(llave, fila);
      }
    }
  }

  for (const fila of bandas.values()) {
    if (fila.min_cm >= fila.max_cm) {
      return { error: `En la zona ${fila.zone}, mesa ${fila.table_no}, el mínimo debe ser menor que el máximo.` };
    }
  }
  const personas = cambiosConfig.umbral_personas ?? configActual.config.umbral_personas;
  const lleno = cambiosConfig.umbral_lleno ?? configActual.config.umbral_lleno;
  if (personas !== undefined && lleno !== undefined && personas >= lleno) {
    return { error: "El umbral «con personas» debe ser menor que el umbral «lleno»." };
  }

  const cuerpo = {};
  if (Object.keys(cambiosConfig).length > 0) cuerpo.config = cambiosConfig;
  if (bandas.size > 0) cuerpo.zone_tables = [...bandas.values()];
  return { cuerpo, resumen };
}

async function guardar(evento) {
  evento.preventDefault();
  const { cuerpo, resumen, error } = leerCambios();
  if (error) return mostrarMensaje(mensajeConfig, "error", error);
  if (!cuerpo.config && !cuerpo.zone_tables) {
    return mostrarMensaje(mensajeConfig, "info", "No hay cambios para guardar.");
  }

  botonGuardar.disabled = true;
  try {
    await api(`/spaces/${espacioActual}/config`, {
      method: "PUT",
      headers: cabeceras(claveAdmin),
      body: cuerpo,
    });
    configActual = await api(`/spaces/${espacioActual}/config`, { headers: cabeceras(claveAdmin) });
    pintarFormulario();
    // Este texto sirve para el registro de parámetros (valor anterior → valor nuevo).
    mostrarMensaje(mensajeConfig, "success", `Guardado. ${resumen.join(" · ")}`);
  } catch (errorGuardar) {
    mostrarMensaje(mensajeConfig, "error", textoError(errorGuardar));
  } finally {
    botonGuardar.disabled = false;
  }
}

// ---------- Conexión ----------
function desconectar(mensaje = "") {
  sesion += 1;
  claveAdmin = null;
  espacioActual = null;
  configActual = null;
  seccionVivo.hidden = true;
  seccionConfig.hidden = true;
  contenedorRadares.replaceChildren();
  camposConfig.replaceChildren();
  botonDesconectar.hidden = true;
  botonConectar.textContent = "Conectar";
  inpClave.disabled = false;
  mostrarMensaje(mensajeAcceso, mensaje ? "error" : "info", mensaje);
}

async function conectar(evento) {
  evento?.preventDefault();
  const slug = selEspacio.value;
  const clave = claveAdmin ?? inpClave.value.trim();
  if (!clave) return mostrarMensaje(mensajeAcceso, "error", "Escribe la clave de administrador.");

  const miSesion = ++sesion;
  botonConectar.disabled = true;
  mostrarMensaje(mensajeAcceso, "info", "Conectando…");
  try {
    const [crudas, config] = await Promise.all([
      api(`/spaces/${slug}/raw?limit=${LECTURAS}`, { headers: cabeceras(clave) }),
      api(`/spaces/${slug}/config`, { headers: cabeceras(clave) }),
    ]);
    if (miSesion !== sesion) return;
    claveAdmin = clave;
    espacioActual = slug;
    configActual = config;
    inpClave.value = "";
    inpClave.disabled = true;
    botonConectar.textContent = "Cambiar de espacio";
    botonDesconectar.hidden = false;
    mostrarMensaje(mensajeAcceso, "success", "Conectado.");
    mostrarMensaje(mensajeConfig, "info", "");
    seccionVivo.hidden = false;
    seccionConfig.hidden = false;
    pintarFormulario();
    pintarLecturas(crudas);
    bucleLecturas(miSesion);
  } catch (error) {
    if (miSesion !== sesion) return;
    desconectar(textoError(error));
  } finally {
    botonConectar.disabled = false;
  }
}

formAcceso.addEventListener("submit", conectar);
botonDesconectar.addEventListener("click", () => desconectar());
formConfig.addEventListener("submit", guardar);
selEspacio.addEventListener("change", () => {
  if (claveAdmin) conectar();
});