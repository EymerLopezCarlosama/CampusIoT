# Protocolo de calibración (tarea 4.3 · responsable: Eymer)

Objetivo: dejar en la BD las bandas de distancia por mesa (Gastronomía) y los umbrales (Sótano) para llegar a ≥ 80 % de coincidencia.
Herramienta: `frontend/calibracion.html` (distancia y energía de cada radar en vivo) y `PUT /api/spaces/:slug/config`.

## Estudio Gastronomía (modo mesas)
1. Con el nodo instalado y la página de calibración abierta, verificar que ambos radares reportan (zonas A y B).
2. **Con el espacio vacío** 60 s: anotar la energía de fondo. Si hay lecturas fantasma, mover o reorientar el radar.
3. Una persona se sienta en la **mesa 1 de la zona A** y se queda quieta 30 s. Anotar `distance_cm` y `energy`. Repetir en las mesas 2 y 3, y en la mesa de la zona B.
4. Definir para cada mesa una banda `min_cm`–`max_cm` que contenga la distancia medida con ±20 cm de margen y que no se solape con la mesa vecina.
5. Guardar las bandas (intervalo `[min_cm, max_cm)`) con `PUT /api/spaces/gastronomia/config` y repetir el paso 3 para confirmar que la mesa correcta se marca como ocupada.
   Como el radar ve un solo objetivo por lectura, el estado usa la ventana `ventana_s` (45 s por defecto): para ver 2-3 mesas ocupadas hay que esperar esa ventana. Ajustar `ventana_s` (30-60 s) si el estado tarda demasiado o parpadea.
6. Probar con 2 personas en mesas distintas y con una persona caminando por el pasillo (no debe contar).

## Sótano (modo espacio)
1. Registrar la energía promedio (ventana de 60 s) con el sótano **vacío** y en distintos momentos de uso real.
2. Fijar `umbral_personas` justo por encima del ruido del radar vacío y `umbral_lleno` con lo observado cuando se ve el espacio casi lleno (7 mesas, 28 puestos).
3. No se convoca gente: se aprovecha el uso natural y al equipo. Registrar cada prueba en la tabla.

## Registro de parámetros (entregable de la tarea)
| Fecha | Espacio | Parámetro | Valor anterior | Valor nuevo | Evidencia |
|---|---|---|---|---|---|
| | | | | | |
