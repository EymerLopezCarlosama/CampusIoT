// Sensores del nodo. F2: solo DHT22; ruido y radares se completan en F3-F5.
#include "sensors.h"
#include <DHT.h>

static DHT dht(PIN_DHT, DHT22);
static const char* RADAR_IDS_LISTA[RADAR_COUNT] = RADAR_IDS;

static const unsigned long DHT_MIN_INTERVAL_MS = 2000;  // mínimo entre lecturas del DHT22
static bool dhtIntentado = false;
static unsigned long dhtUltimoIntento = 0;
static float dhtTemp = NAN;
static float dhtHum = NAN;

static void actualizarDht() {
    unsigned long ahora = millis();
    if (dhtIntentado && ahora - dhtUltimoIntento < DHT_MIN_INTERVAL_MS) return;  // reutiliza la última
    dhtIntentado = true;
    dhtUltimoIntento = ahora;

    float h = dht.readHumidity();
    float t = dht.readTemperature();
    if (isnan(h) || isnan(t)) {
        dhtTemp = NAN;
        dhtHum = NAN;
    } else {
        dhtTemp = t;
        dhtHum = h;
    }
}

void sensorsBegin() {
    dht.begin();
}

SensorSnapshot sensorsRead() {
    actualizarDht();

    SensorSnapshot s;
    s.temperature = dhtTemp;
    s.humidity = dhtHum;
    s.noise_level = 0;  // F3
    for (int i = 0; i < RADAR_COUNT; i++) {  // F4-F5
        s.radars[i] = { RADAR_IDS_LISTA[i], false, "none", 0, 0 };
    }
    return s;
}