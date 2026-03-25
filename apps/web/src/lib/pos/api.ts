import {
    getClientContext,
    getOfflineQueue,
    replaceOfflineQueue,
    saveProductCache,
} from './offline';
import type {
    PosApiError,
    PosProductsResponse,
    PosSalePayload,
    PosSaleResult,
    PosStockValidationResponse,
    PosSyncResponse,
} from './types';

const buildHeaders = () => {
    const ctx = getClientContext();

    return {
        'Content-Type': 'application/json',
        'x-tenant-id': ctx.tenantId,
        'x-location-id': ctx.locationId,
        'x-user-id': ctx.userId,
        'x-roles': ctx.roles,
    };
};

const parseResponse = async <T>(response: Response): Promise<T> => {
    const payload = (await response.json().catch(() => ({}))) as T | PosApiError;

    if (!response.ok) {
        const errorPayload = payload as PosApiError;
        const error = new Error(errorPayload.error || 'Error en API POS');
        Object.assign(error, errorPayload);
        throw error;
    }

    return payload as T;
};

export const fetchProducts = async (query: string, locationId?: string) => {
    const params = new URLSearchParams();
    if (query) {
        params.set('query', query);
    }

    if (locationId) {
        params.set('locationId', locationId);
    }

    params.set('limit', '30');

    const response = await fetch(`/api/pos/products?${params.toString()}`, {
        method: 'GET',
        headers: buildHeaders(),
        cache: 'no-store',
    });

    const payload = await parseResponse<PosProductsResponse>(response);
    saveProductCache(payload.data);
    return payload;
};

export const validateStock = async (payload: { locationId: string; items: Array<{ productId: string; quantity: number }> }) => {
    const response = await fetch('/api/pos/validate-stock', {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(payload),
    });

    return parseResponse<PosStockValidationResponse>(response);
};

export const createSale = async (payload: PosSalePayload) => {
    const response = await fetch('/api/pos/sale', {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(payload),
    });

    return parseResponse<PosSaleResult>(response);
};

export const syncQueuedSales = async (): Promise<PosSyncResponse | null> => {
    const queued = getOfflineQueue();
    if (queued.length === 0) {
        return null;
    }

    const response = await fetch('/api/pos/sync', {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
            sales: queued.map((item) => ({
                ...item.payload,
                offline: true,
            })),
        }),
    });

    const result = await parseResponse<PosSyncResponse>(response);

    const pending = queued.filter((item) => {
        const synced = result.results.find((entry) => entry.clientReference === item.payload.clientReference);
        return !synced?.ok;
    });

    replaceOfflineQueue(pending);

    return result;
};