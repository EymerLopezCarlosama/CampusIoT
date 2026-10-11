// PROMPT — js/verificacion.js (HU-07, HU-08)
//
// Maneja el formulario: adapta las opciones de "estado observado" al espacio elegido (Gastronomía: libre/parcial/lleno; Sótano: libre/con_personas/lleno), envía POST /manual-checks, muestra el error 409 FRANJA_DUPLICADA de forma entendible y refresca la tabla (GET /manual-checks) y el resumen (GET /validation/summary). Botón para descargar GET /validation/export.
// Después de guardar mostrar solo "Guardado" (no revelar aún el estado del sistema para no sesgar la siguiente observación).
//
// Depende de: js/api.js
// Referencia: docs/api-contract.md ("Verificación manual")
