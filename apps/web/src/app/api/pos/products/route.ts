import { NextRequest, NextResponse } from 'next/server';
import { PosCoreError, searchPosProducts } from '@vendix/pos-core';
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

export async function GET(request: NextRequest) {
    const ctx = getVendixContext(request);

    try {
        const { searchParams } = new URL(request.url);
        const data = await searchPosProducts(ctx, {
            query: searchParams.get('query')?.trim() ?? undefined,
            locationId: searchParams.get('locationId')?.trim() ?? undefined,
            limit: Number.parseInt(searchParams.get('limit') ?? '', 10) || undefined,
        });

        return NextResponse.json(data);
    } catch (error) {
        const serialized = serializeError(error, 'No fue posible cargar productos del POS.');
        return NextResponse.json(serialized.body, { status: serialized.status });
    }
}