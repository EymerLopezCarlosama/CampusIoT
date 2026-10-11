# Historias de usuario

Prioridad: A = alta, M = media, B = baja. Puntos: esfuerzo relativo (1, 2, 3, 5, 8).

| HU | Como... quiero... para... | OE | Tarea | Resp. | Prior. | Pts |
|---|---|---|---|---|---|---|
| HU-01 | **Nodo ESP32**, enviar mis lecturas cada 3 s, **para** que el sistema las almacene | OE1, OE2 | 3.1, 3.2 | Eymer, Yined | A | 8 |
| HU-02 | **Estudiante**, ver el estado de cada espacio (libre, parcial o lleno), **para** decidir adónde ir | OE3 | 3.3 | María | A | 5 |
| HU-03 | **Estudiante**, ver temperatura, humedad y ruido de cada espacio, **para** elegir un sitio cómodo | OE3 | 3.3 | María | A | 3 |
| HU-04 | **Estudiante**, ver "sin conexión" si un nodo dejó de reportar, **para** no confiar en datos viejos | OE2, OE3 | 3.2, 3.3 | Yined, María | A | 3 |
| HU-05 | **Bienestar Institucional**, ver el historial de uso por horas, **para** conocer cómo se usan los espacios | OE3 | 3.3 | María | M | 5 |
| HU-06 | **Equipo**, ajustar umbrales y bandas de mesa sin tocar código, **para** calibrar los radares | OE1 | 4.3 | Eymer | A | 5 |
| HU-07 | **Equipo**, registrar la verificación manual por franja, **para** compararla con el sistema | OE4 | 5.1 | Todas | A | 5 |
| HU-08 | **Equipo**, ver el porcentaje de coincidencia (meta 32 de 40), **para** saber si se cumple OE4 | OE4 | 5.2 | Yined | A | 3 |
| HU-09 | **Equipo**, ver disponibilidad y retardo por nodo, **para** verificar OE2 (≥ 90 %, ≤ 10 s) | OE2 | 4.5, 5.2 | Yined | A | 3 |
| HU-10 | **Estudiante**, ver el aviso de privacidad y el enlace a la encuesta QR, **para** saber que no hay cámaras ni audio | OE3 | 3.4 | María | M | 2 |
| HU-11 | **Desarrollador**, un simulador de nodos, **para** programar backend y página sin hardware | OE2, OE3 | 3.2, 3.3 | Yined | A | 3 |
| HU-12 | **Equipo**, ver si cada nodo está en línea (`/salud`), **para** confirmar OE1 al instalar | OE1 | 4.2, 4.4 | Eymer | M | 2 |

## Criterios de aceptación

**HU-01** · El nodo envía un POST válido cada 3 s con su `x-api-key` · Si falla el WiFi, reintenta sin bloquearse · El servidor responde 201 y guarda la lectura con su estado.
**HU-02** · La página muestra una tarjeta por espacio con estado en color y texto (no solo color) · Se actualiza sola cada 3 s · En Gastronomía muestra "N de 4 mesas ocupadas".
**HU-03** · Cada tarjeta muestra temperatura (°C), humedad (%) y nivel de ruido; si falta el DHT22, muestra "—".
**HU-04** · Si pasan más de 30 s sin lecturas, el estado es `sin_conexion` y la tarjeta indica hace cuánto reportó por última vez.
**HU-05** · Gráfica de las últimas 6 horas (ajustable) de ocupación, temperatura, humedad y ruido por espacio.
**HU-06** · Con `x-admin-key` se cambian umbrales y bandas; el cambio se aplica a la lectura siguiente, sin reiniciar · La pantalla de calibración muestra la distancia y la energía de cada radar en vivo.
**HU-07** · Un formulario guarda espacio, día, franja y estado observado; no permite duplicar la misma franja · Muestra cuántas de las 40 comparaciones van.
**HU-08** · El resumen muestra coincidencia = coincidentes ÷ 40 × 100 y si cumple el 80 %.
**HU-09** · `/metrics` calcula disponibilidad y retardo por nodo en un rango de fechas.
**HU-10** · La página incluye el texto de privacidad y un enlace a la encuesta.
**HU-11** · `node tools/simulator.js` simula los 2 nodos con ocupación variable y puede simular una caída.
**HU-12** · `/salud` lista los nodos con su última lectura y si están en línea.
