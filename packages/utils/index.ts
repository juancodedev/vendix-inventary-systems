/**
 * @vendix/utils
 * Shared utilities for the Vendix SaaS platform.
 */

import { ID } from '@vendix/types';

export interface VendixContext {
    tenantId: ID;
    userId: ID;
    locationId?: ID;
    roles: string[];
}

/**
 * Middleware to extract Vendix context from headers/token.
 * In a real scenario, this would verify JWT and extract tenant info.
 */
export const getVendixContext = (req: any): VendixContext => {
    const tenantId = req.headers['x-tenant-id'] || 'default-tenant';
    const locationId = req.headers['x-location-id'];
    const userId = req.headers['x-user-id'] || 'system';

    return {
        tenantId,
        userId,
        locationId,
        roles: (req.headers['x-roles'] || '').split(','),
    };
};

/**
 * Multitenant query decorator (Conceptual)
 * Ensures every database query is scoped to the current tenant.
 */
export const withTenantScope = (query: any, tenantId: ID) => {
    return {
        ...query,
        where: {
            ...query.where,
            tenant_id: tenantId,
        },
    };
};

/**
 * Inter-service communication helper.
 * Propagates tenant and user context automatically.
 */
export const callService = async (
    serviceUrl: string,
    path: string,
    method: string,
    ctx: VendixContext,
    body?: any
) => {
    const response = await fetch(`${serviceUrl}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': ctx.tenantId,
            'x-user-id': ctx.userId,
            'x-location-id': ctx.locationId || '',
            'x-roles': ctx.roles.join(','),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        throw new Error(`Service call failed: ${response.statusText}`);
    }

    return response.json();
};
