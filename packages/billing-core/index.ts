import Stripe from 'stripe';
import {
    BillingInterval,
    InvoiceStatus,
    Prisma,
    SubscriptionStatus,
    prisma,
} from '@vendix/database';

export const BILLING_METRICS = {
    PRODUCTS: 'products',
    USERS: 'users',
    LOCATIONS: 'locations',
} as const;

export type BillingMetric = (typeof BILLING_METRICS)[keyof typeof BILLING_METRICS];

export type BillingFeatureName =
    | 'pos'
    | 'pos_offline'
    | 'analytics_basic'
    | 'analytics_advanced'
    | 'multiuser'
    | 'priority_support';

export interface BillingPlanDTO {
    id: string;
    code: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    interval: keyof typeof BillingInterval;
    features: Record<string, boolean>;
    limits: Record<string, number | null>;
    stripePriceId?: string;
    isActive: boolean;
}

export interface SubscribeInput {
    tenantId: string;
    planCode: string;
    successUrl: string;
    cancelUrl: string;
    trialDays?: number;
}

export interface SubscribeResult {
    mode: 'free' | 'checkout';
    checkoutUrl?: string;
    sessionId?: string;
    subscriptionId?: string;
}

export interface UsageLimitResult {
    metric: string;
    limit: number | null;
    current: number;
    allowed: boolean;
}

export class BillingCoreError extends Error {
    code: string;
    status: number;
    details?: Record<string, unknown>;

    constructor(code: string, message: string, status = 400, details?: Record<string, unknown>) {
        super(message);
        this.name = 'BillingCoreError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

const toNumber = (value: Prisma.Decimal | number | string | null | undefined) => {
    if (value == null) {
        return 0;
    }

    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'string') {
        return Number(value);
    }

    return Number(value.toString());
};

const normalizeInterval = (interval: BillingInterval) => interval;

const defaultPlans: Array<{
    code: string;
    name: string;
    description: string;
    price: string;
    currency: string;
    interval: BillingInterval;
    displayOrder: number;
    features: Record<string, boolean>;
    limits: Record<string, number | null>;
}> = [
        {
            code: 'FREE',
            name: 'Free',
            description: 'Perfecto para comenzar',
            price: '0',
            currency: 'USD',
            interval: BillingInterval.MONTHLY,
            displayOrder: 1,
            features: {
                pos: false,
                pos_offline: false,
                analytics_basic: false,
                analytics_advanced: false,
                multiuser: false,
                priority_support: false,
            },
            limits: {
                products: 50,
                locations: 1,
                users: 1,
            },
        },
        {
            code: 'BASIC',
            name: 'Basic',
            description: 'Escala tus operaciones con POS',
            price: '29',
            currency: 'USD',
            interval: BillingInterval.MONTHLY,
            displayOrder: 2,
            features: {
                pos: true,
                pos_offline: false,
                analytics_basic: true,
                analytics_advanced: false,
                multiuser: false,
                priority_support: false,
            },
            limits: {
                products: 500,
                locations: 3,
                users: 5,
            },
        },
        {
            code: 'PRO',
            name: 'Pro',
            description: 'Todo ilimitado con analytics avanzados',
            price: '99',
            currency: 'USD',
            interval: BillingInterval.MONTHLY,
            displayOrder: 3,
            features: {
                pos: true,
                pos_offline: true,
                analytics_basic: true,
                analytics_advanced: true,
                multiuser: true,
                priority_support: true,
            },
            limits: {
                products: null,
                locations: null,
                users: null,
            },
        },
    ];

const getStripe = () => {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
        throw new BillingCoreError('STRIPE_NOT_CONFIGURED', 'No se encontro STRIPE_SECRET_KEY.', 500);
    }

    return new Stripe(secret);
};

const parseFeatures = (value: Prisma.JsonValue): Record<string, boolean> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    return Object.entries(value as Record<string, unknown>).reduce<Record<string, boolean>>((acc, [key, flag]) => {
        acc[key] = Boolean(flag);
        return acc;
    }, {});
};

