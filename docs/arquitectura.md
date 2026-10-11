# Arquitectura (tarea 2.1)

```
[ESP32 Estudio Gastronomía]──┐
  2 radares LD2410C (A, B)   │  HTTP POST /api/readings cada 3 s
  DHT22 + MAX4466            ├──> Backend Node/Express ──> PostgreSQL ──┐
[ESP32 Sótano]───────────────┘     · valida x-api-key                   │
  1 radar LD2410C (S)              · calcula el estado                   │
  DHT22 + MAX4466                  · guarda la lectura                   │
                                                                         │
Navegador (frontend, mismo servidor) ── GET /api/spaces cada 3 s <───────┘
```

## Decisiones
| Tema | Decisión | Por qué |
|---|---|---|
| Transporte nodo → servidor | HTTP POST con JSON | Solo 2 nodos; más simple que MQTT y fácil de probar con `curl` y con el simulador |
| Actualización de la página | Consulta (polling) cada 3 s | Suficiente para OE2 (≤ 10 s) y sin complicar el servidor |
| Base de datos | PostgreSQL (Docker local, Supabase en línea) | Plan gratuito, JSONB para la lectura cruda de los radares |
| Backend + página | Un solo servicio Express que también sirve `frontend/` | Un solo despliegue gratuito y sin problemas de CORS |
| Radar | LD2410C por UART (distancia y energía), no solo el pin OUT | El pin OUT solo dice "hay alguien"; para saber **qué mesa** hace falta la distancia |
| Umbrales | En la BD (`zone_tables`, `space_config`) | Se calibran sin recompilar ni redesplegar |

## Presupuesto de retardo (OE2: máximo 10 s)
Peor caso = intervalo de envío (3 s) + red y servidor (≤ 1 s) + intervalo de consulta de la página (3 s) = **7 s**.
Con 5 s en ambos lados el peor caso sería 11 s, por eso se usa 3 s.

## Cálculo del estado (`backend/src/services/status.service.js`)
- **Gastronomía (modo `mesas`)**: una mesa está ocupada si el radar de su zona detecta un objetivo cuya distancia cae dentro de la banda de esa mesa (`zone_tables`). `tables_occupied` = suma de mesas ocupadas. Estado: 0 = **libre**, 1 a 3 = **parcial**, 4 = **lleno**.
- **Sótano (modo `espacio`)**: un solo radar y mesas juntas. Índice de ocupación = energía promedio de la ventana (`ventana_s`, 60 s por defecto). Menor que `umbral_personas` = **libre**; entre ambos = **con_personas**; mayor o igual que `umbral_lleno` = **lleno**.
- **sin_conexion**: la última lectura del nodo tiene más de `OFFLINE_AFTER_S` (30 s). No se guarda en `readings`; se calcula al consultar.

## Seguridad y privacidad
- Cada nodo tiene su `api_key`; el backend rechaza lecturas sin ella (401).
- No hay cámaras ni audio: el micrófono solo entrega un nivel sonoro 0-100 calculado en el nodo.
- No se guardan datos personales. La encuesta QR es externa y voluntaria.

## Riesgos técnicos
| Riesgo | Mitigación |
|---|---|
| La red del campus puede exigir usuario y contraseña (WPA2-Enterprise) o portal cautivo | Preguntar el tipo de red en la tarea 1.1; plan B: punto de acceso del celular durante la jornada |
| El servicio gratuito del backend se "duerme" sin tráfico | Los nodos envían cada 3 s, así que lo mantienen despierto; abrir la página 1 minuto antes de la jornada |
| Un radar detecta mal a personas quietas | Usar energía estática además de la móvil y calibrar con personas sentadas (tarea 4.3) |
