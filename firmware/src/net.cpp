// Red del nodo. F6: WiFi con reconexión y hora NTP. F7: envío HTTP del JSON.
#include "net.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <sys/time.h>
#include <time.h>

static const unsigned long NET_CONEXION_MAX_MS = 10000;  // máximo que bloquea netBegin()
static const unsigned long NET_REINTENTO_MS = 15000;     // cada cuánto se reintenta sin WiFi
static const unsigned long HTTP_CONEXION_MS = 1500;      // timeout para abrir la conexión
static const unsigned long HTTP_RESPUESTA_MS = 2500;     // timeout para recibir la respuesta
static const int NET_INTENTOS = 2;                       // intentos por envío si falla la conexión
static const time_t HORA_VALIDA_DESDE = 1700000000;      // si time() supera esto, el NTP ya sincronizó
static unsigned long ultimoIntento = 0;
static bool ntpIniciado = false;

void netBegin() {
    WiFi.persistent(false);
    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(true);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    ultimoIntento = millis();

    unsigned long inicio = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - inicio < NET_CONEXION_MAX_MS) {
        delay(100);  // solo durante el arranque
    }
}

void netLoop() {
    if (WiFi.status() == WL_CONNECTED) return;
    unsigned long ahora = millis();
    if (ahora - ultimoIntento < NET_REINTENTO_MS) return;
    ultimoIntento = ahora;
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

bool netConnected() {
    return WiFi.status() == WL_CONNECTED;
}

bool netSyncTime() {
    if (!netConnected()) return false;
    if (!ntpIniciado) {
        configTime(0, 0, "pool.ntp.org", "time.google.com");  // hora UTC
        ntpIniciado = true;
    }
    return time(nullptr) > HORA_VALIDA_DESDE;
}

String netIp() {
    return netConnected() ? WiFi.localIP().toString() : String("");
}

String netUtc() {
    time_t t = time(nullptr);
    if (t < HORA_VALIDA_DESDE) return "";
    struct tm tmv;
    gmtime_r(&t, &tmv);
    char buf[24];
    strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", &tmv);
    return String(buf) + " UTC";
}

uint64_t netNowMs() {
    struct timeval tv;
    gettimeofday(&tv, nullptr);
    if (tv.tv_sec < HORA_VALIDA_DESDE) return 0;  // el NTP aún no sincronizó
    return (uint64_t)tv.tv_sec * 1000ULL + (uint64_t)(tv.tv_usec / 1000);
}

// POST con cabeceras del contrato. Sirve igual para WiFiClient (http) y WiFiClientSecure (https).
template <typename Cliente>
static int enviar(HTTPClient& http, Cliente& cliente, const String& json) {
    http.setReuse(false);                      // cierra la conexión al terminar; no la deja abierta
    http.setConnectTimeout(HTTP_CONEXION_MS);
    http.setTimeout(HTTP_RESPUESTA_MS);
    if (!http.begin(cliente, SERVER_URL)) return -1;
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", API_KEY);
    int codigo = http.POST(json);
    if (codigo <= 0) Serial.printf("   [net] error HTTP %d: %s\n", codigo, http.errorToString(codigo).c_str());
    http.end();
    return codigo > 0 ? codigo : -1;  // los códigos negativos son errores de conexión
}

// Un intento de envío. IMPORTANTE: el cliente se declara ANTES que HTTPClient para que se destruya DESPUÉS.
static int intentarEnvio(const String& json) {
    if (String(SERVER_URL).startsWith("https://")) {
        WiFiClientSecure cliente;
        // RIESGO (solo desarrollo): setInsecure() no valida el certificado del servidor, así que
        // alguien en la red podría hacerse pasar por él. Antes de la entrega final, cargar el
        // certificado raíz con cliente.setCACert(...) y quitar esta línea.
        cliente.setInsecure();
        HTTPClient http;
        return enviar(http, cliente, json);
    }
    WiFiClient cliente;
    HTTPClient http;
    return enviar(http, cliente, json);
}

int netPostReading(const String& json) {
    if (!netConnected()) return -1;
    for (int intento = 1; intento <= NET_INTENTOS; intento++) {
        int codigo = intentarEnvio(json);
        if (codigo > 0) return codigo;  // el servidor respondió (201, 401, 400...): no se reintenta
        delay(100);                     // pausa corta antes de reintentar
    }
    return -1;
}