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
uint64_t netNowMs();                      // milisegundos desde 1970 (para device_ts); 0 si la hora aún no es válida
int netPostReading(const String& json);   // devuelve el código HTTP (201 = guardado) o -1 si falló la conexión