#!/bin/bash
# Sevencore AI - Safe Frontend Runner
# Ensures port 3000 is freed automatically and stale cache is cleared before starting Next.js

PORT=3000
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -d "$SCRIPT_DIR/frontend" ]; then
    FRONTEND_DIR="$SCRIPT_DIR/frontend"
else
    FRONTEND_DIR="$SCRIPT_DIR"
fi

echo "Checking port $PORT..."
EXISTING_PID=$(lsof -ti :$PORT)
if [ -n "$EXISTING_PID" ]; then
    echo "Found existing process on port $PORT (PID: $EXISTING_PID). Freeing port..."
    kill -9 $EXISTING_PID 2>/dev/null || true
    sleep 1
    echo "Port $PORT is now clean."
else
    echo "Port $PORT is available."
fi

cd "$FRONTEND_DIR"

echo "Starting Next.js Dev Server on http://localhost:$PORT..."
echo "Tip: Press Ctrl+C to stop the dev server."
echo "---------------------------------------------------------"

exec npm run dev
