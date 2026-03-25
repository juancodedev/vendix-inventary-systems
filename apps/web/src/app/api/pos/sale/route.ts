import { NextRequest, NextResponse } from 'next/server';
import { createPosSale, type PosSaleRequest } from '@vendix/pos-core';
import { getVendixContext } from '@vendix/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const ctx = getVendixContext(request);

    try {
        const payload = (await request.json()) as PosSaleRequest;
        const data = await createPosSale(ctx, payload);

        return NextResponse.json(data, { status: data.duplicate ? 200 : 201 });
    } catch (error) {
        return NextResponse.json(
            {
                error: 'No fue posible registrar la venta.',
                details: String(error),
            },
            { status: 400 },
        );
    }
}