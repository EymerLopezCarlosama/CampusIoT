-- CampusIoT · datos iniciales
-- ATENCIÓN: las API keys de aquí son SOLO para desarrollo. En Supabase/producción cámbialas
-- (UPDATE nodes SET api_key = '<clave larga aleatoria>' WHERE name = '...') y ponlas en firmware/src/config.h.
-- Las bandas de distancia y los umbrales son PROVISIONALES hasta la calibración (tarea 4.3).

INSERT INTO spaces (slug, name, mode, total_tables) VALUES
  ('gastronomia', 'Estudio Gastronomía', 'mesas',   4),
  ('sotano',      'Sótano',              'espacio', 7)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO nodes (space_id, name, api_key)
SELECT id, 'nodo-gastronomia', 'dev-key-gastronomia' FROM spaces WHERE slug = 'gastronomia'
ON CONFLICT (api_key) DO NOTHING;

INSERT INTO nodes (space_id, name, api_key)
SELECT id, 'nodo-sotano', 'dev-key-sotano' FROM spaces WHERE slug = 'sotano'
ON CONFLICT (api_key) DO NOTHING;

-- Zonas (un radar cada una)
INSERT INTO zones (space_id, node_id, code, label, tables)
SELECT s.id, n.id, 'A', 'Columna de 3 mesas junto a la pared', 3
FROM spaces s JOIN nodes n ON n.space_id = s.id WHERE s.slug = 'gastronomia'
ON CONFLICT (node_id, code) DO NOTHING;

INSERT INTO zones (space_id, node_id, code, label, tables)
SELECT s.id, n.id, 'B', 'Mesa aislada al otro lado', 1
FROM spaces s JOIN nodes n ON n.space_id = s.id WHERE s.slug = 'gastronomia'
ON CONFLICT (node_id, code) DO NOTHING;

INSERT INTO zones (space_id, node_id, code, label, tables)
SELECT s.id, n.id, 'S', 'Sótano completo (7 mesas juntas)', 7
FROM spaces s JOIN nodes n ON n.space_id = s.id WHERE s.slug = 'sotano'
ON CONFLICT (node_id, code) DO NOTHING;

-- Bandas provisionales por mesa (cm desde el radar) SOLO en Gastronomía
INSERT INTO zone_tables (zone_id, table_no, min_cm, max_cm)
SELECT z.id, t.table_no, t.min_cm, t.max_cm
FROM zones z
JOIN spaces s ON s.id = z.space_id AND s.slug = 'gastronomia'
JOIN (VALUES ('A', 1,   0, 150), ('A', 2, 150, 300), ('A', 3, 300, 450), ('B', 1, 0, 400))
  AS t(code, table_no, min_cm, max_cm) ON t.code = z.code
ON CONFLICT (zone_id, table_no) DO NOTHING;

-- Umbrales provisionales del Sótano (índice de ocupación = energía promedio de la ventana)
INSERT INTO space_config (space_id, key, value)
SELECT s.id, c.key, c.value
FROM spaces s
JOIN (VALUES ('umbral_personas', 15), ('umbral_lleno', 60), ('ventana_s', 60))
  AS c(key, value) ON TRUE
WHERE s.slug = 'sotano'
ON CONFLICT (space_id, key) DO NOTHING;
