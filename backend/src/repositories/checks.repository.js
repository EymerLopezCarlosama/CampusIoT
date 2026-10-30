// PROMPT — repositories/checks.repository.js — SQL de verificacion_manual
//
// insertar(check) (NO captura el error 23505: sube al service, que lo convierte en AppError 409 FRANJA_DUPLICADA), listar(), contarCoincidencias() → { registered, matches }.
//
// Las columnas están en español (docs/base-de-datos/diccionario-de-datos.md): usar alias AS para devolver los nombres del contrato de la API (ej. mesas_ocupadas AS tables_occupied).
//
// Depende de: config/database.js
// Referencia: database/schema.sql (verificacion_manual)