const parseLimits = (value: Prisma.JsonValue): Record<string, number | null> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    return Object.entries(value as Record<string, unknown>).reduce<Record<string, number | null>>((acc, [key, limit]) => {
        if (limit === null) {
            acc[key] = null;
            return acc;
        }

        const numeric = Number(limit);
        acc[key] = Number.isFinite(numeric) ? numeric : null;
        return acc;
    }, {});
};

const serializePlan = (plan: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    price: Prisma.Decimal;
    currency: string;
    interval: BillingInterval;
    features: Prisma.JsonValue;
    limits: Prisma.JsonValue;
    stripePriceId: string | null;
    isActive: boolean;
}): BillingPlanDTO => ({
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: plan.description ?? undefined,
    price: toNumber(plan.price),
    currency: plan.currency,
    interval: normalizeInterval(plan.interval),
    features: parseFeatures(plan.features),
    limits: parseLimits(plan.limits),
    stripePriceId: plan.stripePriceId ?? undefined,
    isActive: plan.isActive,
});

const mapSubscriptionStatus = (status: string): SubscriptionStatus => {
    const normalized = status.toUpperCase();

    switch (normalized) {
        case 'ACTIVE':
            return SubscriptionStatus.ACTIVE;
        case 'PAST_DUE':
            return SubscriptionStatus.PAST_DUE;
        case 'CANCELED':
            return SubscriptionStatus.CANCELED;
        case 'INCOMPLETE':
            return SubscriptionStatus.INCOMPLETE;
        case 'INCOMPLETE_EXPIRED':
            return SubscriptionStatus.INCOMPLETE_EXPIRED;
        case 'TRIALING':
            return SubscriptionStatus.TRIALING;
        default:
            return SubscriptionStatus.INCOMPLETE;
    }
};

