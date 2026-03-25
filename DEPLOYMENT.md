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
1. **Lint & Typecheck**: `npm run lint` && `pnpm -C apps/web build`
2. **Build Packages**: `turbo build`
3. **Database Migration**: `npx prisma migrate deploy`
4. **Deploy**: Push to Vercel/Railway.

## 💳 Billing / Stripe (Production)

The billing module uses Stripe Checkout + Webhooks and requires these steps in every environment.

Detailed release checklist:
- See `BILLING_RELEASE_CHECKLIST.md`

1. Create Stripe Prices for `BASIC` and `PRO` and persist each `price_id` into `Plan.stripePriceId`.
2. Configure webhook endpoint in Stripe Dashboard to:
`https://<your-domain>/api/webhooks/stripe`
3. Subscribe webhook events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `invoice.paid`
- `invoice.payment_failed`
4. Store the signing secret from Stripe (`whsec_...`) in `STRIPE_WEBHOOK_SECRET`.
5. Ensure app server runtime for webhook route is Node.js (not Edge) to validate signatures reliably.

Recommended pre-deploy checks:
- Seed plans (`FREE`, `BASIC`, `PRO`) and verify `features` + `limits` JSON.
- Validate downgrade scheduling (`pendingPlanId`, `pendingChangeAtPeriodEnd`).
- Validate `past_due` flow blocks critical actions in services.

## 🔑 Environment Variables (Essential)
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: Secret for auth token signing.
- `NEXT_PUBLIC_API_GATEWAY_URL`: URL of the API Gateway.
- `*_SERVICE_URL`: URLs for internal service communication.
- `STRIPE_SECRET_KEY`: Stripe server secret key.
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret.
