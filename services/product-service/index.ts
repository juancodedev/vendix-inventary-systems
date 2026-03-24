import { Hono } from 'hono';
import { getVendixContext, withTenantScope } from '@vendix/utils';

const app = new Hono();

app.get('/products', (c) => {
    const ctx = getVendixContext(c.req);
    // Concept: db.products.findMany(withTenantScope({}, ctx.tenantId))
    return c.json({
        tenant_id: ctx.tenantId,
        products: [
            { id: '1', name: 'Sample Product', sku: 'SAMP-001', price: 100 }
        ]
    });
});

app.post('/products', async (c) => {
    const ctx = getVendixContext(c.req);
    const data = await c.req.json();
    return c.json({ ...data, tenant_id: ctx.tenantId, id: '2' });
});

export default app;
