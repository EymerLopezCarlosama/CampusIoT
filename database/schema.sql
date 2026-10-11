-- CampusIoT · PostgreSQL 14+ (Docker local o Supabase)
-- v1. Ejecutar una sola vez; es idempotente (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS spaces (
  id           SERIAL PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,                       -- 'gastronomia' | 'sotano'
  name         TEXT NOT NULL,
  mode         TEXT NOT NULL CHECK (mode IN ('mesas', 'espacio')),
  total_tables SMALLINT NOT NULL CHECK (total_tables > 0)   -- 4 en Gastronomía, 7 en Sótano
);

CREATE TABLE IF NOT EXISTS nodes (
  id        SERIAL PRIMARY KEY,
  space_id  INT NOT NULL REFERENCES spaces(id),
  name      TEXT NOT NULL,
  api_key   TEXT UNIQUE NOT NULL,                          -- una clave por nodo (header x-api-key)
  last_seen TIMESTAMPTZ
);

-- Una zona = un radar. Gastronomía: A (columna de 3 mesas) y B (mesa aislada). Sótano: S.
CREATE TABLE IF NOT EXISTS zones (
  id       SERIAL PRIMARY KEY,
  space_id INT NOT NULL REFERENCES spaces(id),
  node_id  INT NOT NULL REFERENCES nodes(id),
  code     TEXT NOT NULL,                                  -- id del radar en el JSON: 'A', 'B', 'S'
  label    TEXT NOT NULL,
  tables   SMALLINT NOT NULL CHECK (tables > 0),
  UNIQUE (node_id, code)
);

-- Banda de distancia (cm, medida desde el radar) que corresponde a cada mesa de una zona.
-- Se calibra en la tarea 4.3. Solo se usa en espacios con mode = 'mesas'.
CREATE TABLE IF NOT EXISTS zone_tables (
  zone_id  INT NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  table_no SMALLINT NOT NULL,
  min_cm   INT NOT NULL,
  max_cm   INT NOT NULL CHECK (max_cm > min_cm),
  PRIMARY KEY (zone_id, table_no)
);

-- Umbrales ajustables sin tocar código (ej. sótano: umbral_personas, umbral_lleno, ventana_s)
CREATE TABLE IF NOT EXISTS space_config (
  space_id INT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  key      TEXT NOT NULL,
  value    REAL NOT NULL,
  PRIMARY KEY (space_id, key)
);

CREATE TABLE IF NOT EXISTS readings (
  id              BIGSERIAL PRIMARY KEY,
  node_id         INT NOT NULL REFERENCES nodes(id),
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),       -- hora de recepción en el servidor
  device_ts       TIMESTAMPTZ,                              -- hora de medición en el nodo (NTP); sirve para medir el retardo
  temperature     REAL,                                     -- °C
  humidity        REAL,                                     -- %
  noise_level     REAL,                                     -- índice relativo 0-100 (no es audio)
  radars          JSONB NOT NULL,                           -- lectura cruda de cada radar (ver docs/api-contract.md)
  tables_occupied SMALLINT,                                 -- solo espacios 'mesas'
  state           TEXT NOT NULL CHECK (state IN ('libre', 'parcial', 'con_personas', 'lleno'))
);
CREATE INDEX IF NOT EXISTS idx_readings_node_received ON readings (node_id, received_at DESC);

-- Verificación manual de la jornada de prueba (OE4): 2 espacios x 10 franjas x 2 días = 40 filas
CREATE TABLE IF NOT EXISTS manual_checks (
  id                     SERIAL PRIMARY KEY,
  space_id               INT NOT NULL REFERENCES spaces(id),
  day                    SMALLINT NOT NULL CHECK (day IN (1, 2)),
  slot                   TEXT NOT NULL,                     -- etiqueta de la franja, ej. '07:00'
  manual_state           TEXT NOT NULL CHECK (manual_state IN ('libre', 'parcial', 'con_personas', 'lleno')),
  manual_tables_occupied SMALLINT,                          -- mesas con al menos 1 persona (opcional, ayuda a depurar)
  system_state           TEXT NOT NULL,                     -- estado del sistema al guardar (puede ser 'sin_conexion')
  match                  BOOLEAN NOT NULL,
  observer               TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (space_id, day, slot)
);
