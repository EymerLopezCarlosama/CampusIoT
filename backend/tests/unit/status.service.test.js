// PROMPT — tests/unit/status.service.test.js (tarea 4.5)
//
// Pruebas con vitest de services/status.service.js (funciones puras, sin BD):
//  - Gastronomía: radar A con objetivo dentro de la banda de la mesa 2 → tables_occupied 1 y estado "parcial".
//  - Gastronomía con ventana: en la ventana el radar A tuvo objetivo en la mesa 1, luego en la 3 → tables_occupied 2 (una sola lectura nunca ve dos mesas).
//  - Bandas [min, max): distancia 150 cuenta para la mesa 2 (no para la 1); 449 para la 3; 450 queda fuera.
//  - Gastronomía: 3 mesas de A + mesa B ocupadas → 4 y "lleno"; ninguna → 0 y "libre".
//  - Objetivo fuera de todas las bandas (pasillo) → no cuenta.
//  - Sótano: energía promedio de la ventana por debajo de umbral_personas → "libre"; entre umbrales → "con_personas"; sobre umbral_lleno → "lleno".
//  - Lectura sin objetivo (present false) → 0 mesas.
//  - estadoConConexion(): última lectura de hace 31 s → "sin_conexion"; hace 5 s → estado normal.
//
// Mientras no estén escritos, dejar los casos como it.todo("...") para que `npm test` los muestre pendientes.
//
// Depende de: services/status.service.js
// Hecho cuando: `npm test` pasa y cubre los umbrales (cada cambio de calibración se puede probar sin hardware).

import { describe, it } from "vitest";

// Casos pendientes (B5). Reemplazar cada it.todo por una prueba real.
describe("status.service", () => {
  it.todo("Gastronomía: radar A en banda de la mesa 2 → 1 mesa y 'parcial'");
  it.todo("Gastronomía con ventana: mesa 1 y luego mesa 3 dentro de ventana_s → 2 mesas");
  it.todo("Bandas [min, max): 150 cuenta para la mesa 2; 450 queda fuera");
  it.todo("Gastronomía: 3 mesas de A + mesa B → 4 y 'lleno'; ninguna → 0 y 'libre'");
  it.todo("Objetivo fuera de toda banda (pasillo) → no cuenta");
  it.todo("Sótano: energía promedio vs umbral_personas y umbral_lleno");
  it.todo("Lectura sin objetivo (present false) → 0 mesas");
  it.todo("estadoConConexion: hace 31 s → 'sin_conexion'; hace 5 s → estado normal");
});
