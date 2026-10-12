# CampusIoT

Prototipo IoT que informa en tiempo real la ocupación por zona y las condiciones ambientales (temperatura, humedad y ruido) de dos espacios de la sede Popayán: **Estudio Gastronomía** y **Sótano**.
Unicomfacauca · Ingeniería de Sistemas · Formulación y Evaluación de Proyectos. Sin cámaras y sin grabar audio.

## Arquitectura
`ESP32 (radares LD2410C + DHT22 + MAX4466)` → HTTP POST cada 3 s → `backend` (Node.js + Express) → `PostgreSQL` → `frontend` (HTML/CSS/JS, servido por el mismo backend).
Detalle en [docs/arquitectura.md](docs/arquitectura.md).

## Estructura
| Carpeta | Contenido | Tarea / Responsable |
|---|---|---|
| `firmware/` | Código de los nodos ESP32 (PlatformIO) | 3.1 · Eymer |
| `backend/` | API REST, lógica de estado y acceso a la BD | 3.2 · Yined |
| `database/` | `schema.sql`, `seeds/seed.sql`, migraciones | 3.2 · Yined |
| `frontend/` | Páginas: estado en vivo, historial, verificación, calibración | 3.3 · María |
| `tools/` | `simulator.js`: envía lecturas falsas para desarrollar sin hardware | Todas |
| `docs/` | Arquitectura, contrato de la API, historias de usuario, hardware, calibración, jornada de prueba y [distribución de trabajo](docs/distribucion-de-trabajo.md) (orden de desarrollo por persona) | 2.1 · 2.3 |

## Arranque rápido (sin hardware)
1. `bash scripts/setup.sh` (crea `.env` y `firmware/src/config.h`, instala el backend).
2. Base de datos: `docker compose up -d db` (o Supabase: ejecutar `database/schema.sql` y `database/seeds/seed.sql`).
3. `cd backend && npm run dev` → página en http://localhost:3000
4. En otra terminal: `node tools/simulator.js` para ver datos en la página.

## Docker (opcional)
Sirve para tener la misma base de datos en los tres computadores sin instalar PostgreSQL.
- `docker compose up -d db` → solo la base de datos (recomendado en desarrollo).
- `docker compose up --build` → base de datos + backend + página, todo en contenedores.
- Para reiniciar la BD desde cero: `docker compose down -v` y volver a subir.
El firmware **no** usa Docker; se compila y se sube con PlatformIO.

## Flujo de ramas
Sin `develop`: `main` es la rama estable (lo que se usa en la jornada de prueba) y cada integrante trabaja en su propia rama:
| Rama | Quién | Carpeta |
|---|---|---|
| `eymer/firmware` | Eymer | `firmware/` |
| `yined/backend` | Yined | `backend/`, `database/` |
| `maria/frontend` | María | `frontend/` |

Se trabaja en la rama propia, se abre un Pull Request hacia `main` y otra persona lo revisa antes de unirlo. Antes de empezar cada día: `git pull origin main` y unir `main` a tu rama (`git merge main`).
Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

## Reglas del repo
- Nunca subir `.env` ni `firmware/src/config.h` (WiFi y API keys). Usar los archivos `*.example`.
- Los umbrales de estado viven en la BD (`config_espacio`, `banda_mesa`), no en el código: se ajustan en la calibración (tarea 4.3).
- Si cambia un endpoint o el JSON del nodo, se actualiza primero `docs/api-contract.md`.
- Nombres: la BD está en español (tablas y columnas); la API (rutas y JSON) conserva los nombres del contrato en inglés. La equivalencia está en `docs/base-de-datos/diccionario-de-datos.md`.
