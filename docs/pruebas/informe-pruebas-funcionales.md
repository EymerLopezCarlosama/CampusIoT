# Informe de pruebas funcionales del backend (tarea 4.5)

CampusIoT · Unicomfacauca · Formulación y Evaluación de Proyectos
Responsable: Yined Peteví · Fecha: 18 de noviembre de 2026

## 1. Objetivo y alcance
Comprobar que el backend cumple el contrato de `docs/api-contract.md` y las historias de usuario HU-01 a HU-09 y HU-12, antes de la jornada de prueba (tarea 5.1).

Cubre: la API (lecturas, espacios, calibración, verificación manual, métricas y salud), el cálculo de estado y la validación de datos.
No cubre todavía: la página (frontend) y el firmware con las placas reales. Ver sección 6.

## 2. Entorno
| Elemento | Valor |
|---|---|
| Backend | Node 20+ (ESM), Express 4, pg, zod |
| Pruebas | vitest 2.1.9 y supertest 7 |
| Base de datos | PostgreSQL 16 en Docker (`docker compose up -d db`), esquema y seed del repo |
| Producción | Supabase (BD) y Render (backend y página), probado a mano (sección 5) |

## 3. Resumen de resultados
| Tipo | Archivo | Casos | Resultado |
|---|---|---|---|
| Unitarias | `tests/unit/status.service.test.js` | 8 | 8 pasan |
| Unitarias | `tests/unit/validators.test.js` | 27 | 27 pasan |
| Integración | `tests/integration/api.test.js` | 33 | 33 pasan |
| **Total** | | **68** | **68 pasan, 0 fallan** |

Comandos: `npm test` (unitarias, sin BD, aptas para el CI) y `npm run test:integration` (necesita PostgreSQL local; se niega a correr si `DATABASE_URL` no apunta a localhost).

## 4. Casos de integración por funcionalidad
| Grupo | HU | Casos | Qué comprueba |
|---|---|---|---|
| Salud | HU-12 | 2 | `/api/salud` lista los dos nodos con la BD en `ok`; una ruta inexistente da 404 con el JSON estándar |
| Lecturas | HU-01 | 11 | 401 sin clave o con clave desconocida; 400 con JSON roto o temperatura fuera de rango; 400 `RADAR_DESCONOCIDO`; estado por mesas (radar A en mesa 2 → 1 mesa, parcial); dos placas con la misma clave suman mesas; Sótano lleno (energía 70) y con personas (energía 35); distancia fuera de toda banda no cuenta; la lectura se guarda con `radars` como arreglo |
| Espacios | HU-02 a HU-05 | 6 | Sin lecturas, ambos `sin_conexion`; con lecturas muestra estado, mesas y valores ambientales; una placa callada marca el espacio `sin_conexion` aunque la otra siga; historial por minuto y 400 con `hours` fuera de rango; 404 en espacio inexistente; `/raw` exige `x-admin-key` |
| Calibración | HU-06 | 5 | GET público con bandas y `ventana_s`; PUT sin clave da 401; bandas solapadas dan 400 `BANDAS_SOLAPADAS`; zona inexistente 404 y clave desconocida 400; el cambio de banda se aplica a la lectura siguiente sin reiniciar |
| Verificación manual | HU-07, HU-08 | 7 | `match` true y false; sin lecturas el sistema es `sin_conexion` y no coincide; franja repetida 409 `FRANJA_DUPLICADA`; estados inválidos por espacio, día 3 y espacio inexistente; resumen calculado sobre las 40 previstas; CSV con encabezado y neutralización de fórmulas de Excel |
| Métricas | HU-09 | 2 | `expected` cuenta por placa (Gastronomía espera el doble que el Sótano); rango invertido o fecha inválida dan 400 |

## 5. Pruebas manuales en producción (Render + Supabase)
| Prueba | Resultado |
|---|---|
| `GET /api/salud` | `backend: ok`, `base_datos: ok` |
| POST con las claves de desarrollo antiguas | 401 (bloqueadas) |
| POST de `nodo-gastronomia` (radar A a 120 cm, B libre) | 201, `parcial`, 1 mesa; visible en `GET /api/spaces` |
| POST de `nodo-sotano` (energía 35, entre umbrales 15 y 60) | 201, `con_personas` |
| Más de 30 s sin lecturas | Ambos espacios pasan a `sin_conexion` con valores en `null` |
| `GET /api/metrics` | Conteo de lecturas esperadas y recibidas por nodo |

## 6. Pendiente y limitaciones
- **Página (frontend):** no hay pruebas automáticas. Falta la prueba manual en celular y escritorio (lista abajo).
- **Firmware con placas reales contra producción:** pendiente la prueba de extremo a extremo (nodo → backend → página).
- **Calibración:** las bandas y umbrales son los provisionales del seed hasta la tarea 4.3.
- **Disponibilidad y retardo reales (OE2):** solo se miden en la jornada de prueba; los valores del simulador no cuentan.
- **Hallazgo para la página:** `verificacion.js` muestra el estado del sistema después de guardar. Debe mostrar solo "Guardado" para no sesgar la siguiente observación (PROMPT del archivo y protocolo de la jornada).
- **Observación:** durante las pruebas de B6 el servidor dejó de responder una vez y no se pudo reproducir; se registra por si vuelve a ocurrir durante la jornada.

## 7. Prueba manual de la página (por completar con María)
| Prueba | Resultado |
|---|---|
| `index.html` muestra una tarjeta por espacio, con estado en color y texto | |
| Se actualiza sola cada 3 s con el simulador | |
| Al detener el simulador pasa a "Sin conexión" en gris | |
| Con el servidor apagado muestra "No se pudo actualizar" sin borrar lo que se veía | |
| Se lee bien a 360 px de ancho | |
| `historial.html` dibuja las gráficas; sin datos muestra un mensaje | |
| `verificacion.html` guarda una franja, avisa si está repetida y muestra "X de 40" | |
| `calibracion.html` muestra distancia y energía en vivo y guarda una banda | |

## 8. Conclusión
El backend cumple el contrato en los 68 casos automáticos y en las pruebas manuales de producción. Quedan pendientes la prueba de la página y la de extremo a extremo con las placas, que condicionan el inicio de la jornada de prueba.