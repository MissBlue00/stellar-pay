# Stage 1: Base setup
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Use direct npm install for stability instead of corepack
RUN npm install -g pnpm
# Install curl for healthchecks
RUN apk add --no-cache curl

# Stage 2: Builder
FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api build
# ADDED --legacy flag for pnpm v10 compatibility
RUN pnpm --filter api --prod deploy --legacy /pruned

# Stage 3: Production Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /pruned .

USER appuser

# Healthcheck to verify NestJS API is responsive
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

EXPOSE ${PORT}

CMD ["node", "dist/main.js"]