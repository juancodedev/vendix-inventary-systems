import { NextRequest, NextResponse } from 'next/server';
import { cancelSubscription } from '@vendix/billing-core';
import { billingErrorResponse, getTenantFromRequest } from '../_lib/billing';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const tenantId = getTenantFromRequest(request);
        const result = await cancelSubscription(tenantId);
        return NextResponse.json({ data: result });
    } catch (error) {
        return billingErrorResponse(error, 'No fue posible cancelar la suscripcion.');
    }
}
