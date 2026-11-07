// Programa del nodo (F1): arranque por serial y LED con latido cada SEND_INTERVAL_MS.
#include <Arduino.h>
#include "config.h"

static const unsigned long LED_ENCENDIDO_MS = 200;
static unsigned long ultimoLatido = 0;
static unsigned long contador = 0;
static bool ledEncendido = false;

void setup() {
    Serial.begin(115200);
    pinMode(PIN_LED, OUTPUT);
    digitalWrite(PIN_LED, LOW);
    Serial.printf("\n[%s] arranque OK (radares: %d)\n", NODE_NAME, RADAR_COUNT);
}

void loop() {
    unsigned long ahora = millis();

    if (ahora - ultimoLatido >= SEND_INTERVAL_MS) {
        ultimoLatido = ahora;
        contador++;
        digitalWrite(PIN_LED, HIGH);
        ledEncendido = true;
        Serial.printf("latido #%lu (t=%lu ms)\n", contador, ahora);
    }

    if (ledEncendido && ahora - ultimoLatido >= LED_ENCENDIDO_MS) {
        digitalWrite(PIN_LED, LOW);
        ledEncendido = false;
    }
}