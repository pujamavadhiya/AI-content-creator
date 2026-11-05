#!/bin/bash
# Sevencore AI - Free Ports Script
# Cleans ports 8000 (Backend) and 3000 (Frontend)

echo "Freeing port 8000 (Backend)..."
PID_8000=$(lsof -ti :8000)
if [ -n "$PID_8000" ]; then
    kill -9 $PID_8000 2>/dev/null || true
    echo "✓ Port 8000 freed."
else
    echo "✓ Port 8000 was already free."
fi

echo "Freeing port 3000 (Frontend)..."
PID_3000=$(lsof -ti :3000)
if [ -n "$PID_3000" ]; then
    kill -9 $PID_3000 2>/dev/null || true
    echo "✓ Port 3000 freed."
else
    echo "✓ Port 3000 was already free."
fi

echo "All ports are clean!"

