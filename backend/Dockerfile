FROM node:24-alpine AS builder
WORKDIR /app
ENV MONGOMS_DISABLE_POSTINSTALL=1
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --workspace=backend --include-workspace-root=false
COPY backend/ ./backend/
RUN npm run build --workspace=backend

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production MONGOMS_DISABLE_POSTINSTALL=1
RUN apk add --no-cache docker-cli
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --omit=dev --workspace=backend --include-workspace-root=false
COPY --from=builder /app/backend/dist ./backend/dist
WORKDIR /app/backend
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:5000/api/v1/health || exit 1
CMD ["node", "dist/server.js"]
