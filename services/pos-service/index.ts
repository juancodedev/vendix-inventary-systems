import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
    createPosSale,
    searchPosProducts,
    syncOfflineSales,
    validatePosStock,
    type PosSaleRequest,
    type PosStockValidationRequest,
    type PosSyncRequest,
} from '@vendix/pos-core';
import { getVendixContext } from '@vendix/utils';

const app = new Hono();

app.use('*', cors());

const errorResponse = (message: string, details?: unknown) => ({
    error: message,
    details,
});

app.get('/health', (c) => {
    return c.json({ ok: true, service: 'pos-service' });
});

app.get('/pos/products', async (c) => {
    const ctx = getVendixContext(c.req);

    try {
        const response = await searchPosProducts(ctx, {
            query: c.req.query('query')?.trim(),
            locationId: c.req.query('locationId')?.trim(),
            limit: Number.parseInt(c.req.query('limit') ?? '', 10) || undefined,
        });

        return c.json(response);
    } catch (error) {
        return c.json(errorResponse('No fue posible cargar productos del POS.', String(error)), 400);
    }
});

app.post('/pos/validate-stock', async (c) => {
    const ctx = getVendixContext(c.req);

    try {
        const payload = (await c.req.json()) as PosStockValidationRequest;
        const response = await validatePosStock(ctx, payload);

        return c.json(response);
    } catch (error) {
        return c.json(errorResponse('No fue posible validar stock.', String(error)), 400);
    }
});

app.post('/pos/sale', async (c) => {
    const ctx = getVendixContext(c.req);

    try {
        const payload = (await c.req.json()) as PosSaleRequest;
        const response = await createPosSale(ctx, payload);

        return c.json(response, response.duplicate ? 200 : 201);
    } catch (error) {
        return c.json(errorResponse('No fue posible registrar la venta.', String(error)), 400);
    }
});

app.post('/pos/sync', async (c) => {
    const ctx = getVendixContext(c.req);

    try {
        const payload = (await c.req.json()) as PosSyncRequest;
        const response = await syncOfflineSales(ctx, payload);

        return c.json(response, response.ok ? 200 : 207);
    } catch (error) {
        return c.json(errorResponse('No fue posible sincronizar ventas offline.', String(error)), 400);
    }
});

serve({
    fetch: app.fetch,
    port: Number.parseInt(process.env.PORT ?? '3004', 10),
});

export default app;
