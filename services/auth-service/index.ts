import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { getVendixContext } from '@vendix/utils';
import { randomBytes, scryptSync } from 'node:crypto';
import { prisma, RoleType } from '@vendix/database';
import {
    BILLING_METRICS,
    BillingCoreError,
    assignFreePlanToTenant,
    assertTenantCanPerformCriticalAction,
    enforceLimitByValue,
    recordUsage,
} from '@vendix/billing-core';

const app = new Hono();

const hashPassword = (password: string) => {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
};

const serializeBillingError = (error: unknown) => {
    if (error instanceof BillingCoreError) {
        return {
            body: {
                error: error.message,
                code: error.code,
                details: error.details,
            },
            status: error.status,
        };
    }

    return {
        body: {
            error: 'No fue posible completar la operacion de autenticacion.',
            code: 'INTERNAL_ERROR',
            details: String(error),
        },
        status: 500,
    };
};

// Middleware for JWT (Mock configuration)
// app.use('/auth/*', jwt({ secret: 'secret-key' }));

app.post('/register', async (c) => {
    try {
        const payload = (await c.req.json()) as {
            tenantName?: string;
            email?: string;
            password?: string;
            role?: keyof typeof RoleType;
        };

        if (!payload.tenantName || !payload.email || !payload.password) {
            return c.json({ error: 'tenantName, email y password son obligatorios.' }, 400);
        }

        const password = hashPassword(payload.password);

        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: payload.tenantName,
                    plan: 'FREE',
                    isActive: true,
                },
            });

            const role = payload.role && payload.role in RoleType ? payload.role : 'ADMIN';
            const user = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    email: payload.email!,
                    password,
                    role,
                },
            });

            return { tenant, user };
        });

        await assignFreePlanToTenant(result.tenant.id);
        await recordUsage(result.tenant.id, BILLING_METRICS.USERS, 1);
        await recordUsage(result.tenant.id, BILLING_METRICS.LOCATIONS, 0);
        await recordUsage(result.tenant.id, BILLING_METRICS.PRODUCTS, 0);

        return c.json(
            {
                tenantId: result.tenant.id,
                userId: result.user.id,
                plan: 'FREE',
                status: 'created',
            },
            201,
        );
    } catch (error) {
        const serialized = serializeBillingError(error);
        return c.json(serialized.body, serialized.status as 500);
    }
});

app.post('/users', async (c) => {
    const ctx = getVendixContext(c.req);

    try {
        await assertTenantCanPerformCriticalAction(ctx.tenantId);

        const usersCount = await prisma.user.count({
            where: { tenantId: ctx.tenantId },
        });

        const limitCheck = await enforceLimitByValue(ctx.tenantId, BILLING_METRICS.USERS, usersCount, 1);
        if (!limitCheck.allowed) {
            throw new BillingCoreError('USAGE_LIMIT_REACHED', 'Superaste el limite de usuarios para tu plan.', 403, limitCheck);
        }

        const payload = (await c.req.json()) as {
            email?: string;
            password?: string;
            role?: keyof typeof RoleType;
        };

        if (!payload.email || !payload.password) {
            return c.json({ error: 'email y password son obligatorios.' }, 400);
        }

        const user = await prisma.user.create({
            data: {
                tenantId: ctx.tenantId,
                email: payload.email,
                password: hashPassword(payload.password),
                role: payload.role && payload.role in RoleType ? payload.role : 'SELLER',
            },
        });

        await recordUsage(ctx.tenantId, BILLING_METRICS.USERS, 1);

        return c.json({ id: user.id, email: user.email, role: user.role }, 201);
    } catch (error) {
        const serialized = serializeBillingError(error);
        return c.json(serialized.body, serialized.status as 500);
    }
});

app.post('/login', async (c) => {
    // Logic for user login
    return c.json({ token: 'mock-jwt-token-with-tenant-info' });
});

app.get('/me', (c) => {
    const ctx = getVendixContext(c.req);
    return c.json({
        user_id: ctx.userId,
        tenant_id: ctx.tenantId,
        roles: ctx.roles
    });
});

export default app;
