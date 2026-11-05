export const ENCUESTA_URL = "";

const ETIQUETAS_ESTADO = {
  libre: "Libre",
  parcial: "Parcial",
  con_personas: "Con personas",
  lleno: "Lleno",
  sin_conexion: "Sin conexión",
};

function formatearNumero(valor, decimales = 0) {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return "—";
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: decimales,
    minimumFractionDigits: decimales,
  }).format(valor);
}

export function formatearTemperatura(valor) {
  return valor == null ? "—" : `${formatearNumero(valor, 1)} °C`;
}

export function formatearHumedad(valor) {
  return valor == null ? "—" : `${formatearNumero(valor, 1)} %`;
}

export function formatearRuido(valor) {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return "—";
  const nivel = valor < 34 ? "bajo" : valor < 67 ? "medio" : "alto";
  return `${nivel} · ${formatearNumero(valor)}/100`;
}

export function hace(segundos) {
  if (typeof segundos !== "number" || !Number.isFinite(segundos) || segundos < 0) {
    return "sin datos recientes";
  }
  if (segundos < 60) return `hace ${Math.floor(segundos)} s`;
  if (segundos < 3600) return `hace ${Math.floor(segundos / 60)} min`;
  if (segundos < 86400) return `hace ${Math.floor(segundos / 3600)} h`;
  return `hace ${Math.floor(segundos / 86400)} días`;
}

export function textoEstado(estado) {
  return ETIQUETAS_ESTADO[estado] ?? "Estado desconocido";
}
