#!/bin/bash

echo "🛑 Stopping Unified Spawn System..."

# Read PIDs
if [ -f .orchestrator_pid ]; then
    kill $(cat .orchestrator_pid) 2>/dev/null
    rm .orchestrator_pid
fi

if [ -f .spawn_pid ]; then
    kill $(cat .spawn_pid) 2>/dev/null
    rm .spawn_pid
fi

if [ -f .rng_pid ]; then
    kill $(cat .rng_pid) 2>/dev/null
    rm .rng_pid
fi

if [ -f .bus_pid ]; then
    kill $(cat .bus_pid) 2>/dev/null
    rm .bus_pid
fi

if [ -f .port_pid ]; then
    kill $(cat .port_pid) 2>/dev/null
    rm .port_pid
fi

if [ -f .hooks_pid ]; then
    kill $(cat .hooks_pid) 2>/dev/null
    rm .hooks_pid
fi

# Also kill by port in case PIDs are stale
lsof -ti:7654 | xargs kill -9 2>/dev/null || true
lsof -ti:7655 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:9999 | xargs kill -9 2>/dev/null || true
lsof -ti:9998 | xargs kill -9 2>/dev/null || true

echo "✅ All services stopped"