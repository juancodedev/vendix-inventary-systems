FROM node:18-alpine

WORKDIR /app

# Install compatibility libraries for Prisma
RUN apk add --no-cache libc6-compat openssl

# Enable corepack and use specific pnpm version
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

# Copy all source code
COPY . .

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Generate Prisma client
RUN pnpm --filter @vendix/database prisma:generate

EXPOSE 3000

WORKDIR /app/services/auth-service
CMD ["pnpm", "start"]
