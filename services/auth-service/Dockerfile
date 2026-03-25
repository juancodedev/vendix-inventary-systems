FROM node:18-alpine

WORKDIR /app

# Enable corepack and use specific pnpm version
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

# Copy all source code
COPY . .

# Install dependencies
RUN pnpm install --no-frozen-lockfile

EXPOSE 3000

WORKDIR /app/services/auth-service
CMD ["pnpm", "start"]
