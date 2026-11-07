// Programa del nodo (F2): latido cada SEND_INTERVAL_MS e impresión de temperatura y humedad.
#include <Arduino.h>
#include "config.h"
#include "sensors.h"

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
}

void loop() {
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
        Serial.println();
    }

    if (ledEncendido && ahora - ultimoLatido >= LED_ENCENDIDO_MS) {
        digitalWrite(PIN_LED, LOW);
        ledEncendido = false;
    }
}