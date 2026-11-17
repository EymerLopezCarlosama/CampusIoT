// Rutas de verificación manual y resumen (HU-07, HU-08). Solo define rutas.
import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { crearVerificacionSchema } from "../validators/checks.validator.js";
import * as controller from "../controllers/checks.controller.js";

const router = Router();

router.post("/manual-checks", validate({ body: crearVerificacionSchema }), controller.crear);
router.get("/manual-checks", controller.listar);
router.get("/validation/summary", controller.resumen);
router.get("/validation/export", controller.exportarCsv);

export default router;