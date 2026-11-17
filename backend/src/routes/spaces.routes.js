// Rutas de espacios (HU-02 a HU-05). Solo define rutas.
import { Router } from "express";
import { autenticarAdmin } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  slugParamSchema,
  historialQuerySchema,
  crudasQuerySchema,
} from "../validators/spaces.validator.js";
import * as controller from "../controllers/spaces.controller.js";

const router = Router();

router.get("/", controller.listar);

router.get(
  "/:slug/history",
  validate({ params: slugParamSchema, query: historialQuerySchema }),
  controller.historial
);

// Lecturas crudas para calibración: protegida con x-admin-key.
router.get(
  "/:slug/raw",
  autenticarAdmin,
  validate({ params: slugParamSchema, query: crudasQuerySchema }),
  controller.crudas
);

export default router;