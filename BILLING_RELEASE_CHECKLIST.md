# Billing Release Checklist

Checklist operativo para publicar el sistema de suscripciones en staging o producción.

## 1. Configuración Stripe

- [ ] Crear producto `Vendix Basic` en Stripe.
- [ ] Crear producto `Vendix Pro` en Stripe.
- [ ] Crear al menos un `Price` activo para `BASIC`.
- [ ] Crear al menos un `Price` activo para `PRO`.
- [ ] Confirmar que ambos precios usan la moneda esperada (`USD` inicialmente).
- [ ] Confirmar periodicidad correcta (`monthly` o `yearly`).
- [ ] Guardar `price_id` reales para cada plan.

## 2. Variables de entorno

- [ ] `DATABASE_URL` apunta a la base correcta.
- [ ] `STRIPE_SECRET_KEY` configurada en el runtime server.
- [ ] `STRIPE_WEBHOOK_SECRET` configurada en el runtime server.
- [ ] `JWT_SECRET` configurada.
- [ ] URLs internas (`*_SERVICE_URL`) apuntan al entorno correcto.

## 3. Base de datos y Prisma

- [ ] Ejecutar `pnpm --filter @vendix/database prisma:generate`.
- [ ] Ejecutar migración o `prisma db push` según la estrategia del entorno.
- [ ] Verificar que existen tablas/modelos de billing: `Plan`, `Subscription`, `UsageMetric`, `Invoice`.
- [ ] Verificar que `Tenant.stripeCustomerId` existe en esquema aplicado.

## 4. Seed de planes

El sistema hace seed idempotente al consultar o asignar planes, pero antes del release conviene verificar datos persistidos.

- [ ] `FREE` existe con límites: `products=50`, `locations=1`, `users=1`.
- [ ] `BASIC` existe con límites: `products=500`, `locations=3`, `users=5`.
- [ ] `PRO` existe con límites ilimitados.
- [ ] `FREE.features.pos_offline = false`.
- [ ] `PRO.features.pos_offline = true`.
- [ ] `BASIC.stripePriceId` configurado.
- [ ] `PRO.stripePriceId` configurado.
- [ ] `displayOrder` correcto para orden de UI.

Consulta sugerida en PostgreSQL:

```sql
select code, name, price, currency, interval, "stripePriceId", features, limits, "isActive"
from "Plan"
order by "displayOrder" asc;
```

## 5. Webhook Stripe

- [ ] Endpoint creado en Stripe Dashboard: `/api/webhooks/stripe`.
- [ ] Eventos suscritos:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.updated`
  - [ ] `invoice.paid`
  - [ ] `invoice.payment_failed`
- [ ] El signing secret copiado coincide con el entorno desplegado.
- [ ] El endpoint responde desde internet sin proxy que altere body/signature.

## 6. Flujos críticos

- [ ] Registro crea tenant y plan `FREE` automáticamente.
- [ ] `GET /api/plans` devuelve `FREE`, `BASIC`, `PRO`.
- [ ] `GET /api/subscription` crea o devuelve suscripción actual del tenant.
- [ ] Upgrade a `BASIC` o `PRO` genera Checkout URL válida.
- [ ] Downgrade agenda `pendingPlanId` y `pendingChangeAtPeriodEnd`.
- [ ] `invoice.payment_failed` cambia suscripción a `PAST_DUE`.
- [ ] `customer.subscription.updated` sincroniza plan/periodo/estado.
- [ ] `invoice.paid` registra factura local.
- [ ] `cancel` marca `cancelAtPeriodEnd=true`.
- [ ] `resume` revierte `cancelAtPeriodEnd=false`.

## 7. Feature gating y límites

- [ ] Crear producto en tenant `FREE` falla al superar 50 productos.
- [ ] Crear sucursal en tenant `FREE` falla al superar 1 sucursal.
- [ ] Crear usuario en tenant `FREE` falla al superar 1 usuario.
- [ ] Acciones críticas fallan con `PAST_DUE`.
- [ ] POS offline solo habilitado para `PRO`.
- [ ] Analytics avanzados solo habilitados para `PRO`.

## 8. Smoke tests API

Script disponible:

```bash
chmod +x scripts/billing-smoke-test.sh
BASE_URL=https://tu-dominio.com TENANT_ID=tenant_demo scripts/billing-smoke-test.sh
```

Opciones útiles:

```bash
BASE_URL=https://tu-dominio.com \
TENANT_ID=tenant_demo \
PLAN_CODE=BASIC \
SUCCESS_URL=https://tu-dominio.com/subscription?status=success \
CANCEL_URL=https://tu-dominio.com/pricing?status=cancelled \
scripts/billing-smoke-test.sh
```

## 9. Smoke test webhook con Stripe CLI

1. Iniciar listener:

```bash
stripe listen --forward-to https://tu-dominio.com/api/webhooks/stripe
```

2. Disparar eventos de prueba:

```bash
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
```

3. Verificar en la base:

```sql
select id, "tenantId", status, "currentPeriodStart", "currentPeriodEnd", "cancelAtPeriodEnd", "externalId"
from "Subscription"
order by "updatedAt" desc
limit 10;

select id, "tenantId", amount, currency, status, "paidAt", "externalId"
from "Invoice"
order by "createdAt" desc
limit 10;
```

## 10. Go / No-Go

- [ ] Build de `apps/web` exitoso.
- [ ] Build de imágenes Docker exitoso.
- [ ] Stripe prices correctos y activos.
- [ ] Webhook firmado recibido exitosamente.
- [ ] Smoke tests API exitosos.
- [ ] Feature gating confirmado.
- [ ] Límites confirmados.
- [ ] Monitoreo/logs activos para errores `PAST_DUE`, `PLAN_NOT_CONFIGURED`, `INVALID_SIGNATURE`.
