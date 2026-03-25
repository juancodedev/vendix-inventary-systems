import { Hono } from 'hono';
import { getVendixContext } from '@vendix/utils';
import { prisma } from '@vendix/database';
import {
    BILLING_METRICS,
    BillingCoreError,
    assertTenantCanPerformCriticalAction,
    enforceLimitByValue,
    recordUsage,
} from '@vendix/billing-core';

const app = new Hono();

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
            error: 'No fue posible completar la operacion de sucursales.',
            code: 'INTERNAL_ERROR',
            details: String(error),
        },
        status: 500,
    };
};

app.get('/locations', async (c) => {
    const ctx = getVendixContext(c.req);
    const locations = await prisma.location.findMany({
        where: {
            tenantId: ctx.tenantId,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return c.json(locations);
});

app.post('/locations', async (c) => {
    const ctx = getVendixContext(c.req);

    try {
        await assertTenantCanPerformCriticalAction(ctx.tenantId);

        const count = await prisma.location.count({
            where: {
                tenantId: ctx.tenantId,
            },
        });

        const limitCheck = await enforceLimitByValue(ctx.tenantId, BILLING_METRICS.LOCATIONS, count, 1);
        if (!limitCheck.allowed) {
            throw new BillingCoreError(
                'USAGE_LIMIT_REACHED',
                'Superaste el limite de sucursales para tu plan.',
                403,
                limitCheck,
            );
        }

        const data = (await c.req.json()) as {
            name?: string;
            type?: 'STORE' | 'WAREHOUSE' | 'VEHICLE' | 'OTHER';
        };

        if (!data.name || !data.type) {
            return c.json({ error: 'name y type son obligatorios.' }, 400);
        }

        const location = await prisma.location.create({
            data: {
                tenantId: ctx.tenantId,
                name: data.name,
                type: data.type,
            },
        });

        await recordUsage(ctx.tenantId, BILLING_METRICS.LOCATIONS, 1);

        return c.json(location, 201);
    } catch (error) {
        const serialized = serializeBillingError(error);
        return c.json(serialized.body, serialized.status as 500);
    }
});

export default app;
