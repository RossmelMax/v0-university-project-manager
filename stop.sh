#!/usr/bin/env bash
# Detiene el dev server de v0-university-project-manager.
# Uso: ./stop.sh   (puerto por defecto 3000; override con PORT=3001 ./stop.sh)
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-3000}"
LOG_DIR="logs"
PID_FILE="$LOG_DIR/dev.pid"

stopped=0

# 1) Matar el árbol por PID guardado (grupo de procesos, vía setsid)
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    kill -TERM -"$PID" 2>/dev/null || kill -TERM "$PID" 2>/dev/null || true
    echo "Dev server detenido (PID $PID)."
    stopped=1
  else
    echo "PID $PID ya no está corriendo."
  fi
  rm -f "$PID_FILE"
fi

# 2) Fallback: matar lo que escuche en el puerto (next-server real)
PORT_PID=$(ss -tlnp 2>/dev/null | grep ":${PORT} " | grep -oP 'pid=\K[0-9]+' | head -1 || true)
if [ -n "${PORT_PID:-}" ]; then
  kill -TERM "$PORT_PID" 2>/dev/null || true
  echo "Proceso en puerto $PORT terminado (PID $PORT_PID)."
  stopped=1
fi

if [ "$stopped" = "1" ]; then
  echo "✅ Detenido."
else
  echo "No se encontró ningún dev server corriendo."
fi
