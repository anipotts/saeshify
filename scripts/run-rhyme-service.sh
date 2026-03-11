#!/bin/bash
# Auto-restart wrapper for rhyme-service.py on cuda5.
# Usage: nohup bash scripts/run-rhyme-service.sh &
cd "$(dirname "$0")/.."
source ~/whisperx-service/venv/bin/activate
while true; do
  echo "[$(date)] Starting rhyme service..."
  python3 scripts/rhyme-service.py 2>&1 | tee -a /tmp/rhyme-service.log
  EXIT_CODE=$?
  echo "[$(date)] Rhyme service exited with code $EXIT_CODE, restarting in 10s..."
  sleep 10
done
