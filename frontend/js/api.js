// PROMPT — js/api.js
//
// Cliente HTTP base. Exportar `api(ruta, opciones?)`: envuelve fetch con base "/api" (mismo origen), envía/recibe JSON y, si la respuesta no es OK, lee { error: { codigo, mensaje } } y lanza un `ErrorApi` con (status, codigo, mensaje). Exportar también POLL_MS = 3000 (OE2: máximo 10 s de retardo; ver docs/arquitectura.md).
// Hecho cuando: los demás módulos solo llaman api("/spaces") sin repetir fetch ni manejo de errores.
