# ==============================================================================
# FleetFlow Logistics Platform - Production Frontend Multi-Stage Dockerfile
# Milestone 4: Docker & Production Infrastructure Configuration
# ==============================================================================

# Stage 1: Build production React Vite SPA bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors and install dependencies
COPY package*.json ./
RUN npm ci --silent || npm install --silent

# Copy frontend source files and build
COPY . .
RUN npm run build

# Stage 2: Serve compiled SPA through high-performance Nginx Alpine
FROM nginx:1.25-alpine AS production

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled production artifacts from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy optimized Nginx production configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
