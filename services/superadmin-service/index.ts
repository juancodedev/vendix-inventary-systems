import { Hono } from 'hono';

const app = new Hono();

// Only accessible by SuperAdmins
app.get('/tenants', (c) => {
    return c.json({ total: 150, active: 140 });
});

app.get('/stats', (c) => {
    return c.json({
        total_sales_volume: 500000,
        system_health: 'green'
    });
});

export default app;
