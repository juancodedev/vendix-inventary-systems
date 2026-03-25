import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import {
    PosCoreError,
    cancelPosSale,
    createPosSale,
    searchPosProducts,
    syncOfflineSales,
    validatePosStock,
    type PosCancelSaleRequest,
    type PosSaleRequest,
    type PosStockValidationRequest,
    type PosSyncRequest,
} from '@vendix/pos-core';
import { getVendixContext } from '@vendix/utils';

const app = new Hono();

app.use('*', cors());

const errorResponse = (message: string, details?: unknown, code?: string) => ({
    error: message,
    details,
    code,
});

const toStatusCode = (status: number): ContentfulStatusCode => {
    if (status >= 100 && status <= 599) {
        return status as ContentfulStatusCode;
    }

    return 500;
};

const serializeError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof PosCoreError) {
        return {
            body: errorResponse(error.message, error.details, error.code),
            status: error.status,
        };
    }

    return {
        body: errorResponse(fallbackMessage, String(error), 'INTERNAL_ERROR'),
        status: 500,
    };
};

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
        const serialized = serializeError(error, 'No fue posible cargar productos del POS.');
        return c.json(serialized.body, toStatusCode(serialized.status));
    }
});

app.post('/pos/validate-stock', async (c) => {
    const ctx = getVendixContext(c.req);

    try {
        const payload = (await c.req.json()) as PosStockValidationRequest;
        const response = await validatePosStock(ctx, payload);

        return c.json(response);
    } catch (error) {
        const serialized = serializeError(error, 'No fue posible validar stock.');
        return c.json(serialized.body, toStatusCode(serialized.status));
    }
});

app.post('/pos/sale', async (c) => {
    const ctx = getVendixContext(c.req);

    try {
        const payload = (await c.req.json()) as PosSaleRequest;
        const response = await createPosSale(ctx, payload);

        return c.json(response, response.duplicate ? 200 : 201);
    } catch (error) {
        const serialized = serializeError(error, 'No fue posible registrar la venta.');
        return c.json(serialized.body, toStatusCode(serialized.status));
    }
});

app.post('/pos/sale/:saleId/cancel', async (c) => {
    const ctx = getVendixContext(c.req);

    try {
        const payload = (await c.req.json().catch(() => ({}))) as PosCancelSaleRequest;
        const response = await cancelPosSale(ctx, c.req.param('saleId'), payload);

        return c.json(response);
    } catch (error) {
        const serialized = serializeError(error, 'No fue posible cancelar la venta.');
        return c.json(serialized.body, toStatusCode(serialized.status));
    }
});

app.post('/pos/sync', async (c) => {
    const ctx = getVendixContext(c.req);

    try {
        const payload = (await c.req.json()) as PosSyncRequest;
        const response = await syncOfflineSales(ctx, payload);

        return c.json(response, response.ok ? 200 : 207);
    } catch (error) {
        const serialized = serializeError(error, 'No fue posible sincronizar ventas offline.');
        return c.json(serialized.body, toStatusCode(serialized.status));
    }
});

serve({
    fetch: app.fetch,
    port: Number.parseInt(process.env.PORT ?? '3004', 10),
});

export default app;
