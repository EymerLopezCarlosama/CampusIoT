// PROMPT — js/calibracion.js (HU-06, tarea 4.3)
//
// Pantalla técnica. Guarda la x-admin-key SOLO en una variable en memoria. Cada 2 s lee GET /spaces/:slug/raw?limit=10 (con la clave) y muestra por radar: distancia, energía, tipo de objetivo y a qué banda de mesa corresponde (según GET /spaces/:slug/config). Formulario para editar bandas y umbrales y enviarlos con PUT /spaces/:slug/config; mostrar los errores del backend (BANDAS_SOLAPADAS, etc.).
//
// Depende de: js/api.js
// Referencia: docs/api-contract.md ("Calibración") · docs/calibracion/protocolo-calibracion.md