const getCurrentSubscriptionRow = async (tenantId: string) => {
    return prisma.subscription.findFirst({
        where: {
            tenantId,
            status: {
                in: [
                    SubscriptionStatus.ACTIVE,
                    SubscriptionStatus.PAST_DUE,
                    SubscriptionStatus.TRIALING,
                    SubscriptionStatus.INCOMPLETE,
                ],
            },
        },
        include: {
            plan: true,
            pendingPlan: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
};

const ensureStripeCustomer = async (tenantId: string) => {
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
    });

    if (!tenant) {
        throw new BillingCoreError('TENANT_NOT_FOUND', 'Tenant no encontrado.', 404);
    }

    if (tenant.stripeCustomerId) {
        return tenant.stripeCustomerId;
    }

    const stripe = getStripe();
    const customer = await stripe.customers.create({
        name: tenant.name,
        metadata: {
            tenantId,
        },
    });

    await prisma.tenant.update({
        where: { id: tenantId },
        data: {
            stripeCustomerId: customer.id,
        },
    });

    return customer.id;
};

export const seedDefaultPlans = async () => {
    for (const plan of defaultPlans) {
        await prisma.plan.upsert({
            where: { code: plan.code },
            update: {
                name: plan.name,
                description: plan.description,
                price: new Prisma.Decimal(plan.price),
                currency: plan.currency,
                interval: plan.interval,
                displayOrder: plan.displayOrder,
                features: plan.features,
                limits: plan.limits,
                isActive: true,
            },
            create: {
                code: plan.code,
                name: plan.name,
                description: plan.description,
                price: new Prisma.Decimal(plan.price),
                currency: plan.currency,
                interval: plan.interval,
                displayOrder: plan.displayOrder,
                features: plan.features,
                limits: plan.limits,
                isActive: true,
            },
        });
    }
};

export const getPlans = async () => {
    await seedDefaultPlans();

    const plans = await prisma.plan.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return plans.map(serializePlan);
};

export const assignFreePlanToTenant = async (tenantId: string) => {
    await seedDefaultPlans();

    const existing = await getCurrentSubscriptionRow(tenantId);
    if (existing) {
        return existing;
    }

    const freePlan = await prisma.plan.findUnique({ where: { code: 'FREE' } });
    if (!freePlan) {
        throw new BillingCoreError('PLAN_NOT_FOUND', 'No existe plan FREE.', 500);
    }

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const subscription = await prisma.subscription.create({
        data: {
            tenantId,
            planId: freePlan.id,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: now,
            currentPeriodEnd: nextMonth,
            cancelAtPeriodEnd: false,
            pendingChangeAtPeriodEnd: false,
        },
        include: {
            plan: true,
            pendingPlan: true,
        },
    });

    await prisma.tenant.update({
        where: { id: tenantId },
        data: { plan: freePlan.code },
    });

    return subscription;
};

export const getCurrentSubscription = async (tenantId: string) => {
    const subscription = (await getCurrentSubscriptionRow(tenantId)) ?? (await assignFreePlanToTenant(tenantId));

    return {
        id: subscription.id,
        tenantId: subscription.tenantId,
        plan: serializePlan(subscription.plan),
        pendingPlan: subscription.pendingPlan ? serializePlan(subscription.pendingPlan) : undefined,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        pendingChangeAtPeriodEnd: subscription.pendingChangeAtPeriodEnd,
        externalId: subscription.externalId ?? undefined,
    };
};

export const hasFeature = async (tenantId: string, featureName: BillingFeatureName) => {
    const current = await getCurrentSubscription(tenantId);
    const features = current.plan.features;
    return Boolean(features[featureName]);
};

export const getUsage = async (tenantId: string, metric: BillingMetric | string) => {
    const row = await prisma.usageMetric.findUnique({
        where: {
            tenantId_metric: {
                tenantId,
                metric,
            },
        },
    });

    return row?.value ?? 0;
};

export const recordUsage = async (tenantId: string, metric: BillingMetric | string, delta = 1) => {
    const updated = await prisma.usageMetric.upsert({
        where: {
            tenantId_metric: {
                tenantId,
                metric,
            },
        },
        update: {
            value: {
                increment: delta,
            },
        },
        create: {
            tenantId,
            metric,
            value: Math.max(delta, 0),
        },
    });

    return updated.value;
};

export const enforceLimit = async (tenantId: string, metric: BillingMetric | string, increment = 1): Promise<UsageLimitResult> => {
    const current = await getCurrentSubscription(tenantId);
    const limits = current.plan.limits;
    const limit = metric in limits ? limits[metric] ?? null : null;
    const currentUsage = await getUsage(tenantId, metric);

    if (limit == null) {
        return {
            metric,
            limit: null,
            current: currentUsage,
            allowed: true,
        };
    }

    const allowed = currentUsage + increment <= limit;

    return {
        metric,
        limit,
        current: currentUsage,
        allowed,
    };
};

export const enforceLimitByValue = async (
    tenantId: string,
    metric: BillingMetric | string,
    currentValue: number,
    increment = 1,
): Promise<UsageLimitResult> => {
    const current = await getCurrentSubscription(tenantId);
    const limits = current.plan.limits;
    const limit = metric in limits ? limits[metric] ?? null : null;

    if (limit == null) {
        return {
            metric,
            limit: null,
            current: currentValue,
            allowed: true,
        };
    }

    return {
        metric,
        limit,
        current: currentValue,
        allowed: currentValue + increment <= limit,
    };
};

export const assertTenantCanPerformCriticalAction = async (tenantId: string) => {
    const subscription = await getCurrentSubscription(tenantId);

    if (subscription.status === SubscriptionStatus.CANCELED) {
        throw new BillingCoreError(
            'SUBSCRIPTION_CANCELED',
            'La suscripcion fue cancelada. Debes reactivar un plan para continuar.',
            403,
        );
    }

    if (subscription.status === SubscriptionStatus.PAST_DUE) {
        throw new BillingCoreError(
            'SUBSCRIPTION_PAST_DUE',
            'El pago esta vencido. Actualiza tu metodo de pago para continuar.',
            402,
        );
    }

    if (subscription.status === SubscriptionStatus.INCOMPLETE || subscription.status === SubscriptionStatus.INCOMPLETE_EXPIRED) {
        throw new BillingCoreError('SUBSCRIPTION_INCOMPLETE', 'La suscripcion no esta activa.', 402);
    }

    return subscription;
};

export const subscribeTenant = async (input: SubscribeInput): Promise<SubscribeResult> => {
    await seedDefaultPlans();

    const plan = await prisma.plan.findUnique({
        where: { code: input.planCode.toUpperCase() },
    });

    if (!plan || !plan.isActive) {
        throw new BillingCoreError('PLAN_NOT_FOUND', 'El plan solicitado no existe.', 404);
    }

    const currentSubscription = await getCurrentSubscriptionRow(input.tenantId);

    if (plan.code === 'FREE') {
        if (currentSubscription) {
            await prisma.subscription.update({
                where: { id: currentSubscription.id },
                data: {
                    pendingPlanId: plan.id,
                    pendingChangeAtPeriodEnd: true,
                },
            });

            return {
                mode: 'free',
                subscriptionId: currentSubscription.id,
            };
        }

        await assignFreePlanToTenant(input.tenantId);
        return {
            mode: 'free',
        };
    }

    if (!plan.stripePriceId) {
        throw new BillingCoreError(
            'PLAN_NOT_CONFIGURED',
            `El plan ${plan.code} no tiene stripePriceId configurado.`,
            500,
        );
    }

    if (currentSubscription && currentSubscription.externalId) {
        const currentPrice = toNumber(currentSubscription.plan.price);
        const nextPrice = toNumber(plan.price);

        if (nextPrice < currentPrice) {
            await prisma.subscription.update({
                where: { id: currentSubscription.id },
                data: {
                    pendingPlanId: plan.id,
                    pendingChangeAtPeriodEnd: true,
                },
            });

            return {
                mode: 'free',
                subscriptionId: currentSubscription.id,
            };
        }

        const stripe = getStripe();
        const stripeSubscription = await stripe.subscriptions.retrieve(currentSubscription.externalId);
        const itemId = stripeSubscription.items.data[0]?.id;
        if (!itemId) {
            throw new BillingCoreError('STRIPE_SUBSCRIPTION_INVALID', 'No fue posible actualizar la suscripcion actual.', 500);
        }

        await stripe.subscriptions.update(currentSubscription.externalId, {
            items: [{
                id: itemId,
                price: plan.stripePriceId,
            }],
            proration_behavior: 'always_invoice',
            cancel_at_period_end: false,
        });

        await prisma.subscription.update({
            where: { id: currentSubscription.id },
            data: {
                planId: plan.id,
                pendingPlanId: null,
                pendingChangeAtPeriodEnd: false,
                cancelAtPeriodEnd: false,
            },
        });

        await prisma.tenant.update({
            where: { id: input.tenantId },
            data: { plan: plan.code },
        });

        return {
            mode: 'checkout',
            subscriptionId: currentSubscription.id,
        };
    }

    const customerId = await ensureStripeCustomer(input.tenantId);
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{
            price: plan.stripePriceId,
            quantity: 1,
        }],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        subscription_data: {
            trial_period_days: input.trialDays,
            metadata: {
                tenantId: input.tenantId,
                planCode: plan.code,
            },
        },
        metadata: {
            tenantId: input.tenantId,
            planCode: plan.code,
        },
        allow_promotion_codes: true,
    });

    return {
        mode: 'checkout',
        checkoutUrl: session.url ?? undefined,
        sessionId: session.id,
    };
};

