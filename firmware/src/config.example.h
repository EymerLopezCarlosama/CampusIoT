// Copiar a config.h (está en .gitignore) y completar. NUNCA subir config.h al repositorio.
#pragma once

// --- Identidad del nodo: UNA PLACA POR RADAR ---
// La placa se elige al compilar con el entorno de platformio.ini: placa1 (zona A), placa2 (zona B), placa3 (zona S).
#ifndef PLACA_ID
#define PLACA_ID 1
#endif
#if PLACA_ID == 1                                // Gastronomía, zona A
  #define NODE_NAME      "nodo-gastronomia"
  #define RADAR_COUNT    1
  #define RADAR_IDS      { "A" }
  #define API_KEY        "dev-key-gastronomia"   // la de la tabla nodo (columna clave_api); en producción cámbiala
#elif PLACA_ID == 2                              // Gastronomía, zona B
  #define NODE_NAME      "nodo-gastronomia"
  #define RADAR_COUNT    1
  #define RADAR_IDS      { "B" }
  #define API_KEY        "dev-key-gastronomia"
#elif PLACA_ID == 3                              // Sótano, zona S
  #define NODE_NAME      "nodo-sotano"
  #define RADAR_COUNT    1
  #define RADAR_IDS      { "S" }
  #define API_KEY        "dev-key-sotano"
#else
  #error "PLACA_ID debe ser 1, 2 o 3"
#endif

// --- Red ---
#define WIFI_SSID      "CAMBIAR"
#define WIFI_PASSWORD  "CAMBIAR"
#define SERVER_URL     "http://192.168.1.50:3000/api/readings"   // en línea: https://<tu-servicio>.onrender.com/api/readings

// --- Tiempos ---
#define SEND_INTERVAL_MS 3000               // OE2: retardo máximo 10 s (ver docs/arquitectura.md)

// --- Pines (ver docs/hardware/pines-y-cableado.md) ---
#define PIN_RADAR1_RX  16                   // TX del radar #1
#define PIN_RADAR1_TX  17
#define PIN_RADAR2_RX  26                   // TX del radar #2 (no se usa con una placa por radar)
#define PIN_RADAR2_TX  27
#define PIN_DHT        4
#define PIN_MIC        32                   // ADC1
#define PIN_LED        2