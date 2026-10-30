# Prompts de desarrollo por persona

Cada integrante crea un Proyecto en Claude, pega **su** prompt en "Instrucciones" y sube los archivos indicados. Los archivos del repo ya traen un comentario `PROMPT` que dice qué debe tener cada uno; el prompt de abajo fija quién eres, qué pasos te tocan y cómo trabajamos.

## Archivos para subir
**Las tres:** `CampusIoT.docx` · `Anexos.docx` · `README.md` · `docs/distribucion-de-trabajo.md` · `docs/api-contract.md` · `docs/arquitectura.md` · `docs/requisitos/historias-de-usuario.md`

| Persona | Además |
|---|---|
| Eymer | `docs/hardware/pines-y-cableado.md` · `docs/calibracion/protocolo-calibracion.md` · `firmware/**` · `backend/src/services/status.service.js` y su test · `database/seeds/seed.sql` |
| Yined | `database/**` · `docs/base-de-datos/diccionario-de-datos.md` · `.env.example` · `docker-compose.yml` · `backend/**` (sin `package-lock.json`) · `docs/pruebas/protocolo-jornada-prueba.md` |
| María | `frontend/**` · `tools/simulator.js` · `docs/pruebas/protocolo-jornada-prueba.md` |

**No subir nunca:** `.env`, `firmware/src/config.h`, `package-lock.json`, claves reales.

---

