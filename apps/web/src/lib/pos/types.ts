export type PosPaymentMethod = 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER';

export interface PosProduct {
    id: string;
    name: string;
    sku: string;
    barcode?: string;
    qrCode?: string;
    category?: string;
    price: number;
    locationId: string;
    locationName: string;
    stock: number;
    minStock: number;
    isLowStock: boolean;
    lastUpdatedAt: string;
}

export interface PosTotals {
    subtotal: number;
    tax: number;
    total: number;
}

export interface PosCartItem {
    productId: string;
    name: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    stockAvailable: number;
}

export interface PosSaleItemPayload {
    productId: string;
    quantity: number;
}

export interface PosSalePayload {
    locationId: string;
    paymentMethod: PosPaymentMethod;
    items: PosSaleItemPayload[];
    clientReference?: string;
    notes?: string;
    taxRate?: number;
    metadata?: Record<string, unknown>;
}

export interface PosSaleResultItem {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    remainingStock: number;
}

export interface PosSaleResult {
    id: string;
    tenantId: string;
    locationId: string;
    userId: string;
    paymentMethod: PosPaymentMethod;
    status: string;
    subtotal: number;
    tax: number;
    total: number;
    notes?: string;
    clientReference?: string;
    duplicate: boolean;
    syncedAt?: string;
    createdAt: string;
    items: PosSaleResultItem[];
}

export interface PosInventoryIssue {
    productId: string;
    name?: string;
    sku?: string;
    requestedQuantity: number;
    availableQuantity: number;
    reason: 'PRODUCT_NOT_FOUND' | 'INVENTORY_NOT_FOUND' | 'INSUFFICIENT_STOCK';
}

export interface PosStockValidationResponse {
    ok: boolean;
    locationId: string;
    items: Array<{
        productId: string;
        name: string;
        sku: string;
        requestedQuantity: number;
        availableQuantity: number;
        isAvailable: boolean;
    }>;
}

export interface PosApiError {
    error: string;
    details?: string;
    code?: string;
}

export interface PosOfflineQueueItem {
    id: string;
    payload: PosSalePayload;
    queuedAt: string;
}

export interface PosProductsResponse {
    data: PosProduct[];
    meta: {
        query: string;
        limit: number;
        locationId: string;
        generatedAt: string;
    };
}

export interface PosSyncResponse {
    ok: boolean;
    results: Array<{
        clientReference?: string;
        ok: boolean;
        sale?: PosSaleResult;
        error?: string;
    }>;
}
