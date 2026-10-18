// PROMPT — main.cpp (tarea 3.1)
//
// Programa del nodo. setup(): Serial a 115200, iniciar sensores (sensors.h), conectar WiFi (net.h) y sincronizar la hora por NTP.
// loop(): cada SEND_INTERVAL_MS (usar millis(), nunca delay() largos) → leer sensores → armar el JSON → enviarlo → actualizar el LED.
// Si falla el WiFi o el POST, reintentar en el siguiente ciclo sin bloquear la lectura de sensores.
// Un watchdog o reinicio si pasan más de 5 minutos sin poder enviar nada.
//
// Depende de: config.h, sensors.h, net.h
// Referencia: docs/api-contract.md (POST /readings) · docs/hardware/pines-y-cableado.md
// Hecho cuando: el monitor serial muestra "OK 201" cada 3 s y la lectura aparece en la tabla lectura.
