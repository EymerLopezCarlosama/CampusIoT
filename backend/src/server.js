// PROMPT — server.js
//
// Punto de entrada: importa env y app, verifica la BD con probarConexion() (si falla, avisa claro pero deja arrancar), hace app.listen(env.PORT) y registra con logger.
// Al recibir SIGINT/SIGTERM cerrar el pool de pg antes de salir.
//
// Depende de: config/env.js, config/database.js, app.js, utils/logger.js
// Hecho cuando: `npm run dev` deja el servidor escuchando en el puerto del .env y http://localhost:3000/api/salud responde.
