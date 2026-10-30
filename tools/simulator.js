// PROMPT — tools/simulator.js (HU-11)
//
// Script de Node 20 (sin dependencias, usa fetch; tools/package.json declara type: module, así que se usa import) que simula los 2 nodos para desarrollar backend y página sin hardware.
// Uso: node tools/simulator.js [--url http://localhost:3000/api/readings] [--interval 3] [--escenario vacio|parcial|lleno|ciclo] [--caida sotano]
// Cada intervalo envía por nodo un POST con la clave del seed (dev-key-gastronomia, dev-key-sotano) y el JSON del contrato:
//   - Gastronomía: radares A y B; en "ciclo" cambia cada ~30 s entre libre → parcial → lleno; la distancia de A cae dentro de las bandas del seed (0-150, 150-300, 300-450 cm).
//   - Sótano: radar S con energía que sube y baja (0-100).
//   - Temperatura 22-27 °C, humedad 50-70 %, ruido 20-70, con variación suave (no saltos aleatorios).
//   - device_ts = Date.now(). Con --caida <nodo> ese nodo deja de enviar 60 s para probar "sin_conexion".
// Imprime una línea por envío con el código HTTP y el estado devuelto.
//
// Referencia: docs/api-contract.md ("Lecturas")
// Hecho cuando: con el backend encendido, la página muestra datos cambiando y el estado de Gastronomía pasa por libre, parcial y lleno.