export const cancelSubscription = async (tenantId: string) => {
    const row = await getCurrentSubscriptionRow(tenantId);

    if (!row) {
        throw new BillingCoreError('SUBSCRIPTION_NOT_FOUND', 'No hay suscripcion activa para cancelar.', 404);
    }

    if (row.externalId) {
        const stripe = getStripe();
        await stripe.subscriptions.update(row.externalId, {
            cancel_at_period_end: true,
        });
    }

    const updated = await prisma.subscription.update({
        where: { id: row.id },
        data: { cancelAtPeriodEnd: true },
        include: { plan: true, pendingPlan: true },
    });

    return {
        id: updated.id,
        cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
        currentPeriodEnd: updated.currentPeriodEnd.toISOString(),
    };
};

export const resumeSubscription = async (tenantId: string) => {
    const row = await getCurrentSubscriptionRow(tenantId);

    if (!row) {
        throw new BillingCoreError('SUBSCRIPTION_NOT_FOUND', 'No hay suscripcion para reanudar.', 404);
    }

    if (row.externalId) {
        const stripe = getStripe();
        await stripe.subscriptions.update(row.externalId, {
            cancel_at_period_end: false,
        });
    }

    const updated = await prisma.subscription.update({
        where: { id: row.id },
        data: { cancelAtPeriodEnd: false },
    });

    return {
        id: updated.id,
        cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
    };
};

