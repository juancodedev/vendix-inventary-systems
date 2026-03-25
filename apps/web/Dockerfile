FROM node:18-alpine AS builder

WORKDIR /app

# Install compatibility libraries for Prisma
RUN apk add --no-cache libc6-compat openssl

# Enable corepack and use specific pnpm version
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

# Copy all source code
COPY . .

# Install dependencies for the entire workspace
RUN pnpm install --no-frozen-lockfile

# Generate Prisma client
RUN pnpm --filter @vendix/database prisma:generate

# Build the web application
RUN pnpm --filter web build

# Final production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Install compatibility libraries for Prisma and enable pnpm
RUN apk add --no-cache libc6-compat openssl && corepack enable && corepack prepare pnpm@10.32.1 --activate

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
