// Interfaz de sensores del nodo (F2 en adelante).
#pragma once
#include <Arduino.h>
#include "config.h"

struct RadarReading {
    const char* id;
    bool present;
    const char* target;   // "moving" | "static" | "both" | "none"
    int distance_cm;
    int energy;           // 0-100
};

struct SensorSnapshot {
    float temperature;    // NaN si el DHT22 falló
    float humidity;       // NaN si el DHT22 falló
    int noise_level;      // índice 0-100, nunca audio
    RadarReading radars[RADAR_COUNT];
};

void sensorsBegin();
SensorSnapshot sensorsRead();