const upsertSubscriptionFromStripe = async (stripeSubscription: Stripe.Subscription, tenantIdFromEvent?: string) => {
    const tenantId = tenantIdFromEvent
        ?? stripeSubscription.metadata?.tenantId
        ?? undefined;

    if (!tenantId) {
        throw new BillingCoreError('MISSING_TENANT', 'No se encontro tenantId en metadata de Stripe.', 400);
    }

    const stripePriceId = stripeSubscription.items.data[0]?.price?.id;
    if (!stripePriceId) {
        throw new BillingCoreError('MISSING_PRICE', 'No se encontro stripe price en la suscripcion.', 400);
    }

    const plan = await prisma.plan.findFirst({
        where: {
            stripePriceId,
            isActive: true,
        },
    });

    if (!plan) {
        throw new BillingCoreError('PLAN_NOT_FOUND', `No existe plan para stripePriceId=${stripePriceId}`, 404);
    }

    const currentStart = new Date(stripeSubscription.current_period_start * 1000);
    const currentEnd = new Date(stripeSubscription.current_period_end * 1000);

    const subscription = await prisma.subscription.upsert({
        where: {
            externalId: stripeSubscription.id,
        },
        update: {
            tenantId,
            planId: plan.id,
            status: mapSubscriptionStatus(stripeSubscription.status),
            currentPeriodStart: currentStart,
            currentPeriodEnd: currentEnd,
            cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
        },
        create: {
            tenantId,
            planId: plan.id,
            status: mapSubscriptionStatus(stripeSubscription.status),
            currentPeriodStart: currentStart,
            currentPeriodEnd: currentEnd,
            cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
            externalId: stripeSubscription.id,
        },
    });

    await prisma.tenant.update({
        where: { id: tenantId },
        data: {
            plan: plan.code,
            stripeCustomerId: typeof stripeSubscription.customer === 'string' ? stripeSubscription.customer : undefined,
        },
    });

    return subscription;
};

const upsertInvoiceFromStripe = async (invoice: Stripe.Invoice) => {
    const tenantId = invoice.metadata?.tenantId;
    if (!tenantId) {
        return;
    }

    const subscriptionExternalId = typeof invoice.subscription === 'string' ? invoice.subscription : undefined;
    const subscription = subscriptionExternalId
        ? await prisma.subscription.findFirst({ where: { externalId: subscriptionExternalId } })
        : null;

    const status = (() => {
        switch (invoice.status) {
            case 'draft':
                return InvoiceStatus.DRAFT;
            case 'open':
                return InvoiceStatus.OPEN;
            case 'paid':
                return InvoiceStatus.PAID;
            case 'void':
                return InvoiceStatus.VOID;
            default:
                return InvoiceStatus.UNCOLLECTIBLE;
        }
    })();

    await prisma.invoice.upsert({
        where: {
            externalId: invoice.id,
        },
        update: {
            tenantId,
            subscriptionId: subscription?.id,
            amount: new Prisma.Decimal((invoice.amount_due ?? 0) / 100),
            currency: (invoice.currency ?? 'usd').toUpperCase(),
            status,
            dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
            paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
        },
        create: {
            tenantId,
            subscriptionId: subscription?.id,
            amount: new Prisma.Decimal((invoice.amount_due ?? 0) / 100),
            currency: (invoice.currency ?? 'usd').toUpperCase(),
            status,
            dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
            paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
            externalId: invoice.id,
        },
    });
};

