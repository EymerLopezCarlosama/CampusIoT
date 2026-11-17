// Router raíz (montado en /api). Por ahora solo GET /salud; los demás routers se montan en sus pasos.
import { Router } from "express";
import { probarConexion } from "../config/database.js";

const router = Router();

// Responde aunque la BD esté caída: base_datos pasa a "error" y el servidor sigue vivo.
router.get("/salud", async (req, res, next) => {
  try {
    const baseDatos = await probarConexion();
    // nodos queda vacío hasta B6, cuando exista readings.repository.listarNodos().
    res.json({ backend: "ok", base_datos: baseDatos ? "ok" : "error", nodos: [] });
  } catch (err) {
    next(err);
  }
});

export default router;