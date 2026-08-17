# ==========================================
# CodeSync AI — Backend Production Dockerfile
# ==========================================

# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and backend package definitions
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install build dependencies
RUN npm install --prefix backend

# Copy backend source code
COPY backend/ ./backend/

# Compile TypeScript
RUN npm run build --prefix backend

# 2. Production Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy package files and install production-only dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev --prefix .

# Copy compiled JavaScript output from builder
COPY --from=builder /app/backend/dist ./dist

# Create unprivileged application user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
