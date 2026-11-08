#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>
#include "config.h"

struct RadarReading {
    const char* id;
    bool present;
    const char* target; // "none", "moving", "static", "both"
    uint16_t distance_cm;
    uint8_t energy;
};

struct SensorSnapshot {
    float temperature;
    float humidity;
    int noise_level;
    RadarReading radars[RADAR_COUNT];
};

void sensorsBegin();
void sensorsUpdate();   // Llamar en cada vuelta del loop() para mantener el radar al día
SensorSnapshot sensorsRead();

#endif // SENSORS_H