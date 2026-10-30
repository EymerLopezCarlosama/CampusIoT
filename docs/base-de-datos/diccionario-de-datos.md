# Diccionario de datos

Esquema en `database/schema.sql` (tablas y columnas en español). El JSON de la API conserva los nombres en inglés del contrato (`docs/api-contract.md`); la columna "En la API" indica la equivalencia. Los repositorios usan alias (`AS`) para devolver esos nombres.

| Tabla | Campo | Tipo | Descripción | Restricciones | En la API |
|---|---|---|---|---|---|
| espacio | id_espacio | SERIAL | Identificador | PK | — |
| espacio | slug | TEXT | Nombre corto para URLs (`gastronomia`, `sotano`) | UNIQUE, NOT NULL | `slug` |
| espacio | nombre | TEXT | Nombre visible | NOT NULL | `name` |
| espacio | modo | TEXT | `mesas` (estado por mesas ocupadas) o `espacio` (estado del espacio completo) | CHECK | `mode` |
| espacio | total_mesas | SMALLINT | Mesas del espacio (4 y 7) | > 0 | `total_tables` |
| nodo | id_nodo | SERIAL | Identificador | PK | — |
| nodo | id_espacio | INT | Espacio donde está instalado | FK espacio | — |
| nodo | nombre | TEXT | Nombre del nodo | NOT NULL | `node` |
| nodo | clave_api | TEXT | Clave que el nodo envía en `x-api-key` | UNIQUE | header `x-api-key` |
| nodo | ultima_vista | TIMESTAMPTZ | Última lectura recibida | Nulo si nunca reportó | `last_seen` |
| zona | id_zona | SERIAL | Identificador | PK | — |
| zona | id_espacio, id_nodo | INT | Espacio y nodo al que pertenece | FK | — |
| zona | codigo | TEXT | Id del radar en el JSON (`A`, `B`, `S`) | UNIQUE con id_nodo | `radars[].id` |
| zona | etiqueta | TEXT | Descripción de lo que cubre | | `label` |
| zona | mesas | SMALLINT | Mesas que cubre el radar | > 0 | `tables` |
| banda_mesa | id_zona, num_mesa | INT, SMALLINT | Mesa dentro de la zona | PK compuesta | `table_no` |
| banda_mesa | min_cm, max_cm | INT | Banda de distancia `[min_cm, max_cm)` desde el radar que corresponde a la mesa | max > min | `min_cm`, `max_cm` |
| config_espacio | id_espacio, clave | INT, TEXT | Parámetro por espacio (`ventana_s` en ambos; `umbral_personas` y `umbral_lleno` solo en Sótano) | PK compuesta | clave en `config` |
| config_espacio | valor | REAL | Valor del parámetro | | valor en `config` |
| lectura | id_lectura | BIGSERIAL | Identificador | PK | `id` |
| lectura | id_nodo | INT | Nodo que envió la lectura | FK nodo | — |
| lectura | fecha_recepcion | TIMESTAMPTZ | Hora de recepción en el servidor | DEFAULT now() | `received_at` |
| lectura | fecha_medicion | TIMESTAMPTZ | Hora de medición en el nodo (NTP) | Opcional | `device_ts` |
| lectura | temperatura, humedad | REAL | °C y % (DHT22) | Pueden ser nulos | `temperature`, `humidity` |
| lectura | nivel_ruido | REAL | Índice sonoro 0-100 (MAX4466). No es audio | | `noise_level` |
| lectura | radares | JSONB | Lectura cruda de cada radar | NOT NULL | `radars` |
| lectura | mesas_ocupadas | SMALLINT | Mesas ocupadas calculadas (solo modo `mesas`) | Nulo en Sótano | `tables_occupied` |
| lectura | estado | TEXT | `libre`, `parcial`, `con_personas` o `lleno` | CHECK | `state` |
| verificacion_manual | id_verificacion | SERIAL | Identificador | PK | `id` |
| verificacion_manual | id_espacio | INT | Espacio verificado | FK espacio | `space` (slug) |
| verificacion_manual | dia, franja | SMALLINT, TEXT | Día de la jornada (1 o 2) y franja horaria | UNIQUE con id_espacio | `day`, `slot` |
| verificacion_manual | estado_manual | TEXT | Estado observado por el equipo | CHECK | `manual_state` |
| verificacion_manual | mesas_manual | SMALLINT | Mesas con al menos 1 persona | Opcional | `manual_tables_occupied` |
| verificacion_manual | estado_sistema | TEXT | Estado del sistema al guardar (puede ser `sin_conexion`) | NOT NULL | `system_state` |
| verificacion_manual | coincide | BOOLEAN | `estado_manual = estado_sistema` | NOT NULL | `match` |
| verificacion_manual | observador, fecha_registro | TEXT, TIMESTAMPTZ | Quién observó y cuándo | | `observer`, `created_at` |

`sin_conexion` no se guarda en `lectura`: se calcula al consultar.
