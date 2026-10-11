// PROMPT — js/estado.js (HU-02, HU-03, HU-04)
//
// Cada POLL_MS llama GET /spaces y pinta una tarjeta por espacio en index.html con: estado (clase CSS + texto), "N de M mesas ocupadas" si mode = "mesas", temperatura, humedad, ruido y "actualizado hace X s" (usa seconds_since_last).
// Si la petición falla (servidor caído), mostrar un aviso "No se pudo actualizar" sin borrar lo que ya se veía. No usar innerHTML con datos del servidor (usar textContent).
//
// Depende de: js/api.js, js/util.js
// Referencia: docs/api-contract.md (GET /spaces)
// Hecho cuando: con el simulador encendido, la página cambia sola de libre a parcial a lleno y marca "sin conexión" al apagar el simulador.
