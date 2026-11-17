// Rutas de lecturas (HU-01): POST /readings. Solo define rutas.
import { Router } from "express";
import { autenticarNodo } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { lecturaSchema } from "../validators/readings.validator.js";
import * as controller from "../controllers/readings.controller.js";

const router = Router();

router.post("/", autenticarNodo, validate({ body: lecturaSchema }), controller.crear);

export default router;