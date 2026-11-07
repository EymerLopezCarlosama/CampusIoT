// Copiar a config.h (está en .gitignore) y completar. NUNCA subir config.h al repositorio.
#pragma once

// --- Identidad del nodo ---
#define NODE_NAME      "nodo-gastronomia"   // o "nodo-sotano"
#define RADAR_COUNT    2                    // 2 en Gastronomía (zonas A y B), 1 en Sótano (zona S)
#define RADAR_IDS      { "A", "B" }         // Sótano: { "S" }

// --- Red ---
#define WIFI_SSID      "CAMBIAR"
#define WIFI_PASSWORD  "CAMBIAR"
#define SERVER_URL     "http://192.168.1.50:3000/api/readings"   // en línea: https://<tu-servicio>.onrender.com/api/readings
#define API_KEY        "dev-key-gastronomia"                      // la de la tabla nodo (columna clave_api)

// --- Tiempos ---
#define SEND_INTERVAL_MS 3000               // OE2: retardo máximo 10 s (ver docs/arquitectura.md)

// --- Pines (ver docs/hardware/pines-y-cableado.md) ---
#define PIN_RADAR1_RX  16                   // TX del radar #1
#define PIN_RADAR1_TX  17
#define PIN_RADAR2_RX  26                   // TX del radar #2
#define PIN_RADAR2_TX  27
#define PIN_DHT        4
#define PIN_MIC        32                   // ADC1
#define PIN_LED        2
