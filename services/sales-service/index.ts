import { Hono } from 'hono';
import { getVendixContext } from '@vendix/utils';

const app = new Hono();

app.get('/sales', (c) => {
    const ctx = getVendixContext(c.req);
    return c.json({ tenant_id: ctx.tenantId, sales: [] });
});

app.get('/sales/:id', (c) => {
    const id = c.req.param('id');
    return c.json({ id, total: 100, status: 'completed' });
});

export default app;
