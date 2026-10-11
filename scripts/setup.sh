#!/bin/bash
# Instala lo necesario para desarrollar. Windows: ejecutar desde Git Bash.
set -e
cd "$(dirname "$0")/.."
[ -f .env ] || { cp .env.example .env; echo "Creado .env (revisa DATABASE_URL)"; }
[ -f firmware/src/config.h ] || { cp firmware/src/config.example.h firmware/src/config.h; echo "Creado firmware/src/config.h (pon tu WiFi y API key)"; }
(cd backend && npm install)
echo "Listo. Base de datos local: docker compose up -d db   (o usa Supabase y ejecuta database/schema.sql + seeds/seed.sql)"
