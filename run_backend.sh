#!/bin/bash
# Sevencore AI - Safe Backend Runner
# Ensures port 8000 is freed automatically before starting Uvicorn

PORT=8000
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

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

cd "$BACKEND_DIR"

if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

echo "Starting Sevencore AI Backend on http://127.0.0.1:$PORT..."
echo "Tip: Press Ctrl+C (not Ctrl+Z) to stop the server."
echo "---------------------------------------------------------"

exec uvicorn app.main:app --host 127.0.0.1 --port $PORT --reload
