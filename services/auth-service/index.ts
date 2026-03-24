import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { getVendixContext } from '@vendix/utils';

const app = new Hono();

// Middleware for JWT (Mock configuration)
// app.use('/auth/*', jwt({ secret: 'secret-key' }));

app.post('/login', async (c) => {
    // Logic for user login
    return c.json({ token: 'mock-jwt-token-with-tenant-info' });
});

app.get('/me', (c) => {
    const ctx = getVendixContext(c.req);
    return c.json({
        user_id: ctx.userId,
        tenant_id: ctx.tenantId,
        roles: ctx.roles
    });
});

export default app;
