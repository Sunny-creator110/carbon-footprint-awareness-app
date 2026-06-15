# ========================================================
# Stage 1: Build Frontend Assets
# ========================================================
FROM node:18-alpine AS frontend-builder
WORKDIR /usr/src/app/frontend

COPY frontend/package.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ========================================================
# Stage 2: Package Production Node.js Server
# ========================================================
FROM node:18-alpine AS production-runner
WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy backend dependencies
COPY backend/package.json ./
RUN npm install --only=production

# Copy backend files
COPY backend/ ./

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /usr/src/app/frontend/dist ./frontend/dist

# Expose default port
EXPOSE 8080
ENV PORT=8080

# Run Node application
CMD ["node", "server.js"]
