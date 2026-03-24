import { Hono } from 'hono';
import { getVendixContext } from '@vendix/utils';

const app = new Hono();

app.get('/locations', (c) => {
    const ctx = getVendixContext(c.req);
    return c.json([
        { id: 'loc-1', name: 'Main Store', type: 'store' }
    ]);
});

export default app;
