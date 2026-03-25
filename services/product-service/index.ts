import { Hono } from 'hono';
import { getVendixContext, withTenantScope } from '@vendix/utils';
import {
    BILLING_METRICS,
    BillingCoreError,
    assertTenantCanPerformCriticalAction,
    enforceLimitByValue,
    recordUsage,
} from '@vendix/billing-core';
import { prisma } from '@vendix/database';

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
            error: 'No fue posible completar la operacion de productos.',
            code: 'INTERNAL_ERROR',
            details: String(error),
        },
        status: 500,
    };
};

app.get('/products', async (c) => {
    const ctx = getVendixContext(c.req);

    const products = await prisma.product.findMany(
        withTenantScope(
            {
                where: {
                    deletedAt: null,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            },
            ctx.tenantId,
        ),
    );

    return c.json({
        tenant_id: ctx.tenantId,
        products,
    });
});

app.post('/products', async (c) => {
    const ctx = getVendixContext(c.req);

    try {
        await assertTenantCanPerformCriticalAction(ctx.tenantId);

        const count = await prisma.product.count({
            where: {
                tenantId: ctx.tenantId,
                deletedAt: null,
            },
        });

        const limitCheck = await enforceLimitByValue(ctx.tenantId, BILLING_METRICS.PRODUCTS, count, 1);
        if (!limitCheck.allowed) {
            throw new BillingCoreError(
                'USAGE_LIMIT_REACHED',
                'Superaste el limite de productos para tu plan.',
                403,
                limitCheck,
            );
        }

        const data = (await c.req.json()) as {
            name?: string;
            sku?: string;
            price?: number;
            category?: string;
            barcode?: string;
            qrCode?: string;
        };

        if (!data.name || !data.sku || data.price == null) {
            return c.json({ error: 'name, sku y price son obligatorios.' }, 400);
        }

        const product = await prisma.product.create({
            data: {
                tenantId: ctx.tenantId,
                name: data.name,
                sku: data.sku,
                price: data.price,
                category: data.category,
                barcode: data.barcode,
                qrCode: data.qrCode,
            },
        });

        await recordUsage(ctx.tenantId, BILLING_METRICS.PRODUCTS, 1);

        return c.json({ ...product, tenant_id: ctx.tenantId }, 201);
    } catch (error) {
        const serialized = serializeBillingError(error);
        return c.json(serialized.body, serialized.status as 500);
    }
});

export default app;
