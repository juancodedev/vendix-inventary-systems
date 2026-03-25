import { NextRequest, NextResponse } from 'next/server';
import { PosCoreError, createPosSale, type PosSaleRequest } from '@vendix/pos-core';
import { getVendixContext } from '@vendix/utils';

export const dynamic = 'force-dynamic';

const serializeError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof PosCoreError) {
        return {
            body: {
                error: error.message,
                details: error.details,
                code: error.code,
            },
            status: error.status,
        };
    }

    return {
        body: {
            error: fallbackMessage,
            details: String(error),
            code: 'INTERNAL_ERROR',
        },
        status: 500,
    };
};

export async function POST(request: NextRequest) {
    const ctx = getVendixContext(request);

    try {
        const payload = (await request.json()) as PosSaleRequest;
        const data = await createPosSale(ctx, payload);

        return NextResponse.json(data, { status: data.duplicate ? 200 : 201 });
    } catch (error) {
        const serialized = serializeError(error, 'No fue posible registrar la venta.');
        return NextResponse.json(serialized.body, { status: serialized.status });
    }
}