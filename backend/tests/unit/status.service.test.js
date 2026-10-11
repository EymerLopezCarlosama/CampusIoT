// PROMPT — tests/unit/status.service.test.js (tarea 4.5)
//
// Pruebas con vitest de services/status.service.js (funciones puras, sin BD):
//  - Gastronomía: radar A con objetivo dentro de la banda de la mesa 2 → tables_occupied 1 y estado "parcial".
//  - Gastronomía: 3 mesas de A + mesa B ocupadas → 4 y "lleno"; ninguna → 0 y "libre".
//  - Objetivo fuera de todas las bandas (pasillo) → no cuenta.
//  - Sótano: energía promedio de la ventana por debajo de umbral_personas → "libre"; entre umbrales → "con_personas"; sobre umbral_lleno → "lleno".
//  - Lectura sin objetivo (present false) → 0 mesas.
//  - estadoConConexion(): última lectura de hace 31 s → "sin_conexion"; hace 5 s → estado normal.
//
// Depende de: services/status.service.js
// Hecho cuando: `npm test` pasa y cubre los umbrales (cada cambio de calibración se puede probar sin hardware).
