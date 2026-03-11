#!/bin/bash
# Auto-restart wrapper for rhyme-queue-worker.ts on cuda5.
# Usage: nohup bash scripts/run-rhyme-queue-worker.sh &
cd "$(dirname "$0")/.."
while true; do
  echo "[$(date)] Starting rhyme queue worker..."
  npx tsx scripts/rhyme-queue-worker.ts 2>&1 | tee -a /tmp/rhyme-queue-worker.log
  EXIT_CODE=$?
  echo "[$(date)] Worker exited with code $EXIT_CODE, restarting in 30s..."
  sleep 30
done
