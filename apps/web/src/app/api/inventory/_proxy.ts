import { NextRequest, NextResponse } from 'next/server';

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL ?? 'http://localhost:3003';

const CONTEXT_HEADERS = ['x-tenant-id', 'x-user-id', 'x-roles', 'authorization'] as const;

type ProxyOptions = {
    method: 'GET' | 'POST';
    path: string;
    body?: unknown;
};

export async function proxyInventoryRequest(request: NextRequest, options: ProxyOptions) {
    const targetUrl = new URL(options.path, INVENTORY_SERVICE_URL);
    const sourceUrl = new URL(request.url);

    sourceUrl.searchParams.forEach((value, key) => {
        targetUrl.searchParams.set(key, value);
    });

    const headers = new Headers();
    for (const headerName of CONTEXT_HEADERS) {
        const value = request.headers.get(headerName);
        if (value) {
            headers.set(headerName, value);
        }
    }

    if (options.body !== undefined) {
        headers.set('content-type', 'application/json');
    }

    try {
        const response = await fetch(targetUrl, {
            method: options.method,
            headers,
            body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
            cache: 'no-store',
        });

        const text = await response.text();
        const contentType = response.headers.get('content-type') ?? 'application/json';

        if (contentType.includes('application/json')) {
            const payload = text ? JSON.parse(text) : null;
            return NextResponse.json(payload, { status: response.status });
        }

        return new NextResponse(text, {
            status: response.status,
            headers: { 'content-type': contentType },
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: 'No fue posible contactar inventory-service.',
                details: String(error),
            },
            { status: 503 },
        );
    }
}
