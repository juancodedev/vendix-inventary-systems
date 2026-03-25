import { NextRequest } from 'next/server';
import { proxyInventoryRequest } from '@/app/api/inventory/_proxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return proxyInventoryRequest(request, { method: 'GET', path: '/inventory' });
}
