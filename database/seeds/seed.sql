-- CampusIoT · datos iniciales
-- ATENCIÓN: las claves API de aquí son SOLO para desarrollo. En Supabase/producción cámbialas
-- (UPDATE nodo SET clave_api = '<clave larga aleatoria>' WHERE nombre = '...') y ponlas en firmware/src/config.h.
-- Las bandas de distancia y los umbrales son PROVISIONALES hasta la calibración (tarea 4.3).

INSERT INTO espacio (slug, nombre, modo, total_mesas) VALUES
  ('gastronomia', 'Estudio Gastronomía', 'mesas',   4),
  ('sotano',      'Sótano',              'espacio', 7)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO nodo (id_espacio, nombre, clave_api)
SELECT id_espacio, 'nodo-gastronomia', 'dev-key-gastronomia' FROM espacio WHERE slug = 'gastronomia'
ON CONFLICT (clave_api) DO NOTHING;

INSERT INTO nodo (id_espacio, nombre, clave_api)
SELECT id_espacio, 'nodo-sotano', 'dev-key-sotano' FROM espacio WHERE slug = 'sotano'
ON CONFLICT (clave_api) DO NOTHING;

-- Zonas (un radar cada una)
INSERT INTO zona (id_espacio, id_nodo, codigo, etiqueta, mesas)
SELECT e.id_espacio, n.id_nodo, 'A', 'Columna de 3 mesas junto a la pared', 3
FROM espacio e JOIN nodo n ON n.id_espacio = e.id_espacio WHERE e.slug = 'gastronomia'
ON CONFLICT (id_nodo, codigo) DO NOTHING;

INSERT INTO zona (id_espacio, id_nodo, codigo, etiqueta, mesas)
SELECT e.id_espacio, n.id_nodo, 'B', 'Mesa aislada al otro lado', 1
FROM espacio e JOIN nodo n ON n.id_espacio = e.id_espacio WHERE e.slug = 'gastronomia'
ON CONFLICT (id_nodo, codigo) DO NOTHING;

INSERT INTO zona (id_espacio, id_nodo, codigo, etiqueta, mesas)
SELECT e.id_espacio, n.id_nodo, 'S', 'Sótano completo (7 mesas juntas)', 7
FROM espacio e JOIN nodo n ON n.id_espacio = e.id_espacio WHERE e.slug = 'sotano'
ON CONFLICT (id_nodo, codigo) DO NOTHING;

-- Bandas provisionales por mesa (cm desde el radar) SOLO en Gastronomía
INSERT INTO banda_mesa (id_zona, num_mesa, min_cm, max_cm)
SELECT z.id_zona, t.num_mesa, t.min_cm, t.max_cm
FROM zona z
JOIN espacio e ON e.id_espacio = z.id_espacio AND e.slug = 'gastronomia'
JOIN (VALUES ('A', 1,   0, 150), ('A', 2, 150, 300), ('A', 3, 300, 450), ('B', 1, 0, 400))
  AS t(codigo, num_mesa, min_cm, max_cm) ON t.codigo = z.codigo
ON CONFLICT (id_zona, num_mesa) DO NOTHING;

-- Ventana de Gastronomía (s): una mesa cuenta como ocupada si en esta ventana hubo un objetivo en su banda.
-- Necesaria porque el LD2410C entrega UN solo objetivo por lectura: sin ventana, la zona A nunca marcaría 2-3 mesas a la vez.
INSERT INTO config_espacio (id_espacio, clave, valor)
SELECT id_espacio, 'ventana_s', 45 FROM espacio WHERE slug = 'gastronomia'
ON CONFLICT (id_espacio, clave) DO NOTHING;

-- Umbrales provisionales del Sótano (índice de ocupación = energía promedio de la ventana)
INSERT INTO config_espacio (id_espacio, clave, valor)
SELECT e.id_espacio, c.clave, c.valor
FROM espacio e
JOIN (VALUES ('umbral_personas', 15), ('umbral_lleno', 60), ('ventana_s', 60))
  AS c(clave, valor) ON TRUE
WHERE e.slug = 'sotano'
ON CONFLICT (id_espacio, clave) DO NOTHING;
