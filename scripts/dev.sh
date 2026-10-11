#!/bin/bash
# Levanta la base de datos local (Docker) y el backend con recarga automática.
# La página se sirve desde el mismo backend: http://localhost:3000
# Sin hardware: en otra terminal ejecutar `node tools/simulator.js`.
set -e
cd "$(dirname "$0")/.."
docker compose up -d db
cd backend && npm run dev
