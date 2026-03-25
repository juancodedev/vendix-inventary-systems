import { NextRequest, NextResponse } from 'next/server';
import { searchPosProducts } from '@vendix/pos-core';
import { getVendixContext } from '@vendix/utils';

export const dynamic = 'force-dynamic';

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
        return NextResponse.json(
            {
                error: 'No fue posible cargar productos del POS.',
                details: String(error),
            },
            { status: 400 },
        );
    }
}