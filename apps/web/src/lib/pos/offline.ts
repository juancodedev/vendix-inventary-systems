import type { PosOfflineQueueItem, PosProduct, PosSalePayload } from './types';

const PRODUCT_CACHE_KEY = 'vendix-pos-product-cache';
const PRODUCT_CACHE_TS_KEY = 'vendix-pos-product-cache-ts';
const QUEUE_KEY = 'vendix-pos-offline-queue';
const CONTEXT_KEY = 'vendix-pos-context';

export interface PosClientContext {
    tenantId: string;
    locationId: string;
    userId: string;
    roles: string;
}

const parseJson = <T>(raw: string | null, fallback: T): T => {
    if (!raw) {
        return fallback;
    }

    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
};

export const getClientContext = (): PosClientContext => {
    if (typeof window === 'undefined') {
        return {
            tenantId: 'default-tenant',
            locationId: 'default-location',
            userId: 'system',
            roles: 'ADMIN',
        };
    }

    const saved = parseJson<Partial<PosClientContext>>(window.localStorage.getItem(CONTEXT_KEY), {});

    return {
        tenantId: saved.tenantId ?? 'default-tenant',
        locationId: saved.locationId ?? 'default-location',
        userId: saved.userId ?? 'system',
        roles: saved.roles ?? 'SELLER',
    };
};

export const updateClientContext = (partial: Partial<PosClientContext>) => {
    if (typeof window === 'undefined') {
        return;
    }

    const next = {
        ...getClientContext(),
        ...partial,
    };

    window.localStorage.setItem(CONTEXT_KEY, JSON.stringify(next));
};

export const saveProductCache = (products: PosProduct[]) => {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(products));
    window.localStorage.setItem(PRODUCT_CACHE_TS_KEY, new Date().toISOString());
};

export const getProductCache = () => {
    if (typeof window === 'undefined') {
        return {
            products: [] as PosProduct[],
            timestamp: undefined,
        };
    }

    return {
        products: parseJson<PosProduct[]>(window.localStorage.getItem(PRODUCT_CACHE_KEY), []),
        timestamp: window.localStorage.getItem(PRODUCT_CACHE_TS_KEY) ?? undefined,
    };
};

export const getOfflineQueue = () => {
    if (typeof window === 'undefined') {
        return [] as PosOfflineQueueItem[];
    }

    return parseJson<PosOfflineQueueItem[]>(window.localStorage.getItem(QUEUE_KEY), []);
};

export const pushOfflineSale = (payload: PosSalePayload) => {
    if (typeof window === 'undefined') {
        return;
    }

    const queue = getOfflineQueue();
    const entry: PosOfflineQueueItem = {
        id: payload.clientReference ?? `local-${Date.now()}`,
        payload,
        queuedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(QUEUE_KEY, JSON.stringify([...queue, entry]));
};

export const clearOfflineQueue = () => {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.removeItem(QUEUE_KEY);
};

export const replaceOfflineQueue = (queue: PosOfflineQueueItem[]) => {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const toClientReference = () => {
    return `pos-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
};
