// PROMPT — config/database.js
//
// Crear el pool de `pg` con env.DATABASE_URL (max 10; ssl: { rejectUnauthorized: false } si env.DATABASE_SSL, necesario en Supabase).
// Exportar `pool`, `query(texto, params)` y `probarConexion(): Promise<boolean>` (SELECT 1; la usan /salud y server.js).
//
// Depende de: config/env.js
// Referencia: database/schema.sql
// Hecho cuando: probarConexion() devuelve true con la BD de Docker o de Supabase.
