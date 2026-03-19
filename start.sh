#!/bin/bash

# Start the FastAPI backend which also serves the frontend static files
cd /app
exec uvicorn backend.server:app --host 0.0.0.0 --port ${PORT:-8001}
