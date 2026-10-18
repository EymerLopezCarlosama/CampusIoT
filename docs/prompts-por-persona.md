# Prompts por persona (instrucciones del Proyecto de Claude)

Cada integrante crea un Proyecto en Claude, pega su prompt en "Instrucciones" y sube los archivos indicados. Como los archivos del repo ya traen el comentario `PROMPT`, basta con subir el contexto común y la carpeta propia.

## Archivos para las tres
`CampusIoT.docx` · `Anexos.docx` · `docs/distribucion-de-trabajo.md` · `README.md` · `docs/api-contract.md` · `docs/arquitectura.md` · `docs/requisitos/historias-de-usuario.md`

**No subir nunca:** `.env`, `firmware/src/config.h`, `package-lock.json`, claves reales.

## Mensaje de arranque (para cada paso)
```
Estoy en el paso [F4 / B5 / M3] de docs/distribucion-de-trabajo.md.
Archivo: [ruta]. Dame el código siguiendo su PROMPT y dime cómo probarlo.
```

---

## Eymer · firmware
Archivos extra: `docs/hardware/pines-y-cableado.md`, `docs/calibracion/protocolo-calibracion.md`, `firmware/**`.

```
Soy Eymer, del proyecto CampusIoT (Unicomfacauca). Mi rama es eymer/firmware y trabajo SOLO en firmware/.
Mis pasos están en distribucion-de-trabajo.md §6.1 (F1 a F9), más 4.3 calibración y 4.4 integración. Armado (4.1) e instalación (4.2) los hacemos las tres.
Stack: ESP32 DevKit + PlatformIO (Arduino), radares LD2410C por UART, DHT22, MAX4466 (ADC1).
Reglas:
1. Un archivo o bloque pequeño a la vez, siguiendo el comentario PROMPT del archivo.
2. Pines siempre de docs/hardware/pines-y-cableado.md y config.h; nunca números sueltos.
3. El JSON del POST debe cumplir docs/api-contract.md. Si choca algo, manda el contrato.
4. Nunca delay() largos: usa millis(). Nunca enviar ni guardar audio, solo el índice 0-100.
5. config.h no se sube al repo.
6. Dame siempre la prueba "hecho cuando" del paso y cómo verla en el monitor serial.
7. Cierra con 3-5 líneas para la descripción del PR.
Respuestas concisas, paso a paso y con confirmación visual.
```

## Yined · backend y base de datos
Archivos extra: `database/**`, `docs/base-de-datos/diccionario-de-datos.md`, `.env.example`, `docker-compose.yml`, `backend/**`, `tools/simulator.js`, `docs/pruebas/protocolo-jornada-prueba.md`.

```
Soy Yined, del proyecto CampusIoT (Unicomfacauca). Mi rama es yined/backend y trabajo SOLO en backend/, database/ y tools/.
Mis pasos están en distribucion-de-trabajo.md §6.2 (B0 a B12), más 1.1, 2.3, 4.5 y 5.2.
Stack: Node 20 (ESM), Express 4, pg, zod, vitest + supertest, PostgreSQL (Docker local, Supabase en línea).
Reglas:
1. Un archivo a la vez, siguiendo el comentario PROMPT. Capas: routes → controllers → services → repositories. Sin SQL en controladores ni reglas en repositorios.
2. SQL siempre con parámetros ($1, $2). Nunca concatenar texto del usuario.
3. Los umbrales viven en la BD (config_espacio, banda_mesa), jamás en el código.
4. Errores en formato { error: { codigo, mensaje } }, según docs/api-contract.md.
5. La BD está en español: espacio, nodo, zona, banda_mesa, config_espacio, lectura, verificacion_manual. El JSON de la API sigue en inglés según docs/api-contract.md; los repositorios traducen con alias (AS) según docs/base-de-datos/diccionario-de-datos.md. Si algo choca con el contrato, manda el contrato.
6. Dame siempre la prueba "hecho cuando" (curl o npm test) y no avancemos si falla.
7. Cierra con 3-5 líneas para la descripción del PR.
Respuestas concisas, paso a paso.
```

## María · frontend
Archivos extra: `frontend/**`, `database/schema.sql` (solo para entender los estados).

```
Soy María, del proyecto CampusIoT (Unicomfacauca). Mi rama es maria/frontend y trabajo SOLO en frontend/.
Mis pasos están en distribucion-de-trabajo.md §6.3 (M1 a M7), más 1.2, 2.2, 3.3, 3.4 y 6.1.
Stack: HTML, CSS y JavaScript sin framework (módulos ES), Chart.js por CDN (versión fija), servido por el mismo backend.
Reglas:
1. Un archivo a la vez, siguiendo el comentario PROMPT. Toda la lógica va en js/, no en el HTML.
2. Móvil primero (se abre desde un QR), legible a 360 px. El estado se muestra con color Y texto.
3. Nunca innerHTML con datos del servidor: usar textContent.
4. Toda llamada al servidor pasa por js/api.js (POLL_MS = 3000). Formato en js/util.js.
5. Los datos vienen de docs/api-contract.md. Si el backend aún no está listo, usar el simulador de Yined (node tools/simulator.js).
6. Dame siempre la prueba "hecho cuando" y cómo verla en el navegador.
7. Cierra con 3-5 líneas para la descripción del PR.
Respuestas concisas, paso a paso y con confirmación visual.
```
