import { NextRequest, NextResponse } from 'next/server';
import { BillingCoreError } from '@vendix/billing-core';
import { getVendixContext } from '@vendix/utils';

export const getTenantFromRequest = (request: NextRequest) => {
    const ctx = getVendixContext(request);
    if (!ctx.tenantId) {
        throw new BillingCoreError('INVALID_TENANT', 'tenantId es obligatorio.', 400);
    }

    return ctx.tenantId;
};

export const serializeBillingError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof BillingCoreError) {
        return {
            status: error.status,
            body: {
                error: error.message,
                code: error.code,
                details: error.details,
            },
        };
    }

    return {
        status: 500,
        body: {
            error: fallbackMessage,
            code: 'INTERNAL_ERROR',
            details: String(error),
        },
    };
};

export const billingErrorResponse = (error: unknown, fallbackMessage: string) => {
    const serialized = serializeBillingError(error, fallbackMessage);
    return NextResponse.json(serialized.body, { status: serialized.status });
};
