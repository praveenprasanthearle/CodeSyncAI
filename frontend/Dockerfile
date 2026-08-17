# ==========================================
# CodeSync AI — Frontend Production Dockerfile
# ==========================================

# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and frontend package definitions
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install --prefix frontend

# Copy frontend source code
COPY frontend/ ./frontend/

# Build optimized production bundle with Vite
RUN npm run build --prefix frontend

# 2. Production Web Server Stage (Nginx)
FROM nginx:1.27-alpine AS runner

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
