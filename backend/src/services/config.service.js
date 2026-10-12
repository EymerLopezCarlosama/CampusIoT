// PROMPT — services/config.service.js — Calibración (HU-06)
//
// obtener(slug): zonas con sus bandas por mesa y el config_espacio del espacio.
// actualizar(slug, { config?, zone_tables? }): en UNA transacción, upsert de claves en config_espacio y de bandas en banda_mesa. Reglas: max_cm > min_cm (si no 400 DATOS_INVALIDOS); la zona y la mesa deben existir (si no 404); las bandas de una misma zona no se pueden solapar (400 BANDAS_SOLAPADAS).
//
// Depende de: repositories/config.repository.js
// Referencia: docs/api-contract.md ("Calibración") · docs/calibracion/protocolo-calibracion.md
