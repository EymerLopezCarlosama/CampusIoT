// Red del nodo. F6: WiFi con reconexión y hora NTP. El POST HTTP se agrega en F7.
#include "net.h"
#include <WiFi.h>
#include <time.h>

static const unsigned long NET_CONEXION_MAX_MS = 10000;  // máximo que bloquea netBegin()
static const unsigned long NET_REINTENTO_MS = 15000;     // cada cuánto se reintenta sin WiFi
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

int netPostReading(const String& json) {
    (void)json;
    return -1;  // F7
}