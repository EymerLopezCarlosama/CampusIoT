// PROMPT — net.cpp (tarea 3.1)
//
// netBegin(): WiFi.begin(WIFI_SSID, WIFI_PASSWORD) en modo estación, con reconexión automática; no bloquear más de ~10 s.
// netSyncTime(): configTime() con servidor NTP (pool.ntp.org), hora UTC; sirve para el campo device_ts (milisegundos desde 1970).
// netPostReading(json): POST a SERVER_URL con Content-Type application/json y header x-api-key = API_KEY, timeout 3 s.
//   Si SERVER_URL empieza por https:// usar WiFiClientSecure (setInsecure() solo durante el desarrollo; documentar el riesgo); si es http:// usar WiFiClient.
//   Devolver el código HTTP (201 = guardado) o -1 si falló la conexión.
//
// Depende de: net.h, config.h
// Referencia: docs/api-contract.md (POST /readings)
// Hecho cuando: con el backend local encendido, el POST devuelve 201 y la fila aparece en readings.
