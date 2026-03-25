import { NextRequest, NextResponse } from 'next/server';
import { syncOfflineSales, type PosSyncRequest } from '@vendix/pos-core';
import { getVendixContext } from '@vendix/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const ctx = getVendixContext(request);

    try {
        const payload = (await request.json()) as PosSyncRequest;
        const data = await syncOfflineSales(ctx, payload);

        return NextResponse.json(data, { status: data.ok ? 200 : 207 });
    } catch (error) {
        return NextResponse.json(
            {
                error: 'No fue posible sincronizar las ventas offline.',
                details: String(error),
            },
            { status: 400 },
        );
    }
}