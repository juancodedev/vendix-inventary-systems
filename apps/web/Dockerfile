FROM node:18-alpine AS builder

WORKDIR /app

# Enable corepack and use specific pnpm version
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

# Copy all source code first to ensure pnpm can see the full workspace
COPY . .

# Install dependencies for the entire workspace
RUN pnpm install --no-frozen-lockfile

# Build the web application
RUN pnpm run build --filter=web

# Final production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

USER nextjs

EXPOSE 3000

ENV PORT 3000

WORKDIR /app/apps/web
CMD ["pnpm", "start"]
