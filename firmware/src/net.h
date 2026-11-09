// Red del nodo: WiFi, hora NTP y envío HTTP (F6 y F7). main.cpp no necesita conocer WiFi ni HTTP.
#pragma once
#include <Arduino.h>
#include "config.h"

void netBegin();                          // conecta al WiFi; bloquea como máximo ~10 s
void netLoop();                           // llamar en cada vuelta de loop(): reintenta si no hay WiFi
bool netConnected();
bool netSyncTime();                       // true cuando la hora NTP ya es válida (no bloquea)
String netIp();                           // "" si no hay WiFi
String netUtc();                          // "2026-11-09 15:52:10 UTC", o "" si la hora aún no está lista
int netPostReading(const String& json);   // F7: devuelve el código HTTP o -1