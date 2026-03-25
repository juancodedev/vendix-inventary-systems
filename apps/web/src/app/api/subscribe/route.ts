import { NextRequest, NextResponse } from 'next/server';
import { subscribeTenant } from '@vendix/billing-core';
import { billingErrorResponse, getTenantFromRequest } from '../_lib/billing';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const tenantId = getTenantFromRequest(request);
        const payload = (await request.json()) as {
            planCode?: string;
            successUrl?: string;
            cancelUrl?: string;
        };

        if (!payload.planCode || !payload.successUrl || !payload.cancelUrl) {
            return NextResponse.json(
                {
                    error: 'planCode, successUrl y cancelUrl son obligatorios.',
                    code: 'INVALID_PAYLOAD',
                },
                { status: 400 },
            );
        }

        const result = await subscribeTenant({
            tenantId,
            planCode: payload.planCode,
            successUrl: payload.successUrl,
            cancelUrl: payload.cancelUrl,
        });

        return NextResponse.json(result);
    } catch (error) {
        return billingErrorResponse(error, 'No fue posible iniciar la suscripcion.');
    }
}