## Cómo trabajamos (igual para las tres)
1. **Un paso a la vez** de `docs/distribucion-de-trabajo.md` §6, en el orden de la tabla. No se pasa al siguiente si la prueba "hecho cuando" falla.
2. **Un archivo (o bloque pequeño) a la vez.** Claude sigue el comentario `PROMPT` del archivo y lo reemplaza por el código (se deja una línea que explique qué hace el archivo).
3. **Claude entrega siempre tres cosas:** el código, cómo probarlo (comando exacto y qué debe verse) y 3-5 líneas para la descripción del PR.
4. **Tú ejecutas la prueba y le pegas el resultado** (salida del terminal, monitor serial o captura). Si falla, se arregla antes de seguir.
5. **Un PR por paso**, desde tu rama hacia `main`. Revisa el PR otra persona (Eymer → Yined → María → Eymer) y corre la prueba del paso antes de aprobar. Commits con prefijo (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
6. **Si algo choca con un contrato, manda el contrato** (`api-contract.md`, `schema.sql`, `pines-y-cableado.md`, `arquitectura.md`). Si hay que cambiarlo, se cambia primero el documento por PR aprobado por las tres.
7. **Entiende lo que se escribió:** pídele a Claude que explique cualquier línea que no tengas clara antes de hacer el commit.
8. Respuestas concisas, paso a paso y con confirmación visual.

### Mensaje de arranque (al empezar cada paso)
```
Voy a trabajar en el paso [F4 / B6 / M3] de docs/distribucion-de-trabajo.md.
Archivo: [ruta]. Sigue su PROMPT, dame el código y cómo probarlo.
```

### Mensaje de cierre (al terminar cada paso)
```
La prueba del paso [X] [pasó / falló]. Resultado: [pega la salida].
[Si pasó] Dame el mensaje de commit y la descripción del PR.
[Si falló] Ayúdame a encontrar la causa.
```

---

## Eymer · firmware y status.service

```
Soy Eymer, del proyecto CampusIoT (Unicomfacauca, Popayán). Mi rama es eymer/firmware y trabajo en firmware/.
Tengo además un paso fuera de mi carpeta: B5 (backend/src/services/status.service.js y su test), en la rama eymer/status; su PR lo revisa Yined.

Mis pasos (docs/distribucion-de-trabajo.md §6.1), en este orden: F1, F2, F3, F4, B5, F5, F6, F7, F8, F9. Después: 4.3 calibración (docs/calibracion/protocolo-calibracion.md) y 4.4 integración. Armado (4.1) ya está hecho; la instalación (4.2) la hacemos las tres.
Esta semana: F1-F4 y B5 antes del martes 3 nov; F5-F7 en la S5. El viernes 6 nov es la primera prueba de extremo a extremo.

Stack firmware: ESP32 DevKit + PlatformIO (Arduino), radares LD2410C por UART, DHT22, MAX4466 (ADC1), ArduinoJson.
Stack B5: Node 20 (ESM) + vitest. Funciones puras, sin BD ni red.

Reglas:
1. Un archivo o bloque pequeño a la vez, siguiendo el comentario PROMPT del archivo. Primero cada sensor suelto en banco; la red va al final.
2. Pines siempre de docs/hardware/pines-y-cableado.md y config.h; nunca números sueltos.
3. El JSON del POST debe cumplir docs/api-contract.md. Si choca algo, manda el contrato.
4. Nunca delay() largos: usar millis(). Nunca enviar ni guardar audio, solo el índice 0-100.
5. config.h no se sube al repo (está en .gitignore).
6. B5, diseño obligatorio: el LD2410C entrega UN solo objetivo por radar y lectura. Una mesa cuenta como ocupada si en la ventana config.ventana_s (45 s; incluye la lectura actual) algún radar de su zona tuvo present=true con distance_cm dentro de su banda. Bandas [min_cm, max_cm). Los umbrales vienen por parámetro (de la BD), nunca fijos en el código. Los casos del test son los del PROMPT de tests/unit/status.service.test.js.
7. Dame siempre la prueba "hecho cuando" del paso y cómo verla (monitor serial, o npm test en B5).
8. Cierra con 3-5 líneas para la descripción del PR.
Respuestas concisas, paso a paso y con confirmación visual.
```

## Yined · backend y base de datos

```
Soy Yined, del proyecto CampusIoT (Unicomfacauca, Popayán). Mi rama es yined/backend y trabajo en backend/ y database/.
Mis pasos (docs/distribucion-de-trabajo.md §6.2), en este orden: B0, B1, B2, B3, B4, B6, B8, B9, B10, B11, B12, más 1.1, 2.3, 4.5 y 5.2.
B5 (status.service) lo hace Eymer y B7 (simulador) lo hace María: yo reviso esos PR y uso su código. B6 depende de B5.
Esta semana: B0-B4 antes del martes 3 nov; B6 y B8 en la S5. Camino crítico: sin B6, Eymer no puede probar F7 con el backend real.

Stack: Node 20 (ESM), Express 4, pg, zod, vitest + supertest, PostgreSQL (Docker local, Supabase en línea).
Reglas:
1. Un archivo a la vez, siguiendo el comentario PROMPT. Capas: routes → controllers → services → repositories. Sin SQL en controladores ni reglas en repositorios.
2. SQL siempre con parámetros ($1, $2). Nunca concatenar texto del usuario.
3. Los umbrales y la ventana (ventana_s) viven en la BD (config_espacio, banda_mesa), jamás en el código.
4. Errores en formato { error: { codigo, mensaje } } según docs/api-contract.md. El 409 de FRANJA_DUPLICADA lo lanza checks.service (AppError) capturando el 23505 que sube del repositorio.
5. La BD está en español: espacio, nodo, zona, banda_mesa, config_espacio, lectura, verificacion_manual. El JSON de la API sigue en inglés según docs/api-contract.md; los repositorios traducen con alias (AS) según docs/base-de-datos/diccionario-de-datos.md.
6. ESM: no existe __dirname; usar path.dirname(fileURLToPath(import.meta.url)).
7. readings.service carga la ventana de lecturas en AMBOS modos (mesas y espacio) y le pasa la lista a status.calcularEstado (la lectura actual incluida). spaces.service expone estadoActual(slug), que usa checks.service.
8. Dame siempre la prueba "hecho cuando" (curl o npm test) y no avancemos si falla.
9. Cierra con 3-5 líneas para la descripción del PR.
Respuestas concisas, paso a paso.
```

## María · frontend y simulador

```
Soy María, del proyecto CampusIoT (Unicomfacauca, Popayán). Mi rama es maria/frontend y trabajo en frontend/.
Tengo además un paso fuera de mi carpeta: B7 (tools/simulator.js), en la rama maria/simulador; su PR lo revisa Yined.

Mis pasos (docs/distribucion-de-trabajo.md §6.3), en este orden: M1, M2, B7, M3, M4, M5, M6, M7, más 1.2, 2.2, 3.3, 3.4 y 6.1.
Esta semana: M1, M2 y B7 antes del martes 3 nov; M3 y M4 en la S5. M5 y M6 dependen de B10 y B9 de Yined.

Stack frontend: HTML, CSS y JavaScript sin framework (módulos ES), Chart.js por CDN con versión fija, servido por el mismo backend.
Stack simulador: Node 20 sin dependencias (fetch); tools/package.json ya declara type: module.
Reglas:
1. Un archivo a la vez, siguiendo el comentario PROMPT. Toda la lógica va en js/, no en el HTML.
2. Móvil primero (se abre desde un QR), legible a 360 px. El estado se muestra con color Y texto.
3. Nunca innerHTML con datos del servidor: usar textContent.
4. Toda llamada al servidor pasa por js/api.js (POLL_MS = 3000). Formato en js/util.js. El enlace de la encuesta va en ENCUESTA_URL (js/util.js).
5. Los datos vienen de docs/api-contract.md. En el simulador, las distancias de la zona A deben caer dentro de las bandas del seed (0-150, 150-300, 300-450 cm) y recorrer varias mesas para que el estado pase por libre, parcial y lleno.
6. Dame siempre la prueba "hecho cuando" y cómo verla en el navegador o en el terminal.
7. Cierra con 3-5 líneas para la descripción del PR.
Respuestas concisas, paso a paso y con confirmación visual.
```
