// Rutas de métricas (HU-09): GET /metrics?from=&to=. Solo define rutas.
import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { rangoFechasQuerySchema } from "../validators/spaces.validator.js";
import * as controller from "../controllers/metrics.controller.js";

const router = Router();

router.get("/", validate({ query: rangoFechasQuerySchema }), controller.obtener);

export default router;