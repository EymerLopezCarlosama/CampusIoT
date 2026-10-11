// PROMPT — middlewares/validate.js
//
// Exportar `validate({ body?, params?, query? })`: recibe esquemas zod, parsea cada parte de la petición y reemplaza req.body/params/query por los datos ya convertidos (ej. "6" → 6).
// Si falla, llamar next(error) para que error-handler responda 400 DATOS_INVALIDOS.
// Hecho cuando: las rutas lo usan así: router.post("/", validate({ body: lecturaSchema }), controller.crear).
