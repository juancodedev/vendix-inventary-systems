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

const readHeader = (req: any, name: string): string | undefined => {
    if (!req) {
        return undefined;
    }

    if (typeof req.header === 'function') {
        return req.header(name) ?? req.header(name.toLowerCase()) ?? undefined;
    }

    if (typeof req.headers?.get === 'function') {
        return req.headers.get(name) ?? req.headers.get(name.toLowerCase()) ?? undefined;
    }

    if (req.headers && typeof req.headers === 'object') {
        const headers = req.headers as Record<string, string | string[] | undefined>;
        const value = headers[name] ?? headers[name.toLowerCase()];
        return Array.isArray(value) ? value[0] : value;
    }

    return undefined;
};

/**
 * Middleware to extract Vendix context from headers/token.
 * In a real scenario, this would verify JWT and extract tenant info.
 */
export const getVendixContext = (req: any): VendixContext => {
    const tenantId = readHeader(req, 'x-tenant-id') || 'default-tenant';
    const locationId = readHeader(req, 'x-location-id');
    const userId = readHeader(req, 'x-user-id') || 'system';
    const rolesHeader = readHeader(req, 'x-roles') || 'ADMIN';

    return {
        tenantId,
        userId,
        locationId,
        roles: rolesHeader
            .split(',')
            .map((role) => role.trim().toUpperCase())
            .filter(Boolean),
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
            tenantId,
        },
    };
};

export const hasAnyRole = (ctx: VendixContext, roles: string[]) => {
    const allowedRoles = roles.map((role) => role.toUpperCase());
    return ctx.roles.some((role) => allowedRoles.includes(role));
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
