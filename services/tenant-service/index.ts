import { Hono } from 'hono';
import { getVendixContext } from '@vendix/utils';

const app = new Hono();

app.get('/', (c) => {
    const ctx = getVendixContext(c.req);
    return c.json({
        message: "Tenant Service",
        tenant_id: ctx.tenantId
    });
});

app.post('/setup', async (c) => {
    const { name, plan } = await c.req.json();
    // Logic to create a new tenant schema/database entry
    return c.json({ status: 'created', tenant_id: 'new-uuid' });
});

export default app;
