# ---------- Build stage ----------
FROM node:20-bookworm-slim AS build

# Install any build tools you might need (kept minimal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and config
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript -> dist/
RUN npm run build


# ---------- Runtime stage ----------
FROM node:20-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JS from build stage
COPY --from=build /app/dist ./dist

# Default port (can be overridden)
ENV PORT=3000
EXPOSE 3000

# Default UA so container works without extra env
ENV WEATHER_SERVICE_USER_AGENT="weather-service (container@example.com)"

CMD ["node", "dist/index.js"]
