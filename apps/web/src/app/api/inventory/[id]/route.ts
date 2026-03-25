import { NextRequest } from 'next/server';
import { proxyInventoryRequest } from '@/app/api/inventory/_proxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    return proxyInventoryRequest(request, { method: 'GET', path: `/inventory/${id}` });
}
