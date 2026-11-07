// Sensores del nodo. F2: DHT22. F3: micrófono MAX4466 (solo nivel sonoro, nunca audio). Radares: F4-F5.
#include "sensors.h"
#include <DHT.h>

static DHT dht(PIN_DHT, DHT22);
static const char* RADAR_IDS_LISTA[RADAR_COUNT] = RADAR_IDS;

// ---------- DHT22 (F2) ----------
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

// ---------- Micrófono MAX4466 (F3) ----------
static const unsigned long MIC_VENTANA_MS = 100;  // ventana de muestreo
static const int MIC_VENTANAS_FONDO = 5;          // ventanas que se miden al arrancar para el ruido de fondo
static const int MIC_P2P_MAX = 800;            // pico a pico sobre el fondo (cuentas ADC) que da índice 100; provisional hasta la calibración
static const bool MIC_DEBUG = true;               // imprime el pico a pico crudo; poner en false al terminar la prueba
static int micFondo = 0;

// Pico a pico (cuentas ADC 0-4095) durante una ventana de ~100 ms. Solo guarda mínimo y máximo.
static int leerPicoAPico() {
    unsigned long inicio = millis();
    int minimo = 4095;
    int maximo = 0;
    while (millis() - inicio < MIC_VENTANA_MS) {
        int muestra = analogRead(PIN_MIC);
        if (muestra < minimo) minimo = muestra;
        if (muestra > maximo) maximo = muestra;
    }
    return maximo - minimo;
}

static void medirFondoMic() {
    long suma = 0;
    for (int i = 0; i < MIC_VENTANAS_FONDO; i++) suma += leerPicoAPico();
    micFondo = (int)(suma / MIC_VENTANAS_FONDO);
}

// Índice 0-100 = (pico a pico - ruido de fondo) escalado. Nunca pasa de 100.
static int leerRuido() {
    int p2p = leerPicoAPico();
    if (p2p < micFondo) micFondo = p2p;  // el fondo solo baja si aparece un silencio más profundo
    int indice = (int)((long)(p2p - micFondo) * 100 / MIC_P2P_MAX);
    indice = constrain(indice, 0, 100);
    if (MIC_DEBUG) Serial.printf("[mic] p2p=%d fondo=%d\n", p2p, micFondo);
    return indice;
}

// ---------- Interfaz pública ----------
void sensorsBegin() {
    dht.begin();
    pinMode(PIN_MIC, INPUT);
    analogSetPinAttenuation(PIN_MIC, ADC_11db);  // lectura de 0 a 3,3 V
    medirFondoMic();                              // mantén silencio ~1 s al encender
}

SensorSnapshot sensorsRead() {
    actualizarDht();

    SensorSnapshot s;
    s.temperature = dhtTemp;
    s.humidity = dhtHum;
    s.noise_level = leerRuido();
    for (int i = 0; i < RADAR_COUNT; i++) {  // F4-F5
        s.radars[i] = { RADAR_IDS_LISTA[i], false, "none", 0, 0 };
    }
    return s;
}