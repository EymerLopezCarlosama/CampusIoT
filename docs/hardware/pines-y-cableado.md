# Pines y cableado de los nodos (tarea 4.1)

Placa: ESP32 DevKit (ESP-WROOM-32). **Verificar contra la serigrafía de la placa real antes de soldar o conectar.**  
Compras: 3 ESP32, 3 radares, 3 DHT22 y 3 MAX4466 (pack): Las 3 placas quedan en uso (A, B y S), sin repuesto.

| Sensor | Pin del sensor | Pin ESP32 | Notas |
|---|---|---|---|
| Radar LD2410C **#1** (Gastronomía zona A, Sótano zona S) | TX → | GPIO16 (RX2) | UART2, 256000 baudios |
| | RX ← | GPIO17 (TX2) | |
| | VCC / GND | 5V (VIN) / GND | Consume ~80 mA; señales a 3,3 V |
| Radar LD2410C **#2** (solo Gastronomía, zona B) | TX → | GPIO26 | UART1 reasignada (los pines por defecto de UART1 están ocupados por la flash). No se usa con una placa por radar; queda disponible si una placa necesita dos. |
| | RX ← | GPIO27 | |
| | VCC / GND | 5V (VIN) / GND | |
| DHT22 | DATA | GPIO4 | Resistencia de 10 kΩ entre DATA y 3,3 V si el módulo no la trae |
| | VCC / GND | 3V3 / GND | |
| MAX4466 | OUT | GPIO32 (ADC1_CH4) | Usar ADC1: el ADC2 deja de funcionar cuando el WiFi está activo |
| | VCC / GND | 3V3 / GND | Ajustar la ganancia con el potenciómetro hasta no saturar |
| LED de estado | — | GPIO2 (LED de la placa) | Fijo = enviando bien · parpadeo = sin WiFi o sin servidor |

## Alimentación
Fuente 5 V 2 A al puerto micro-USB (o VIN). Los radares y el ESP32 caben holgados.  
Los radares deben quedar a 1,5-2,5 m de altura apuntando hacia las mesas, sin paredes metálicas cerca (ver `docs/calibracion/protocolo-calibracion.md`).

## Qué lleva cada nodo
Cada placa ESP32 lleva **un** radar, un DHT22 y un MAX4466. Gastronomía usa dos placas con la misma clave de `nodo-gastronomia`, una por zona. La placa se elige al subir con el entorno de `firmware/platformio.ini`.

| Placa | Entorno | Nodo (clave en `x-api-key`) | `RADAR_IDS` (zona) |
|---|---|---|---|
| 1 | `placa1` | nodo-gastronomia | `{ "A" }` |
| 2 | `placa2` | nodo-gastronomia | `{ "B" }` |
| 3 | `placa3` | nodo-sotano | `{ "S" }` |