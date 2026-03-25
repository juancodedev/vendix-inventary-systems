import { NextRequest } from 'next/server';
import { proxyInventoryRequest } from '@/app/api/inventory/_proxy';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const body = await request.json();
    return proxyInventoryRequest(request, { method: 'POST', path: '/inventory/movement', body });
}
