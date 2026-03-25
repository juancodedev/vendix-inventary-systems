import { NextResponse } from 'next/server';
import { getPlans } from '@vendix/billing-core';
import { billingErrorResponse } from '../_lib/billing';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const plans = await getPlans();
        return NextResponse.json({ data: plans });
    } catch (error) {
        return billingErrorResponse(error, 'No fue posible consultar los planes.');
    }
}
