// Programa del nodo (F6): latido con sensores, estado del WiFi y hora UTC.
#include <Arduino.h>
#include "config.h"
#include "sensors.h"
#include "net.h"

static const unsigned long LED_ENCENDIDO_MS = 200;
static unsigned long ultimoLatido = 0;
static unsigned long contador = 0;
static bool ledEncendido = false;

static void imprimirValor(const char* nombre, float valor, const char* unidad) {
    Serial.print(nombre);
    Serial.print("=");
    if (isnan(valor)) Serial.print("NaN");
    else { Serial.print(valor, 1); Serial.print(unidad); }
    Serial.print("  ");
}

void setup() {
    Serial.begin(115200);
    pinMode(PIN_LED, OUTPUT);
    digitalWrite(PIN_LED, LOW);
    sensorsBegin();
    Serial.printf("\n[%s] arranque OK (radares: %d)\n", NODE_NAME, RADAR_COUNT);

    netBegin();
    if (netConnected()) Serial.printf("WiFi conectado, IP %s\n", netIp().c_str());
    else Serial.println("WiFi: sin conexion (se sigue reintentando)");
}

void loop() {
    sensorsUpdate();  // mantiene al día los radares en cada vuelta
    netLoop();        // reintenta el WiFi si se cayó
    unsigned long ahora = millis();

    if (ahora - ultimoLatido >= SEND_INTERVAL_MS) {
        ultimoLatido = ahora;
        contador++;
        digitalWrite(PIN_LED, HIGH);
        ledEncendido = true;

        SensorSnapshot s = sensorsRead();
        Serial.printf("latido #%lu  ", contador);
        imprimirValor("temp", s.temperature, " C");
        imprimirValor("hum", s.humidity, " %");
        Serial.printf("ruido=%d\n", s.noise_level);
        for (int i = 0; i < RADAR_COUNT; i++) {
            Serial.printf("   radar %s: present=%d target=%s dist=%d cm energia=%d\n",
                          s.radars[i].id, s.radars[i].present, s.radars[i].target,
                          s.radars[i].distance_cm, s.radars[i].energy);
        }

        if (netConnected()) Serial.printf("   red: WiFi OK  IP=%s", netIp().c_str());
        else Serial.print("   red: SIN WiFi");
        if (netSyncTime()) Serial.printf("  hora=%s", netUtc().c_str());
        Serial.println();
    }

    if (ledEncendido && ahora - ultimoLatido >= LED_ENCENDIDO_MS) {
        digitalWrite(PIN_LED, LOW);
        ledEncendido = false;
    }
}