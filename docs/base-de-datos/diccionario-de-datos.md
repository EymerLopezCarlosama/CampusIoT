# Diccionario de datos

Esquema en `database/schema.sql`.

| Tabla | Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|---|
| spaces | id | SERIAL | Identificador | PK |
| spaces | slug | TEXT | Nombre corto para URLs (`gastronomia`, `sotano`) | UNIQUE, NOT NULL |
| spaces | name | TEXT | Nombre visible | NOT NULL |
| spaces | mode | TEXT | `mesas` (estado por mesas ocupadas) o `espacio` (estado del espacio completo) | CHECK |
| spaces | total_tables | SMALLINT | Mesas del espacio (4 y 7) | > 0 |
| nodes | id | SERIAL | Identificador | PK |
| nodes | space_id | INT | Espacio donde está instalado | FK spaces |
| nodes | name | TEXT | Nombre del nodo | NOT NULL |
| nodes | api_key | TEXT | Clave que el nodo envía en `x-api-key` | UNIQUE |
| nodes | last_seen | TIMESTAMPTZ | Última lectura recibida | Nulo si nunca reportó |
| zones | id | SERIAL | Identificador | PK |
| zones | space_id, node_id | INT | Espacio y nodo al que pertenece | FK |
| zones | code | TEXT | Id del radar en el JSON (`A`, `B`, `S`) | UNIQUE con node_id |
| zones | label | TEXT | Descripción de lo que cubre | |
| zones | tables | SMALLINT | Mesas que cubre el radar | > 0 |
| zone_tables | zone_id, table_no | INT, SMALLINT | Mesa dentro de la zona | PK compuesta |
| zone_tables | min_cm, max_cm | INT | Banda de distancia desde el radar que corresponde a la mesa | max > min |
| space_config | space_id, key | INT, TEXT | Parámetro por espacio (`umbral_personas`, `umbral_lleno`, `ventana_s`) | PK compuesta |
| space_config | value | REAL | Valor del parámetro | |
| readings | id | BIGSERIAL | Identificador | PK |
| readings | node_id | INT | Nodo que envió la lectura | FK nodes |
| readings | received_at | TIMESTAMPTZ | Hora de recepción en el servidor | DEFAULT now() |
| readings | device_ts | TIMESTAMPTZ | Hora de medición en el nodo (NTP) | Opcional |
| readings | temperature, humidity | REAL | °C y % (DHT22) | Pueden ser nulos |
| readings | noise_level | REAL | Índice sonoro 0-100 (MAX4466). No es audio | |
| readings | radars | JSONB | Lectura cruda de cada radar | NOT NULL |
| readings | tables_occupied | SMALLINT | Mesas ocupadas calculadas (solo modo `mesas`) | Nulo en Sótano |
| readings | state | TEXT | `libre`, `parcial`, `con_personas` o `lleno` | CHECK |
| manual_checks | id | SERIAL | Identificador | PK |
| manual_checks | space_id | INT | Espacio verificado | FK spaces |
| manual_checks | day, slot | SMALLINT, TEXT | Día de la jornada (1 o 2) y franja horaria | UNIQUE con space_id |
| manual_checks | manual_state | TEXT | Estado observado por el equipo | CHECK |
| manual_checks | manual_tables_occupied | SMALLINT | Mesas con al menos 1 persona | Opcional |
| manual_checks | system_state | TEXT | Estado del sistema al guardar (puede ser `sin_conexion`) | NOT NULL |
| manual_checks | match | BOOLEAN | `manual_state = system_state` | NOT NULL |
| manual_checks | observer, created_at | TEXT, TIMESTAMPTZ | Quién observó y cuándo | |

`sin_conexion` no se guarda en `readings`: se calcula al consultar.
