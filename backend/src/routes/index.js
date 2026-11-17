// Router raíz (montado en /api). Los demás routers se montan en sus pasos (B8 a B11).
import { Router } from "express";
import { env } from "../config/env.js";
import { probarConexion } from "../config/database.js";
import * as readingsRepo from "../repositories/readings.repository.js";
import readingsRoutes from "./readings.routes.js";
import spacesRoutes from "./spaces.routes.js";

const router = Router();

router.use("/readings", readingsRoutes);
router.use("/spaces", spacesRoutes);  
// Responde aunque la BD esté caída: base_datos pasa a "error" y el servidor sigue vivo.
router.get("/salud", async (req, res, next) => {
  try {
    const baseDatos = await probarConexion();
    let nodos = [];
    if (baseDatos) {
      const filas = await readingsRepo.listarNodos();
      nodos = filas.map((n) => ({
        node: n.node,
        last_seen: n.last_seen,
        online: n.last_seen !== null && (Date.now() - new Date(n.last_seen).getTime()) / 1000 <= env.OFFLINE_AFTER_S,
      }));
    }
    res.json({ backend: "ok", base_datos: baseDatos ? "ok" : "error", nodos });
  } catch (err) {
    next(err);
  }
});

export default router;