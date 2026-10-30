# Distribución de trabajo y orden de desarrollo

CampusIoT · Unicomfacauca · Formulación y Evaluación de Proyectos

## 1. Objetivo
Dejar claro quién construye qué, en qué orden y cómo se sabe que cada paso está terminado, para llegar a la integración de extremo a extremo (tarea 4.4) sin que nadie se bloquee esperando a otro.

**Estado al 30 oct 2026:** el armado del hardware (4.1) está hecho y el repo tiene la estructura completa, pero todavía no hay código: cada archivo solo trae su comentario `PROMPT`. Quedan la S5 (2-6 nov), la S6 (9-13 nov) y la reserva (16-20 nov). Ver §7.

## 2. Ramas y flujo
Solo existe `main` (estable; es lo que se usa en la jornada de prueba) y una rama por persona. Nadie sube directo a `main`: todo entra por Pull Request.

| Rama | Quién | Carpeta |
|---|---|---|
| `eymer/firmware` | Eymer | `firmware/` |
| `yined/backend` | Yined | `backend/`, `database/` |
| `maria/frontend` | María | `frontend/` |

**Dos excepciones de carpeta** (para equilibrar la carga; cada una va en su propia rama y su PR lo revisa Yined):
- **B5** (`status.service.js` y su test, en `backend/`): lo hace **Eymer** en la rama `eymer/status`. Es el núcleo del cálculo y Eymer es quien calibra.
- **B7** (`tools/simulator.js`): lo hace **María** en la rama `maria/simulador`. Es lo primero que necesita para M3.
Todo lo demás de `backend/`, `database/` y `tools/` es de Yined.