export const processStripeWebhook = async (rawBody: string | Buffer, signature: string | null) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        throw new BillingCoreError('STRIPE_WEBHOOK_NOT_CONFIGURED', 'No se encontro STRIPE_WEBHOOK_SECRET.', 500);
    }

    if (!signature) {
        throw new BillingCoreError('INVALID_SIGNATURE', 'Firma de webhook ausente.', 400);
    }

    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription && typeof session.subscription === 'string') {
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            await upsertSubscriptionFromStripe(subscription, session.metadata?.tenantId);
        }
    }

    if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;
        await upsertSubscriptionFromStripe(subscription);
    }

    if (event.type === 'invoice.paid') {
        const invoice = event.data.object as Stripe.Invoice;
        await upsertInvoiceFromStripe(invoice);

        if (typeof invoice.subscription === 'string') {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            const localSubscription = await upsertSubscriptionFromStripe(subscription, invoice.metadata?.tenantId);

            const withPendingPlan = await prisma.subscription.findUnique({
                where: { id: localSubscription.id },
                include: { pendingPlan: true },
            });

            if (withPendingPlan?.pendingChangeAtPeriodEnd && withPendingPlan.pendingPlanId) {
                await prisma.subscription.update({
                    where: { id: withPendingPlan.id },
                    data: {
                        planId: withPendingPlan.pendingPlanId,
                        pendingPlanId: null,
                        pendingChangeAtPeriodEnd: false,
                    },
                });

                if (withPendingPlan.pendingPlan) {
                    await prisma.tenant.update({
                        where: { id: withPendingPlan.tenantId },
                        data: { plan: withPendingPlan.pendingPlan.code },
                    });
                }
            }
        }
    }

    if (event.type === 'invoice.payment_failed') {
        const invoice = event.data.object as Stripe.Invoice;
        await upsertInvoiceFromStripe(invoice);

        const subscriptionExternalId = typeof invoice.subscription === 'string' ? invoice.subscription : undefined;
        if (subscriptionExternalId) {
            await prisma.subscription.updateMany({
                where: { externalId: subscriptionExternalId },
                data: { status: SubscriptionStatus.PAST_DUE },
            });
        }
    }

    return { received: true, eventType: event.type };
};

export const listTenantInvoices = async (tenantId: string, take = 20) => {
    const invoices = await prisma.invoice.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take,
    });

    return invoices.map((invoice) => ({
        id: invoice.id,
        amount: toNumber(invoice.amount),
        currency: invoice.currency,
        status: invoice.status,
        dueDate: invoice.dueDate?.toISOString(),
        paidAt: invoice.paidAt?.toISOString(),
        createdAt: invoice.createdAt.toISOString(),
    }));
};

export const listTenantUsage = async (tenantId: string) => {
    const current = await getCurrentSubscription(tenantId);
    const usageRows = await prisma.usageMetric.findMany({
        where: { tenantId },
    });

    const usageByMetric = new Map(usageRows.map((row) => [row.metric, row.value]));
    const limits = current.plan.limits;

    return Object.keys(limits).map((metric) => ({
        metric,
        used: usageByMetric.get(metric) ?? 0,
        limit: limits[metric] ?? null,
    }));
};

export const runBillingGuards = async (input: {
    tenantId: string;
    requireCriticalAccess?: boolean;
    requiredFeatures?: BillingFeatureName[];
    usageChecks?: Array<{ metric: BillingMetric | string; increment?: number }>;
}) => {
    if (input.requireCriticalAccess) {
        await assertTenantCanPerformCriticalAction(input.tenantId);
    }

    if (input.requiredFeatures?.length) {
        for (const feature of input.requiredFeatures) {
            const enabled = await hasFeature(input.tenantId, feature);
            if (!enabled) {
                throw new BillingCoreError(
                    'FEATURE_NOT_AVAILABLE',
                    `La funcionalidad ${feature} no esta disponible en tu plan.`,
                    403,
                    { feature },
                );
            }
        }
    }

    if (input.usageChecks?.length) {
        for (const check of input.usageChecks) {
            const result = await enforceLimit(input.tenantId, check.metric, check.increment ?? 1);
            if (!result.allowed) {
                throw new BillingCoreError(
                    'USAGE_LIMIT_REACHED',
                    `Se alcanzo el limite de ${check.metric} para tu plan actual.`,
                    403,
                    { ...result },
                );
            }
        }
    }
};
