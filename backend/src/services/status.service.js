// PROMPT — services/status.service.js — Cálculo del estado (HU-02, HU-04, HU-06) · NÚCLEO DEL SISTEMA
//
// Funciones PURAS (sin BD, sin red) para poder probarlas con vitest:
//  - mesasOcupadas(radars, zonas): por cada radar con present=true busca en las bandas de su zona (zone_tables) la mesa cuyo rango [min_cm, max_cm] contiene distance_cm; cuenta mesas distintas ocupadas. Una zona de 1 mesa (B) cuenta 1 si present. Distancia fuera de toda banda = no cuenta.
//  - estadoGastronomia(ocupadas, totalMesas): 0 → "libre" · 1 a total-1 → "parcial" · total → "lleno".
//  - estadoSotano(lecturasVentana, config): índice = energía promedio de las lecturas de los últimos config.ventana_s segundos (energía 0 cuando no hay presencia); < umbral_personas → "libre" · < umbral_lleno → "con_personas" · si no "lleno".
//  - calcularEstado(espacio, radars, zonas, config, lecturasVentana) → { state, tables_occupied } (tables_occupied = null en modo "espacio").
//  - estadoConConexion(estado, ultimaLecturaTs, ahora, offlineAfterS) → "sin_conexion" si pasaron más de offlineAfterS segundos.
//
// Los umbrales llegan por parámetro (de la BD): nunca escribir números fijos aquí.
// Referencia: docs/arquitectura.md ("Cálculo del estado") · tests/unit/status.service.test.js
// Hecho cuando: las pruebas unitarias pasan y cambiar un umbral en la BD cambia el estado sin tocar este archivo.
