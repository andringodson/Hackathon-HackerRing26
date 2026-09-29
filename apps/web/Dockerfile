# Production image for the web app. Runs on any container host (Render, Koyeb, Fly.io, Railway,
# Cloud Run, a VM with docker compose). Build from apps/web:
#   docker build -t disasterintel-web --build-arg NEXT_PUBLIC_API_URL=https://api.example.com .

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so they are build args,
# not runtime env. An empty API URL builds the demo-data version.
ARG NEXT_PUBLIC_API_URL=""
ARG NEXT_PUBLIC_WS_URL=""
ARG NEXT_PUBLIC_MAP_STYLE_URL="https://tiles.openfreemap.org/styles/dark"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_MAP_STYLE_URL=$NEXT_PUBLIC_MAP_STYLE_URL \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
# Hosts that assign a port (Render, Cloud Run, Koyeb) set PORT; server.js reads it.
CMD ["node", "server.js"]
