// PROMPT — app.js
//
// Exportar `app` (Express) SIN llamar a listen (así se prueba con supertest).
// Orden: cors({ origin: env.CORS_ORIGIN }) → express.json({ limit: "20kb" }) → app.use("/api", routes) → express.static(frontend, ruta: path.resolve(__dirname, "../../frontend")) → notFound → errorHandler.
// La página y la API salen del mismo servidor.
//
// Depende de: routes/index.js, middlewares/not-found.js, middlewares/error-handler.js, config/env.js
// Hecho cuando: GET /api/salud devuelve JSON y GET / devuelve frontend/index.html.
