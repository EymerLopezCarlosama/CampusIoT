// Rutas de calibración (HU-06). Se montan bajo /spaces. GET es público; PUT exige x-admin-key.
import { Router } from "express";
import { autenticarAdmin } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { slugParamSchema } from "../validators/spaces.validator.js";
import { actualizarConfigSchema } from "../validators/config.validator.js";
import * as controller from "../controllers/config.controller.js";

const router = Router();

router.get("/:slug/config", validate({ params: slugParamSchema }), controller.obtener);

router.put(
  "/:slug/config",
  autenticarAdmin,
  validate({ params: slugParamSchema, body: actualizarConfigSchema }),
  controller.actualizar
);

export default router;