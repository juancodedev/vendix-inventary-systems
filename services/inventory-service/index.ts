import { Hono } from 'hono';
import { getVendixContext } from '@vendix/utils';

const app = new Hono();

app.get('/stock/:productId', (c) => {
    const ctx = getVendixContext(c.req);
    const productId = c.req.param('productId');
    const locationId = c.req.query('locationId') || ctx.locationId;

    return c.json({
        tenant_id: ctx.tenantId,
        product_id: productId,
        location_id: locationId,
        quantity: 50
    });
});

app.post('/movements', async (c) => {
    const ctx = getVendixContext(c.req);
    const { product_id, from_location, to_location, quantity } = await c.req.json();
    // Logic to update atomic stock levels
    return c.json({ status: 'movement-registered' });
});

export default app;
