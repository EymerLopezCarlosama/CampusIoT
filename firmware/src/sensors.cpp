// Sensores del nodo. F2: DHT22. F3: micrófono MAX4466. F4: radar #1. Radar #2: F5.
#include "sensors.h"
#include <DHT.h>
#include <ld2410.h>

static DHT dht(PIN_DHT, DHT22);
static const char* RADAR_IDS_LISTA[RADAR_COUNT] = RADAR_IDS;

// ---------- DHT22 (F2) ----------
static const unsigned long DHT_MIN_INTERVAL_MS = 2000;
static bool dhtIntentado = false;
static unsigned long dhtUltimoIntento = 0;
static float dhtTemp = NAN;
static float dhtHum = NAN;

static void actualizarDht() {
    unsigned long ahora = millis();
    if (dhtIntentado && ahora - dhtUltimoIntento < DHT_MIN_INTERVAL_MS) return;
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
static const unsigned long MIC_VENTANA_MS = 100;
static const int MIC_VENTANAS_FONDO = 5;
static const int MIC_P2P_MAX = 800;      // Calibración F3
static const bool MIC_DEBUG = false;
static int micFondo = 0;

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

static int leerRuido() {
    int p2p = leerPicoAPico();
    if (p2p < micFondo) micFondo = p2p;
    int indice = (int)((long)(p2p - micFondo) * 100 / MIC_P2P_MAX);
    indice = constrain(indice, 0, 100);
    if (MIC_DEBUG) Serial.printf("[mic] p2p=%d fondo=%d\n", p2p, micFondo);
    return indice;
}

// ---------- Radares LD2410C (F4: radar #1 en Serial2 · F5: radar #2 en Serial1 reasignada) ----------
static const unsigned long RADAR_BAUDIOS = 256000;
static const unsigned long RADAR_SIN_TRAMA_MS = 1000;  // sin trama válida durante este tiempo = radar sin comunicación
static ld2410 radares[RADAR_COUNT];
static unsigned long radarUltimaTrama[RADAR_COUNT] = { 0 };

// Convierte la última trama del radar en un RadarReading (objetivo más fuerte).
static RadarReading leerRadar(ld2410& radar, const char* id, unsigned long ultimaTrama) {
    RadarReading r = { id, false, "none", 0, 0 };
    if (millis() - ultimaTrama > RADAR_SIN_TRAMA_MS) return r;  // radar mudo
    if (!radar.presenceDetected()) return r;

    bool moviendo = radar.movingTargetDetected();
    bool quieto = radar.stationaryTargetDetected();
    if (!moviendo && !quieto) return r;

    r.present = true;
    r.target = (moviendo && quieto) ? "both" : (moviendo ? "moving" : "static");

    // El LD2410C entrega un objetivo en movimiento y uno estático: se reporta el de más energía.
    bool usarMovimiento = moviendo && (!quieto || radar.movingTargetEnergy() >= radar.stationaryTargetEnergy());
    r.distance_cm = usarMovimiento ? radar.movingTargetDistance() : radar.stationaryTargetDistance();
    r.energy = usarMovimiento ? radar.movingTargetEnergy() : radar.stationaryTargetEnergy();
    return r;
}

// ---------- Interfaz pública ----------
void sensorsBegin() {
    dht.begin();
    pinMode(PIN_MIC, INPUT);
    analogSetPinAttenuation(PIN_MIC, ADC_11db);
    medirFondoMic();  // mantén silencio ~1 s al encender

    Serial2.setRxBufferSize(2048);
    Serial2.begin(RADAR_BAUDIOS, SERIAL_8N1, PIN_RADAR1_RX, PIN_RADAR1_TX);
    radares[0].begin(Serial2, false);  // false: no bloquea esperando al radar
#if RADAR_COUNT >= 2
    Serial1.setRxBufferSize(2048);
    Serial1.begin(RADAR_BAUDIOS, SERIAL_8N1, PIN_RADAR2_RX, PIN_RADAR2_TX);  // UART1 reasignada: sus pines por defecto son de la flash
    radares[1].begin(Serial1, false);
#endif
}

// Llamar en cada vuelta de loop(): vacía el buffer de cada radar y anota cuándo llegó su última trama válida.
void sensorsUpdate() {
    for (int i = 0; i < RADAR_COUNT; i++) {
        while (radares[i].read());
        if (radares[i].isConnected()) radarUltimaTrama[i] = millis();
    }
}

SensorSnapshot sensorsRead() {
    actualizarDht();
    int ruido = leerRuido();  // bloquea ~100 ms: se hace ANTES de leer los radares
    sensorsUpdate();          // vacía los buffers justo antes de mirar los radares

    SensorSnapshot s;
    s.temperature = dhtTemp;
    s.humidity = dhtHum;
    s.noise_level = ruido;
    for (int i = 0; i < RADAR_COUNT; i++) {
        s.radars[i] = leerRadar(radares[i], RADAR_IDS_LISTA[i], radarUltimaTrama[i]);
    }
    return s;
}