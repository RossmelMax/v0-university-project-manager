#!/usr/bin/env bash
# Inicia el dev server de v0-university-project-manager (Next.js) en local.
# Uso: ./start.sh   (puerto por defecto 3000; override con PORT=3001 ./start.sh)
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-3000}"
LOG_DIR="logs"
PID_FILE="$LOG_DIR/dev.pid"
mkdir -p "$LOG_DIR"

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Ya hay un dev server corriendo (PID $(cat "$PID_FILE"))."
  echo "URL: http://localhost:$PORT"
  exit 0
fi

if [ ! -d node_modules ]; then
  echo "Dependencias no encontradas. Instalando con pnpm..."
  pnpm install
fi

echo "Arrancando Next.js dev server en http://localhost:$PORT ..."
setsid pnpm dev -p "$PORT" > "$LOG_DIR/dev.log" 2>&1 &
echo $! > "$PID_FILE"

# Esperar a que el puerto responda (máx 30s)
for i in $(seq 1 30); do
  if curl -s -o /dev/null "http://localhost:$PORT" 2>/dev/null; then
    echo "✅ Dev server listo. URL: http://localhost:$PORT"
    echo "Log: $LOG_DIR/dev.log (PID $(cat "$PID_FILE"))"
    exit 0
  fi
  sleep 1
done

echo "⚠️ El servidor no respondió en 30s. Revisa $LOG_DIR/dev.log"
exit 1
