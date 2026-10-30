// PROMPT — services/status.service.js — Cálculo del estado (HU-02, HU-04, HU-06) · NÚCLEO DEL SISTEMA
//
// Funciones PURAS (sin BD, sin red) para poder probarlas con vitest:
//  - mesasOcupadas(lecturasVentana, zonas): el LD2410C entrega UN solo objetivo por radar y lectura, así que una mesa cuenta como ocupada si en la ventana (config.ventana_s, la lectura actual incluida) algún radar de su zona tuvo present=true con distance_cm dentro de su banda. Las bandas son [min_cm, max_cm) (mínimo incluido, máximo excluido; en el seed 150 y 300 son borde de dos mesas). Cuenta mesas distintas. Una zona de 1 mesa (B) cuenta 1 si hubo present en la ventana. Distancia fuera de toda banda = no cuenta.
//  - estadoGastronomia(ocupadas, totalMesas): 0 → "libre" · 1 a total-1 → "parcial" · total → "lleno".
//  - estadoSotano(lecturasVentana, config): índice = energía promedio de las lecturas de los últimos config.ventana_s segundos (energía 0 cuando no hay presencia); < umbral_personas → "libre" · < umbral_lleno → "con_personas" · si no "lleno".
//  - calcularEstado(espacio, zonas, config, lecturasVentana) → { state, tables_occupied } (tables_occupied = null en modo "espacio"). lecturasVentana incluye la lectura actual; sirve a ambos modos.
//  - estadoConConexion(estado, ultimaLecturaTs, ahora, offlineAfterS) → "sin_conexion" si pasaron más de offlineAfterS segundos.
//
// Los umbrales llegan por parámetro (de la BD): nunca escribir números fijos aquí.
// Referencia: docs/arquitectura.md ("Cálculo del estado") · tests/unit/status.service.test.js
// Hecho cuando: las pruebas unitarias pasan y cambiar un umbral en la BD cambia el estado sin tocar este archivo.
