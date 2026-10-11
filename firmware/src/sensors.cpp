// PROMPT — sensors.cpp (tarea 3.1)
//
// Implementar sensorsBegin() y sensorsRead().
// Radares LD2410C (librería ld2410) por UART: radar 1 en Serial2 (PIN_RADAR1_RX/TX), radar 2 en Serial1 reasignada (PIN_RADAR2_RX/TX), 256000 baudios.
//   Por radar: presencia, tipo de objetivo (moving/static/both/none), distancia (cm) y energía (0-100) del objetivo más fuerte. Si no hay objetivo: distancia 0 y energía 0.
// DHT22 (librería DHT) en PIN_DHT: temperatura y humedad; respetar el mínimo de 2 s entre lecturas (reutilizar la última lectura válida si se pide antes). Valor NaN si falla.
// MAX4466 en PIN_MIC (ADC1): muestrear una ventana de ~100 ms, calcular pico a pico, restar el ruido de fondo y convertir a un índice 0-100. SOLO nivel sonoro: nunca guardar ni enviar muestras de audio.
//
// Depende de: sensors.h, config.h
// Referencia: docs/hardware/pines-y-cableado.md
// Hecho cuando: el monitor serial imprime temperatura, humedad, ruido y distancia/energía de cada radar, y reaccionan al acercarse una persona.
