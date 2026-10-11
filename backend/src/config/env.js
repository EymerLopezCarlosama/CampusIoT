// PROMPT — config/env.js
//
// Cargar el .env de la RAÍZ del repo con dotenv (ruta: path.resolve(__dirname, "../../../.env")) y validarlo con zod.
// Exportar `env` ya convertido a su tipo: PORT (número, def. 3000), DATABASE_URL (obligatoria), DATABASE_SSL (booleano, def. false), CORS_ORIGIN, OFFLINE_AFTER_S (número, def. 30), EXPECTED_INTERVAL_S (número, def. 3), ADMIN_KEY (obligatoria; protege la calibración).
// Si falta una variable obligatoria, lanzar un error claro y terminar (no arrancar a medias).
// Referencia: .env.example
// Hecho cuando: cualquier archivo hace `import { env } from "../config/env.js"` y lee valores ya tipados.
