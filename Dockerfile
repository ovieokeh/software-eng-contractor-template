# syntax=docker/dockerfile:1
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG SITE_URL
ENV SITE_URL=$SITE_URL
ARG SITE_INDEXING=false
ENV SITE_INDEXING=$SITE_INDEXING
ARG OPEN_PANEL_CLIENT_ID
ENV OPEN_PANEL_CLIENT_ID=$OPEN_PANEL_CLIENT_ID
ARG REQUIRE_PRIVATE_CONFIG=false
ENV REQUIRE_PRIVATE_CONFIG=$REQUIRE_PRIVATE_CONFIG
ENV NEXT_TELEMETRY_DISABLED=1
# Optional private inputs are mounted only for this build step. Raw inputs
# are not copied into image layers or the final standalone application.
RUN --mount=type=secret,id=site_config --mount=type=secret,id=pricing_workbook \
    --mount=type=secret,id=pricing_workbook_base64 \
    --mount=type=secret,id=SITE_URL --mount=type=secret,id=SITE_INDEXING \
    --mount=type=secret,id=OPEN_PANEL_CLIENT_ID --mount=type=secret,id=REQUIRE_PRIVATE_CONFIG \
    node scripts/build-with-secrets.mjs

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
