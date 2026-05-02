# Stage 1: Build the MLOps Pipeline Frontend
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production environment for MLOps Pipeline Inference Engine
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/db.json ./

# Install only production dependencies
RUN npm install --omit=dev && npm install -g tsx

EXPOSE 3000
ENV NODE_ENV=production

# Start the Sovereign Server
CMD ["tsx", "server.ts"]