- **Un PR por paso** del punto 6 (pequeño y fácil de revisar). La rama sigue viva; después de unir el PR se hace `git pull origin main` y `git merge main` en la rama propia.
- **Revisión cruzada (propuesta):** Eymer revisa los PR de Yined, Yined revisa los de María y María revisa los de Eymer. Quien revisa corre la prueba del paso antes de aprobar.
- **Commits:** `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- **Cada quien toca solo su carpeta** (salvo las dos excepciones de arriba). Si necesitas algo de otra carpeta, se pide por mensaje o se abre un issue. `docs/` y `README.md` se cambian por PR avisando a los demás.
- **Secretos fuera del repo:** `.env` y `firmware/src/config.h` están en `.gitignore`. Se comparten los archivos `*.example`.

## 3. Reparto

| Persona | Carpetas | Tareas del cronograma | Historias |
|---|---|---|---|
| **Eymer** | `firmware/` + B5 | 2.1 · 3.1 · 4.3 calibración · 4.4 integración | HU-01 (nodo), HU-04 (estado), HU-06, HU-12 |
| **Yined** | `backend/`, `database/` | 1.1 · 2.3 · 3.2 · 4.5 · 5.2 | HU-01 (servidor), HU-08, HU-09 |
| **María** | `frontend/` + B7 | 1.2 · 2.2 · 3.3 · 3.4 · 6.1 | HU-02, HU-03, HU-05, HU-07, HU-10, HU-11 (simulador) |
| **Las tres** | todo | 4.1 armado (**hecho**) · 4.2 instalación · 5.1 jornada · 6.2 entrega · G.1 seguimiento | |

## 4. Fuentes de verdad
Si algo de este documento choca con un contrato, **manda el contrato**:
1. `docs/api-contract.md`: rutas y JSON entre nodo, backend y página.
2. `database/schema.sql` y `seeds/seed.sql`: tablas, columnas y valores iniciales (en español; el JSON de la API conserva los nombres en inglés del contrato, ver `docs/base-de-datos/diccionario-de-datos.md`).
3. `docs/hardware/pines-y-cableado.md`: pines del ESP32 y cableado.
4. `docs/arquitectura.md`: cálculo del estado y presupuesto de retardo.

Si hay que cambiar un contrato, se cambia **primero el documento** (PR aprobado por las tres) y después el código.

## 5. Cómo se trabaja cada paso
1. Un archivo (o un bloque pequeño) a la vez.
2. Cada archivo del repo trae un comentario `PROMPT` que dice qué debe tener. El código lo reemplaza (se puede dejar una línea que explique qué hace el archivo).
3. Se hace **la prueba del paso antes de pasar al siguiente**. Si falla, no se avanza.
4. Se entiende lo que se escribió: cada paso se explica en pocas líneas en el PR.

## 6. Orden de desarrollo

### 6.1 Eymer · firmware (`eymer/firmware`) y B5
Primero se verifica cada sensor suelto en banco y solo al final se une todo con la red. El hardware ya está armado, así que F4-F9 se pueden probar con los sensores reales. **B5 va justo después de F4** porque desbloquea a Yined (B6).

| Paso | Archivos | Qué se hace | Hecho cuando |
|---|---|---|---|
| F1 | `config.h` (copia de `config.example.h`), `main.cpp` | Programa mínimo: serial + LED con "latido" cada `SEND_INTERVAL_MS` | `pio run -t upload` sube; el monitor muestra el arranque y un latido cada 3 s; el LED parpadea |
| F2 | `sensors.h`, `sensors.cpp` (solo DHT22) | Leer temperatura y humedad; `NaN` si falla | Valores plausibles (20-30 °C, 40-80 %); al desconectar DATA imprime `NaN` y no se cuelga |
| F3 | `sensors.cpp` (MAX4466) | Índice de ruido 0-100 por ventana de ~100 ms | En silencio sale bajo y estable; al aplaudir sube; nunca pasa de 100 |
| F4 | `sensors.cpp` (radar #1, UART2) | Presencia, tipo, distancia y energía del objetivo | Sin nadie: `present=false`, energía 0. Con una persona quieta a 1 m, 2 m y 3 m la distancia coincide con la cinta métrica (±30 cm) |
| **B5** | `backend/src/services/status.service.js`, `backend/tests/unit/status.service.test.js` (rama `eymer/status`) | Cálculo del estado con funciones puras. Una mesa cuenta como ocupada si en la ventana `ventana_s` hubo un objetivo en su banda `[min, max)` (el LD2410C ve un solo objetivo por lectura) | `npm test` en verde con todos los casos del test (ventana, bordes de banda, umbrales y `sin_conexion`). Quita los `it.todo` |
| F5 | `sensors.cpp` (radar #2, UART1 reasignada) | Segundo radar con `RADAR_COUNT 2` | Los radares `A` y `B` reportan por separado; tapar uno no afecta al otro |
| F6 | `net.h`, `net.cpp` (WiFi y NTP) | Conexión con reconexión automática y hora por NTP | El monitor muestra IP y hora UTC correcta; al apagar el router el latido sigue y reconecta solo |
| F7 | `net.cpp` (POST), `main.cpp` | Armar el JSON del contrato y enviarlo con `x-api-key` | Con el backend corriendo: `201` cada 3 s y filas nuevas en `lectura`. Con una clave mala: `401` sin romper el nodo. **Depende de B6** (hasta entonces probar con `curl` y con el simulador) |
| F8 | `main.cpp`, `net.cpp` | Resiliencia: reintentos, reinicio tras 5 min sin poder enviar, LED de estado | WiFi apagado 1 min y vuelto a encender: retoma solo. Backend caído: no se cuelga |
| F9 | `config.h` del Sótano | Segundo nodo (`RADAR_COUNT 1`, zona `S`) y prueba de 30 min seguidos | En 30 min llegan ≥ 570 de 600 lecturas (95 %) por nodo |

Después: 4.3 calibración con `calibracion.html` (ver `docs/calibracion/protocolo-calibracion.md`) y 4.4 integración.

### 6.2 Yined · backend y base de datos (`yined/backend`)

| Paso | Archivos | Qué se hace | Hecho cuando |
|---|---|---|---|
| B0 | `database/schema.sql`, `seeds/seed.sql` | Levantar PostgreSQL con Docker y cargar esquema y datos | `docker compose exec db psql -U campusiot -d campusiot -c "\dt"` lista 7 tablas; `espacio` 2, `nodo` 2, `zona` 3, `banda_mesa` 4 y `config_espacio` 4 filas (incluye `ventana_s` de Gastronomía) |
| B1 | `utils/logger.js`, `config/env.js` (+ `.env`) | Registro con hora y variables validadas con zod | `node -e "import('./src/config/env.js').then(m=>console.log(m.env))"` imprime los valores; sin `DATABASE_URL` termina con un error claro |
| B2 | `config/database.js` | Pool de `pg` y `probarConexion()` | Devuelve `true` con la BD encendida y `false` con la BD apagada |
| B3 | `middlewares/error-handler.js`, `not-found.js`, `validate.js` | Errores en formato estándar y validación con zod | Se prueba en B4 (un error cualquiera llega como `{ error: { codigo, mensaje } }`) |
| B4 | `app.js`, `server.js`, `routes/index.js` | Servidor y `GET /api/salud` | `/api/salud` responde `ok`; con la BD apagada responde `base_datos: "error"` y el servidor sigue vivo; `/api/xyz` da 404 en JSON estándar |
| B5 | → lo hace **Eymer** (ver §6.1) | | Yined revisa el PR y usa `calcularEstado` en B6 |
| B6 | **Depende de B5.** `validators/readings.validator.js`, `middlewares/auth.js` → `repositories/*` → `services/readings.service.js`, controlador y ruta | `POST /api/readings` (en 3 mini-pasos: validar y autenticar, repositorios, servicio y ruta) | `curl` con `dev-key-gastronomia` da `201` con el estado; sin clave `401`; JSON inválido `400`; radar desconocido `400`; la fila queda en `lectura` |
| B7 | → lo hace **María** (ver §6.3) | | Yined lo usa para probar B8-B11 |
| B8 | `spaces.*` (ruta, controlador, servicio con `estadoActual(slug)` y `listar()`, repositorio) | `GET /spaces`, `/history`, `/raw` | Con el simulador, `/spaces` cambia de estado; al apagarlo más de 30 s marca `sin_conexion` |
| B9 | `config.*` | Calibración: `GET` y `PUT /spaces/:slug/config` | `PUT` con `x-admin-key` cambia una banda y el estado siguiente lo refleja; sin clave `401`; bandas solapadas `400` |
| B10 | `checks.*` | Verificación manual, resumen y exportación CSV | Dos `POST` dan "2 de 40"; la misma franja da `409`; el CSV abre en Excel |
| B11 | `metrics.*` | Disponibilidad y retardo | Con el simulador 10 min: disponibilidad ≈ 100 % y retardo < 2 s |
| B12 | `backend/Dockerfile`, despliegue gratuito | Supabase (BD) + Render (backend y página) | La URL pública responde `/api/salud` y un nodo real envía por internet |

### 6.3 María · frontend (`maria/frontend`) y B7
Puede avanzar M1 y M2 sin backend. **B7 (el simulador) va justo después de M2**, porque es lo que alimenta M3 y M4; desde M3 usa también el backend de Yined.

| Paso | Archivos | Qué se hace | Hecho cuando |
|---|---|---|---|
| M1 | `css/styles.css`, `index.html` | Maquetado de la página principal (prototipo, tarea 2.2) | Se ve bien a 360 px (celular) y en escritorio; el estado se lee por texto y no solo por color |
| M2 | `js/api.js`, `js/util.js` | Cliente HTTP y funciones de formato | En la consola del navegador `formatearTemperatura(24.6)` da "24,6 °C"; `api("/salud")` responde con el backend encendido |
| **B7** | `tools/simulator.js` (rama `maria/simulador`; ya existe `tools/package.json` con `type: module`) | Simulador de los 2 nodos (HU-11) | Con el backend encendido, `lectura` crece cada 3 s; `--caida sotano` deja un nodo sin enviar; Gastronomía pasa por libre, parcial y lleno. Mientras B6 no esté, se prueba imprimiendo el JSON y con `curl` |
| M3 | `js/estado.js` | Tarjetas en vivo (HU-02, HU-03, HU-04) **Depende de B6-B8** | Con el simulador cambian solas; sin simulador marcan "Sin conexión" en gris; con el backend apagado aparece "No se pudo actualizar" sin borrar lo que se veía |
| M4 | `historial.html`, `js/historial.js` | Gráficas con Chart.js (HU-05) | Con 1 h de datos del simulador se dibujan las 4 gráficas; sin datos muestra un mensaje |
| M5 | `verificacion.html`, `js/verificacion.js` | Formulario de la jornada (HU-07). **Depende de B10** | Guarda una franja; la repetida muestra un mensaje; el resumen muestra "X de 40"; descarga el CSV |
| M6 | `calibracion.html`, `js/calibracion.js` | Vista en vivo de los radares y edición de bandas. **Depende de B9** | Muestra distancia y energía cada 2 s; guardar una banda cambia el resultado |
| M7 | aviso de privacidad y enlace de la encuesta en `index.html` (constante `ENCUESTA_URL` de `js/util.js`); carteles (3.4) | Aviso visible y QR | Al leer el QR desde un celular se abre la página |

## 7. Calendario (actualizado el 30 oct)
S2-S4 ya pasaron: solo se hizo el diseño y el armado (4.1). Lunes 2 nov y lunes 16 nov son festivos.

| Tramo | Eymer | Yined | María | Para cerrar |
|---|---|---|---|---|
| **Hasta el mar 3 nov** | F1-F4 y **B5** | B0-B4 | M1-M2 y **B7** | B4, B5 y B7 unidos a `main`; ya hay servidor, estado y simulador |
| **S5 (2-6 nov)** | F5-F7 | B6 y B8 | M3-M4 | **Vie 6: primera prueba de extremo a extremo** (nodo real → backend → página) |
| **S6 (9-13 nov)** | F8-F9 y calibración (4.3) | B9-B12 | M5-M7 | Calibrado el **lun 9**; jornada de prueba (5.1) el **10 y 11**; entrega (6.2) el **13** |
| **Reserva (16-20 nov)** | — | — | — | Solo si falla algo. El lunes 16 es festivo |

**Camino crítico:** B5 → B6 → F7 → prueba de extremo a extremo → calibración → jornada. La jornada son 2 días completos (7:00-19:00) y no hay margen: si el vie 6 la prueba de extremo a extremo no sale, se decide ese mismo día si la jornada pasa a la reserva (17-18 nov).

## 8. Lista de revisión de un PR
- [ ] Se corrió la prueba del paso (quien revisa también la corre).
- [ ] No hay secretos ni rutas personales (WiFi, claves, `.env`).
- [ ] No cambia un contrato sin haber cambiado antes el documento.
- [ ] El PR explica en pocas líneas qué hace cada archivo.
- [ ] Commits con prefijo (`feat:`, `fix:`, `docs:`, ...).

## 9. Pendientes abiertos
- [ ] Crear la encuesta (HU-10) y pasar su URL a María para `ENCUESTA_URL` y el QR.
- [ ] Confirmar el tipo de red WiFi donde irán los nodos (WPA2 personal, institucional o portal cautivo); plan B: punto de acceso del celular.
- [ ] Definir las 10 etiquetas de franja de la jornada (ver `docs/pruebas/protocolo-jornada-prueba.md`).
- [ ] Fijar el criterio de estado del Sótano para la verificación manual antes de la jornada.
- [ ] Cambiar las claves `dev-key-*` del seed al desplegar en Supabase y ponerlas en `firmware/src/config.h`.
