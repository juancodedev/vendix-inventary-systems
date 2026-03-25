import { NextRequest, NextResponse } from 'next/server';
import {
    getCurrentSubscription,
    listTenantInvoices,
    listTenantUsage,
} from '@vendix/billing-core';
import { billingErrorResponse, getTenantFromRequest } from '../_lib/billing';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const tenantId = getTenantFromRequest(request);
        const [subscription, usage, invoices] = await Promise.all([
            getCurrentSubscription(tenantId),
            listTenantUsage(tenantId),
            listTenantInvoices(tenantId),
        ]);

        return NextResponse.json({
            data: {
                subscription,
                usage,
                invoices,
            },
        });
    } catch (error) {
        return billingErrorResponse(error, 'No fue posible consultar la suscripcion.');
    }
}
