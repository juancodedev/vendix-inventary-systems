FROM node:18-alpine AS builder

WORKDIR /app

# Enable corepack and use specific pnpm version
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

# Copy all source code
COPY . .

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Build the app
RUN pnpm run build --filter=pos

# Production environment
FROM nginx:stable-alpine
COPY --from=builder /app/apps/pos/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
