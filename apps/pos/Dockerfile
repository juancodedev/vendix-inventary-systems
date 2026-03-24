FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json ./
COPY apps/pos/package.json ./apps/pos/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

# Install dependencies
RUN npm install

# Build the app
COPY . .
RUN npm run build --workspace=pos

# Production environment
FROM nginx:stable-alpine
COPY --from=builder /app/apps/pos/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
