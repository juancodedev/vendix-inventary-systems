import { NextRequest, NextResponse } from 'next/server';
import { processStripeWebhook } from '@vendix/billing-core';
import { billingErrorResponse } from '../../_lib/billing';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const signature = request.headers.get('stripe-signature');
        const body = await request.text();
        const result = await processStripeWebhook(body, signature);
        return NextResponse.json(result);
    } catch (error) {
        return billingErrorResponse(error, 'No fue posible procesar el webhook de Stripe.');
    }
}
