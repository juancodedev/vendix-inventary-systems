FROM node:18-alpine

WORKDIR /app

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Copy required package.json for workspace resolution
COPY packages/billing-core/package.json ./packages/billing-core/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
# Copy service package.json
COPY services/auth-service/package.json ./services/auth-service/

RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Ensure we have all dependencies for the workspace
RUN pnpm install --frozen-lockfile

EXPOSE 3000

WORKDIR /app/services/auth-service
CMD ["pnpm", "start"]
