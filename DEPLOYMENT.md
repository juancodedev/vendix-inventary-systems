# Vendix Deployment Strategy

To deploy this multitenant monorepo effectively, we follow a split-infrastructure strategy:

## 🌐 Frontend (Next.js)
**Platform**: Vercel
**Config**:
- Root Directory: `apps/web`
- Install Command: `npm install`
- Build Command: `npm run build`
- Framework Preset: `Next.js`

## ⚙️ Microservices (Hono)
**Platform**: Railway / Render / AWS App Runner
**Strategy**: Individual containers for each service.

1. **Dockerization**:
```dockerfile
# Example for apps/auth-service
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 🗄️ Database (PostgreSQL)
**Platform**: Supabase / Neon
**Strategy**: 
- Shared Database with Schema Isolation (future) or RLS.
- Run migrations: `npx prisma migrate deploy` from `packages/database`.

## 🔄 CI/CD
**Platform**: GitHub Actions

**Pipeline Steps**:
1. **Lint & Typecheck**: `npm run lint` && `npm run typecheck`
2. **Build Packages**: `turbo build`
3. **Database Migration**: `npx prisma migrate deploy`
4. **Deploy**: Push to Vercel/Railway.

## 🔑 Environment Variables (Essential)
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: Secret for auth token signing.
- `NEXT_PUBLIC_API_GATEWAY_URL`: URL of the API Gateway.
- `*_SERVICE_URL`: URLs for internal service communication.
