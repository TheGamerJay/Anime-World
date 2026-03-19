# =============================================================================
# Multi-stage Dockerfile for Anime World
#
# Stage 1 (frontend-build): Compile the Expo web frontend
# Stage 2 (final):          Python 3.11 slim image with backend + built assets
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1 — Frontend build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Install dependencies first (layer-cached unless package.json changes)
COPY frontend/package.json ./
RUN yarn install --frozen-lockfile

COPY frontend/ .
RUN npx expo export --platform web

# -----------------------------------------------------------------------------
# Stage 2 — Production image
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS final

# Security: run as non-root user
RUN groupadd --gid 1001 appgroup \
    && useradd --uid 1001 --gid appgroup --shell /bin/bash --create-home appuser

WORKDIR /app

# System dependencies (gcc needed for some Python packages, curl for healthcheck)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc curl \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies — install before copying source code for better caching
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend from Stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x start.sh

# Create uploads directory with correct ownership
RUN mkdir -p ./backend/uploads/avatars \
    && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8001}/api/health || exit 1

EXPOSE 8001

CMD ["./start.sh"]
