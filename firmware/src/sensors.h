// PROMPT — sensors.h (tarea 3.1)
//
// Declarar la interfaz de sensores. Estructuras: RadarReading { const char* id; bool present; const char* target; int distance_cm; int energy; } y SensorSnapshot { float temperature; float humidity; int noise_level; RadarReading radars[RADAR_COUNT]; } (NaN en temperatura/humedad si el DHT22 falló).
// Funciones: void sensorsBegin(); SensorSnapshot sensorsRead();
//
// Depende de: config.h
// Hecho cuando: main.cpp puede incluirlo y llamar sensorsRead() sin saber nada del hardware.
