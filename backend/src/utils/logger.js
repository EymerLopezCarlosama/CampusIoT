// Logger sin dependencias: imprime en consola con fecha ISO y nivel.
function escribir(nivel, metodo, mensaje, ...extra) {
  console[metodo](`${new Date().toISOString()} [${nivel}] ${mensaje}`, ...extra);
}

export const logger = {
  info: (mensaje, ...extra) => escribir("INFO", "log", mensaje, ...extra),
  warn: (mensaje, ...extra) => escribir("WARN", "warn", mensaje, ...extra),
  error: (mensaje, ...extra) => escribir("ERROR", "error", mensaje, ...extra),
};