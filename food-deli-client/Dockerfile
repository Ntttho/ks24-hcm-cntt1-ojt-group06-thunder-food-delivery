# ==========================================
# Multi-stage Dockerfile for food-deli-client
# Frontend: React 19 + TypeScript + Vite + Tailwind CSS
# ==========================================

# ------------------------------------------
# Stage 1: Build the React Application
# ------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies using package-lock.json for reproducible builds
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build argument: VITE_API_BASE_URL (defaults to /api/v1 for reverse-proxy routing via Nginx)
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_APP_TITLE="Thunder Food Delivery"

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_TITLE=${VITE_APP_TITLE}

# Build production bundle into /app/dist
RUN npm run build

# ------------------------------------------
# Stage 2: Production Nginx Server
# ------------------------------------------
FROM nginx:1.27-alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration (SPA routing & API reverse proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]

