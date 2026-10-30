-- CampusIoT · PostgreSQL 14+ (Docker local o Supabase)
-- v2: tablas y columnas en español (como CodeSentry). Ejecutar una sola vez; es idempotente (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS espacio (
  id_espacio  SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,                         -- 'gastronomia' | 'sotano' (se usa en las URLs)
  nombre      TEXT NOT NULL,
  modo        TEXT NOT NULL CHECK (modo IN ('mesas', 'espacio')),
  total_mesas SMALLINT NOT NULL CHECK (total_mesas > 0)     -- 4 en Gastronomía, 7 en Sótano
);

CREATE TABLE IF NOT EXISTS nodo (
  id_nodo      SERIAL PRIMARY KEY,
  id_espacio   INT NOT NULL REFERENCES espacio(id_espacio),
  nombre       TEXT NOT NULL,
  clave_api    TEXT UNIQUE NOT NULL,                        -- una clave por nodo (header x-api-key)
  ultima_vista TIMESTAMPTZ
);

-- Una zona = un radar. Gastronomía: A (columna de 3 mesas) y B (mesa aislada). Sótano: S.
CREATE TABLE IF NOT EXISTS zona (
  id_zona    SERIAL PRIMARY KEY,
  id_espacio INT NOT NULL REFERENCES espacio(id_espacio),
  id_nodo    INT NOT NULL REFERENCES nodo(id_nodo),
  codigo     TEXT NOT NULL,                                 -- id del radar en el JSON: 'A', 'B', 'S'
  etiqueta   TEXT NOT NULL,
  mesas      SMALLINT NOT NULL CHECK (mesas > 0),
  UNIQUE (id_nodo, codigo)
);

-- Banda de distancia (cm, medida desde el radar) que corresponde a cada mesa de una zona.
-- Se calibra en la tarea 4.3. Solo se usa en espacios con modo = 'mesas'.
CREATE TABLE IF NOT EXISTS banda_mesa (
  id_zona  INT NOT NULL REFERENCES zona(id_zona) ON DELETE CASCADE,
  num_mesa SMALLINT NOT NULL,
  min_cm   INT NOT NULL,
  max_cm   INT NOT NULL CHECK (max_cm > min_cm),
  PRIMARY KEY (id_zona, num_mesa)
);

-- Parámetros ajustables sin tocar código (ventana_s en ambos espacios; sótano además umbral_personas y umbral_lleno)
CREATE TABLE IF NOT EXISTS config_espacio (
  id_espacio INT NOT NULL REFERENCES espacio(id_espacio) ON DELETE CASCADE,
  clave      TEXT NOT NULL,
  valor      REAL NOT NULL,
  PRIMARY KEY (id_espacio, clave)
);

CREATE TABLE IF NOT EXISTS lectura (
  id_lectura       BIGSERIAL PRIMARY KEY,
  id_nodo          INT NOT NULL REFERENCES nodo(id_nodo),
  fecha_recepcion  TIMESTAMPTZ NOT NULL DEFAULT now(),      -- hora de recepción en el servidor
  fecha_medicion   TIMESTAMPTZ,                             -- hora de medición en el nodo (NTP); sirve para medir el retardo
  temperatura      REAL,                                    -- °C
  humedad          REAL,                                    -- %
  nivel_ruido      REAL,                                    -- índice relativo 0-100 (no es audio)
  radares          JSONB NOT NULL,                          -- lectura cruda de cada radar (ver docs/api-contract.md)
  mesas_ocupadas   SMALLINT,                                -- solo espacios en modo 'mesas'
  estado           TEXT NOT NULL CHECK (estado IN ('libre', 'parcial', 'con_personas', 'lleno'))
);
CREATE INDEX IF NOT EXISTS idx_lectura_nodo_fecha ON lectura (id_nodo, fecha_recepcion DESC);

-- Verificación manual de la jornada de prueba (OE4): 2 espacios x 10 franjas x 2 días = 40 filas
CREATE TABLE IF NOT EXISTS verificacion_manual (
  id_verificacion  SERIAL PRIMARY KEY,
  id_espacio       INT NOT NULL REFERENCES espacio(id_espacio),
  dia              SMALLINT NOT NULL CHECK (dia IN (1, 2)),
  franja           TEXT NOT NULL,                            -- etiqueta de la franja, ej. '07:00'
  estado_manual    TEXT NOT NULL CHECK (estado_manual IN ('libre', 'parcial', 'con_personas', 'lleno')),
  mesas_manual     SMALLINT,                                 -- mesas con al menos 1 persona (opcional, ayuda a depurar)
  estado_sistema   TEXT NOT NULL,                            -- estado del sistema al guardar (puede ser 'sin_conexion')
  coincide         BOOLEAN NOT NULL,
  observador       TEXT,
  fecha_registro   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id_espacio, dia, franja)
);
