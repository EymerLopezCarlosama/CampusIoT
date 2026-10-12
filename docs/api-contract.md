# Contrato de la API (nodos y frontend ↔ backend)

Base: `http://localhost:3000/api` · Formato: JSON · Fechas: ISO 8601 (UTC)

**Error estándar** (todas las rutas):
```json
{ "error": { "codigo": "API_KEY_INVALIDA", "mensaje": "La clave del nodo no es válida." } }
```
Códigos HTTP: 400 datos inválidos · 401 sin/errónea API key · 404 no existe · 409 conflicto · 500 error interno.

---
## Lecturas (HU-01) — la usa el nodo
**POST `/readings`** · header `x-api-key: <clave del nodo>` · body:
```json
{
  "device_ts": 1791600000000,
  "temperature": 24.6,
  "humidity": 58.2,
  "noise_level": 41,
  "radars": [
    { "id": "A", "present": true,  "target": "moving", "distance_cm": 210, "energy": 62 },
    { "id": "B", "present": false, "target": "none",   "distance_cm": 0,   "energy": 0 }
  ]
}
```
- `device_ts`: milisegundos desde 1970 (hora NTP del nodo). Opcional; sin él no se mide el retardo.
- `temperature` / `humidity` pueden ser `null` si el DHT22 falló esa vez.
- `radars[].id` debe existir en `zona.codigo` del nodo. `target`: `moving` | `static` | `both` | `none`.
- `distance_cm` y `energy` son los del objetivo más fuerte (0 si no hay).

→ `201`: `{ "id": 1234, "state": "parcial", "tables_occupied": 1 }`
Errores: `401 API_KEY_INVALIDA` · `400 DATOS_INVALIDOS` · `400 RADAR_DESCONOCIDO`

## Espacios (HU-02, HU-03, HU-04, HU-05)
**GET `/spaces`** →
```json
[
  { "slug": "gastronomia", "name": "Estudio Gastronomía", "mode": "mesas",
    "state": "parcial", "tables_occupied": 2, "total_tables": 4,
    "temperature": 24.6, "humidity": 58.2, "noise_level": 41,
    "last_reading_at": "2026-11-04T15:02:11Z", "seconds_since_last": 2 },
  { "slug": "sotano", "name": "Sótano", "mode": "espacio",
    "state": "sin_conexion", "tables_occupied": null, "total_tables": 7,
    "temperature": null, "humidity": null, "noise_level": null,
    "last_reading_at": "2026-11-04T14:58:01Z", "seconds_since_last": 252 }
]
```
`state`: `libre` · `parcial` · `con_personas` · `lleno` · `sin_conexion`.

**GET `/spaces/:slug/history?hours=6`** (máx. 48) →
```json
[ { "t": "2026-11-04T15:00:00Z", "state": "parcial", "tables_occupied": 2,
    "temperature": 24.5, "humidity": 58.0, "noise_level": 40 } ]
```
Devuelve el promedio por minuto para no enviar miles de puntos.

## Calibración (HU-06) — tarea 4.3
**GET `/spaces/:slug/config`** →
```json
{ "slug": "gastronomia",
  "zones": [ { "code": "A", "tables": [ { "table_no": 1, "min_cm": 0, "max_cm": 150 } ] } ],
  "config": { } }
```
(En el Sótano, `config` trae `umbral_personas`, `umbral_lleno`, `ventana_s`.)

**PUT `/spaces/:slug/config`** body: `{ "config"?: { "umbral_personas": 20 }, "zone_tables"?: [ { "zone": "A", "table_no": 1, "min_cm": 0, "max_cm": 160 } ] }` → `200` + config actualizada.
Protegido con `x-admin-key` (variable `ADMIN_KEY` del `.env`).

**GET `/spaces/:slug/raw?limit=60`** → últimas lecturas crudas (con `radars`) para la pantalla de calibración.

## Verificación manual (HU-07, HU-08) — tarea 5.1
**POST `/manual-checks`** body:
```json
{ "space": "gastronomia", "day": 1, "slot": "07:00", "manual_state": "parcial",
  "manual_tables_occupied": 2, "observer": "María" }
```
→ `201`: `{ "id": 7, "system_state": "parcial", "match": true }`
El backend toma el estado de la última lectura del espacio en ese instante (o `sin_conexion`, que cuenta como no coincidente).
Errores: `409 FRANJA_DUPLICADA` (mismo espacio + día + franja) · `400 DATOS_INVALIDOS`.

**GET `/manual-checks`** → lista de las verificaciones guardadas.
**GET `/validation/summary`** →
```json
{ "total": 40, "registered": 12, "matches": 10, "coincidence_pct": 83.3, "goal_pct": 80, "goal_met": true }
```
`coincidence_pct` = coincidentes ÷ 40 × 100 (siempre sobre las 40 previstas, no sobre las registradas).
**GET `/validation/export`** → CSV de las verificaciones (para el informe).

## Métricas (HU-09) — OE2
**GET `/metrics?from=2026-11-04T07:00:00Z&to=2026-11-04T19:00:00Z`** →
```json
{ "nodes": [ { "node": "nodo-gastronomia", "expected": 14400, "received": 13980,
               "availability_pct": 97.1, "avg_delay_s": 0.8, "max_delay_s": 2.4 } ],
  "goal": { "availability_pct": 90, "max_delay_s": 10 } }
```
`expected` = duración ÷ `EXPECTED_INTERVAL_S`. Retardo = `fecha_recepcion − fecha_medicion` (solo lecturas con `device_ts`).

## Utilidades (HU-12)
**GET `/salud`** → `{ "backend": "ok", "base_datos": "ok", "nodos": [ { "node": "nodo-sotano", "last_seen": "...", "online": true } ] }`
