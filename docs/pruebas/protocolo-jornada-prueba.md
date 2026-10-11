# Protocolo de la jornada de prueba (tarea 5.1 · OE4)

**Qué se mide:** coincidencia = comparaciones coincidentes ÷ 40 × 100. Meta: ≥ 80 % (32 de 40).
**Las 40 comparaciones:** 2 espacios × 10 franjas horarias (las mismas del primer corte) × 2 días.

## Antes (día anterior)
- [ ] Ambos nodos en línea (`/api/salud`) y con datos en la página.
- [ ] Parámetros de calibración guardados y anotados.
- [ ] Carteles con aviso de privacidad y QR puestos.
- [ ] Servicio gratuito del backend despierto (abrir la página 1 minuto antes).
- [ ] Definir las 10 etiquetas de franja (ej. `07:00`, `08:00`, …) y usarlas igual en `verificacion.html`.

## Durante cada franja
1. Una persona entra al espacio y cuenta **las mesas con al menos una persona** (la misma regla del sistema; no cuenta personas).
2. Define el estado: Gastronomía: 0 = libre, 1-3 = parcial, 4 = lleno. Sótano: libre, con personas o lleno (criterio acordado antes de la jornada).
3. Lo registra en `verificacion.html` **sin mirar antes lo que dice la página** (evita sesgo).
4. El sistema guarda su propio estado en el mismo instante; la coincidencia se calcula sola.
5. Si el nodo está caído, se registra igual: cuenta como no coincidente.

## Después
- [ ] `GET /api/validation/summary` y `GET /api/validation/export` (CSV para el informe).
- [ ] `GET /api/metrics` del rango de la jornada: disponibilidad ≥ 90 % y retardo ≤ 10 s.
- [ ] Capturas de pantalla de la página y del resumen.
- [ ] Anotar casos de desacuerdo y su causa (insumo del informe, tarea 6.1).
