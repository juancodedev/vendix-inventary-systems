import { NextRequest, NextResponse } from 'next/server';
import { PosCoreError, validatePosStock, type PosStockValidationRequest } from '@vendix/pos-core';
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
        const payload = (await request.json()) as PosStockValidationRequest;
        const data = await validatePosStock(ctx, payload);

        return NextResponse.json(data);
    } catch (error) {
        const serialized = serializeError(error, 'No fue posible validar stock.');
        return NextResponse.json(serialized.body, { status: serialized.status });
    }
}