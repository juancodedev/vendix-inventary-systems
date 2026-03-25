FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Copy required package.json for workspace resolution
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
# Copy app package.json
COPY apps/pos/package.json ./apps/pos/

RUN pnpm install --frozen-lockfile

# Build the app
COPY . .
RUN pnpm run build --filter=pos

# Production environment
FROM nginx:stable-alpine
COPY --from=builder /app/apps/pos/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
