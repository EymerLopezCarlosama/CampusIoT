# Autorización y condiciones de red y energía (tarea 1.1)

CampusIoT · Unicomfacauca · Responsable: Yined Peteví

## 1. Decisión de red
El prototipo usa red propia del equipo (no la red del campus). Esto evita depender de las credenciales institucionales y de un posible portal cautivo. Los nodos envían por internet al servidor en Render.

| Elemento | Valor |
|---|---|
| Tipo de red | Hotspot de celular / router propio con datos móviles (completar) |
| Banda | 2,4 GHz (el ESP32 no soporta 5 GHz) |
| Seguridad | WPA2 personal |
| Dónde se configura | `firmware/src/config.h` (no se sube al repo) |

## 2. Condiciones por espacio (completar en sitio)
| Condición | Estudio Gastronomía | Sótano |
|---|---|---|
| Placas que se instalan | 2 (radares A y B) | 1 (radar S) |
| Tomacorrientes disponibles cerca de la placa | | |
| Fuente 5 V 2 A por placa | | |
| Señal de la red propia (probada con celular) | | |
| Señal móvil (datos) en el sitio | | |
| Altura de instalación del radar (1,5 a 2,5 m) | | |
| Sin paredes metálicas cerca del radar | | |
| Lugar seguro para la placa y la fuente | | |

## 3. Plan B
Si el Sótano no tiene señal móvil: un router con datos móviles o un segundo hotspot dedicado a ese espacio.
Si falla la red durante la jornada: el nodo reintenta y retoma solo (F8); el espacio aparece como `sin_conexión` y cuenta como no coincidente.

## 4. Autorización de instalación
| Dato | Valor |
|---|---|
| Dependencia | Infraestructura |
| Fecha de la solicitud | |
| Fecha de la respuesta | |
| Persona que autoriza | |
| Condiciones de la autorización | |

## 5. Privacidad
No hay cámaras ni audio. El micrófono entrega solo un nivel sonoro de 0 a 100. Cada espacio tendrá un aviso con esta información.