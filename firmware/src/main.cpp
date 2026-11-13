// Programa del nodo (F8): lee sensores, envía el JSON del contrato y se recupera solo de fallos de red.
#include <Arduino.h>
#include <ArduinoJson.h>
#include "config.h"
#include "sensors.h"
#include "net.h"

static const bool MOSTRAR_JSON = false;                      // true imprime el JSON enviado (pruebas)
static const unsigned long SIN_ENVIO_REINICIO_MS = 300000;   // 5 min sin poder enviar -> reinicio
static const unsigned long LED_PARPADEO_MS = 500;

static unsigned long ultimoLatido = 0;
static unsigned long contador = 0;
static unsigned long enviosOk = 0;
static unsigned long enviosFallidos = 0;
static unsigned long ultimoEnvioOk = 0;
static bool envioOk = false;            // resultado del último envío
static bool ledEncendido = false;
static unsigned long ultimoParpadeo = 0;

static void imprimirValor(const char* nombre, float valor, const char* unidad) {
    Serial.print(nombre);
    Serial.print("=");
    if (isnan(valor)) Serial.print("NaN");
    else { Serial.print(valor, 1); Serial.print(unidad); }
    Serial.print("  ");
}

static float redondear1(float v) { return roundf(v * 10.0f) / 10.0f; }

// JSON de docs/api-contract.md (POST /readings). NaN del DHT22 -> null. Sin audio: solo el índice de ruido.
static String armarJson(const SensorSnapshot& s) {
    JsonDocument doc;
    uint64_t ts = netNowMs();
    if (ts > 0) doc["device_ts"] = ts;  // opcional: sin hora NTP válida no se envía
    if (isnan(s.temperature)) doc["temperature"] = nullptr; else doc["temperature"] = redondear1(s.temperature);
    if (isnan(s.humidity)) doc["humidity"] = nullptr; else doc["humidity"] = redondear1(s.humidity);
    doc["noise_level"] = s.noise_level;
    JsonArray radars = doc["radars"].to<JsonArray>();
    for (int i = 0; i < RADAR_COUNT; i++) {
        JsonObject r = radars.add<JsonObject>();
        r["id"] = s.radars[i].id;
        r["present"] = s.radars[i].present;
        r["target"] = s.radars[i].target;
        r["distance_cm"] = s.radars[i].distance_cm;
        r["energy"] = s.radars[i].energy;
    }
    String salida;
    serializeJson(doc, salida);
    return salida;
}

// LED de estado (docs/hardware/pines-y-cableado.md): fijo = enviando bien · parpadeo = sin WiFi o sin servidor.
static void actualizarLed(unsigned long ahora) {
    if (envioOk) {
        digitalWrite(PIN_LED, HIGH);
        return;
    }
    if (ahora - ultimoParpadeo >= LED_PARPADEO_MS) {
        ultimoParpadeo = ahora;
        ledEncendido = !ledEncendido;
        digitalWrite(PIN_LED, ledEncendido ? HIGH : LOW);
    }
}

void setup() {
    Serial.begin(115200);
    pinMode(PIN_LED, OUTPUT);
    digitalWrite(PIN_LED, LOW);
    sensorsBegin();
    Serial.printf("\n[%s] arranque OK (radares: %d)\n", NODE_NAME, RADAR_COUNT);

    netBegin();
    if (netConnected()) {
        Serial.printf("WiFi conectado, IP %s\n", netIp().c_str());
        netSyncTime();           // arranca el NTP cuanto antes
        sensorsCalibrarFondo();  // fondo de ruido con el WiFi activo: mantén silencio ~1 s
    } else {
        Serial.println("WiFi: sin conexion (se sigue reintentando)");
    }
    ultimoEnvioOk = millis();    // los 5 min sin enviar se cuentan desde el arranque
}

void loop() {
    sensorsUpdate();  // mantiene al día los radares en cada vuelta
    netLoop();        // reintenta el WiFi si se cayó
    unsigned long ahora = millis();

    if (ahora - ultimoLatido >= SEND_INTERVAL_MS) {
        ultimoLatido = ahora;
        contador++;

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

        int codigo = -1;
        if (netConnected()) {
            netSyncTime();
            String json = armarJson(s);
            if (MOSTRAR_JSON) Serial.println("   json: " + json);
            codigo = netPostReading(json);
        }

        envioOk = (codigo == 201);
        if (envioOk) {
            enviosOk++;
            ultimoEnvioOk = millis();
            Serial.println("   POST -> 201 guardado");
        } else {
            enviosFallidos++;
            if (!netConnected()) Serial.println("   POST omitido: sin WiFi");
            else if (codigo > 0) Serial.printf("   POST -> %d (rechazado por el servidor)\n", codigo);
            else Serial.println("   POST -> sin respuesta del servidor");
        }
        Serial.printf("   envios: %lu ok, %lu fallidos\n", enviosOk, enviosFallidos);
    }

    if (millis() - ultimoEnvioOk > SIN_ENVIO_REINICIO_MS) {
        Serial.println("5 min sin poder enviar: reiniciando");
        delay(200);
        ESP.restart();
    }
    actualizarLed(millis());
}