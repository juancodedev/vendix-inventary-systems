import { NextRequest, NextResponse } from 'next/server';
import { validatePosStock, type PosStockValidationRequest } from '@vendix/pos-core';
import { getVendixContext } from '@vendix/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const ctx = getVendixContext(request);

    try {
        const payload = (await request.json()) as PosStockValidationRequest;
        const data = await validatePosStock(ctx, payload);

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            {
                error: 'No fue posible validar stock.',
                details: String(error),
            },
            { status: 400 },
        );
    }
}