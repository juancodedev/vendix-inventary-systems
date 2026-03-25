import { Hono } from 'hono';
import { getVendixContext } from '@vendix/utils';
import { prisma } from '@vendix/database';
import { assignFreePlanToTenant } from '@vendix/billing-core';

const app = new Hono();

app.get('/', (c) => {
    const ctx = getVendixContext(c.req);
    return c.json({
        message: "Tenant Service",
        tenant_id: ctx.tenantId
    });
});

app.post('/setup', async (c) => {
    const { name } = (await c.req.json()) as { name?: string };
    if (!name) {
        return c.json({ error: 'name es obligatorio.' }, 400);
    }

    const tenant = await prisma.tenant.create({
        data: {
            name,
            plan: 'FREE',
        },
    });

    await assignFreePlanToTenant(tenant.id);

    return c.json({ status: 'created', tenant_id: tenant.id, plan: 'FREE' }, 201);
});

export default app;
