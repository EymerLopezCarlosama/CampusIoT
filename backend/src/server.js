// Punto de entrada: verifica la BD, levanta el servidor y cierra el pool al apagar.
import { env } from "./config/env.js";
import { pool, probarConexion } from "./config/database.js";
import { app } from "./app.js";
import { logger } from "./utils/logger.js";

if (!(await probarConexion())) {
  logger.warn("La base de datos no responde; el servidor arranca igual y /api/salud mostrará el error.");
}

const server = app.listen(env.PORT, () => {
  logger.info(`Servidor escuchando en http://localhost:${env.PORT}`);
});

function cerrar(senal) {
  logger.info(`${senal} recibido, cerrando...`);
  // Si algo mantiene conexiones abiertas, se fuerza la salida a los 5 s.
  setTimeout(() => process.exit(1), 5000).unref();
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => cerrar("SIGINT"));
process.on("SIGTERM", () => cerrar("SIGTERM"));