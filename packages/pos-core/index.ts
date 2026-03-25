import { prisma, Prisma, PaymentMethod, SaleStatus } from '@vendix/database';
import { hasAnyRole, type VendixContext } from '@vendix/utils';

const POS_READ_ROLES = ['ADMIN', 'SELLER', 'POS'];
const POS_WRITE_ROLES = ['ADMIN', 'SELLER', 'POS'];
const DEFAULT_TAX_RATE = 0.12;
const DEFAULT_PRODUCT_LIMIT = 24;
const MAX_PRODUCT_LIMIT = 50;

type JsonRecord = Record<string, string | number | boolean | null | JsonRecord | JsonRecord[] | Array<string | number | boolean | null>>;

export type PosPaymentMethod = keyof typeof PaymentMethod;

export interface PosProductResult {
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
    isLowStock: boolean;
    lastUpdatedAt: string;
}

export interface PosProductsResponse {
    data: PosProductResult[];
    meta: {
        query: string;
        limit: number;
        locationId: string;
        generatedAt: string;
    };
}

export interface PosStockValidationItemInput {
    productId: string;
    quantity: number;
}

export interface PosStockValidationRequest {
    locationId?: string;
    items: PosStockValidationItemInput[];
}

export interface PosStockValidationItemResult {
    productId: string;
    name: string;
    sku: string;
    requestedQuantity: number;
    availableQuantity: number;
    isAvailable: boolean;
}

export interface PosStockValidationResponse {
    ok: boolean;
    locationId: string;
    items: PosStockValidationItemResult[];
}

export interface PosSaleItemInput {
    productId: string;
    quantity: number;
}

export interface PosSaleRequest {
    locationId?: string;
    paymentMethod: PosPaymentMethod;
    items: PosSaleItemInput[];
    clientReference?: string;
    notes?: string;
    metadata?: JsonRecord;
    taxRate?: number;
    offline?: boolean;
}

export interface PosSaleItemResult {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface PosSaleResponse {
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
    items: PosSaleItemResult[];
}

export interface PosSyncRequest {
    sales: PosSaleRequest[];
}

export interface PosSyncSaleResult {
    clientReference?: string;
    ok: boolean;
    sale?: PosSaleResponse;
    error?: string;
}

export interface PosSyncResponse {
    ok: boolean;
    results: PosSyncSaleResult[];
}

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const toNumber = (value: Prisma.Decimal | number | string | null | undefined) => {
    if (value == null) {
        return 0;
    }

    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'string') {
        return Number(value);
    }

    return Number(value.toString());
};

const toDecimal = (value: number) => new Prisma.Decimal(roundCurrency(value).toFixed(2));

const normalizePaymentMethod = (value: string) => {
    const normalized = value?.toUpperCase();
    if (normalized && normalized in PaymentMethod) {
        return normalized as PosPaymentMethod;
    }

    throw new Error('Metodo de pago invalido.');
};

const requireRole = (ctx: VendixContext, allowedRoles: string[]) => {
    if (!hasAnyRole(ctx, allowedRoles)) {
        throw new Error('No tienes permisos para operar el POS.');
    }
};

const resolveLocationId = (ctx: VendixContext, requestedLocationId?: string) => {
    const locationId = requestedLocationId ?? ctx.locationId;
    if (!locationId) {
        throw new Error('locationId es obligatorio para el POS.');
    }

    return locationId;
};

const serializeProduct = (product: {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    qrCode: string | null;
    category: string | null;
    price: Prisma.Decimal;
    updatedAt: Date;
    inventories: Array<{
        quantity: number;
        minStock: number;
        locationId: string;
        location: { name: string };
    }>;
}): PosProductResult => {
    const inventory = product.inventories[0];

    return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode ?? undefined,
        qrCode: product.qrCode ?? undefined,
        category: product.category ?? undefined,
        price: toNumber(product.price),
        locationId: inventory?.locationId ?? '',
        locationName: inventory?.location.name ?? 'Sin sucursal',
        stock: inventory?.quantity ?? 0,
        isLowStock: inventory ? inventory.quantity <= inventory.minStock : true,
        lastUpdatedAt: product.updatedAt.toISOString(),
    };
};

const serializeSale = (sale: {
    id: string;
    tenantId: string;
    locationId: string;
    userId: string;
    paymentMethod: PaymentMethod;
    status: SaleStatus;
    subtotal: Prisma.Decimal;
    tax: Prisma.Decimal;
    total: Prisma.Decimal;
    notes: string | null;
    clientReference: string | null;
    syncedAt: Date | null;
    createdAt: Date;
    items: Array<{
        productId: string;
        quantity: number;
        price: Prisma.Decimal;
        product: { name: string; sku: string };
    }>;
}, duplicate = false): PosSaleResponse => ({
    id: sale.id,
    tenantId: sale.tenantId,
    locationId: sale.locationId,
    userId: sale.userId,
    paymentMethod: sale.paymentMethod,
    status: sale.status,
    subtotal: toNumber(sale.subtotal),
    tax: toNumber(sale.tax),
    total: toNumber(sale.total),
    notes: sale.notes ?? undefined,
    clientReference: sale.clientReference ?? undefined,
    duplicate,
    syncedAt: sale.syncedAt?.toISOString(),
    createdAt: sale.createdAt.toISOString(),
    items: sale.items.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: toNumber(item.price),
        subtotal: roundCurrency(toNumber(item.price) * item.quantity),
    })),
});

const buildSearchScore = (product: PosProductResult, normalizedQuery: string) => {
    const tokens = [product.sku, product.barcode, product.qrCode, product.name]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

    if (tokens.some((token) => token === normalizedQuery)) {
        return 0;
    }

    if (tokens.some((token) => token.startsWith(normalizedQuery))) {
        return 1;
    }

    return 2;
};

export const searchPosProducts = async (
    ctx: VendixContext,
    params: { query?: string; locationId?: string; limit?: number },
): Promise<PosProductsResponse> => {
    requireRole(ctx, POS_READ_ROLES);
    const locationId = resolveLocationId(ctx, params.locationId);
    const query = params.query?.trim() ?? '';
    const normalizedQuery = query.toLowerCase();
    const limit = Math.min(Math.max(params.limit ?? DEFAULT_PRODUCT_LIMIT, 1), MAX_PRODUCT_LIMIT);

    const products = await prisma.product.findMany({
        where: {
            tenantId: ctx.tenantId,
            deletedAt: null,
            isActive: true,
            ...(query
                ? {
                      OR: [
                          { name: { contains: query, mode: 'insensitive' } },
                          { sku: { contains: query, mode: 'insensitive' } },
                          { barcode: { contains: query, mode: 'insensitive' } },
                          { qrCode: { contains: query, mode: 'insensitive' } },
                      ],
                  }
                : {}),
        },
        include: {
            inventories: {
                where: {
                    tenantId: ctx.tenantId,
                    locationId,
                },
                include: {
                    location: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
        take: query ? Math.min(limit * 2, MAX_PRODUCT_LIMIT) : limit,
        orderBy: [
            { updatedAt: 'desc' },
            { name: 'asc' },
        ],
    });

    const mapped = products.map(serializeProduct);
    const data = query
        ? mapped
              .sort((left, right) => {
                  const leftScore = buildSearchScore(left, normalizedQuery);
                  const rightScore = buildSearchScore(right, normalizedQuery);
                  if (leftScore !== rightScore) {
                      return leftScore - rightScore;
                  }
                  return right.stock - left.stock;
              })
              .slice(0, limit)
        : mapped;

    return {
        data,
        meta: {
            query,
            limit,
            locationId,
            generatedAt: new Date().toISOString(),
        },
    };
};

export const validatePosStock = async (
    ctx: VendixContext,
    payload: PosStockValidationRequest,
): Promise<PosStockValidationResponse> => {
    requireRole(ctx, POS_WRITE_ROLES);
    const locationId = resolveLocationId(ctx, payload.locationId);

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
        throw new Error('Debes enviar al menos un item para validar stock.');
    }

    const requestedItems = payload.items
        .map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
        }))
        .filter((item) => item.productId && Number.isFinite(item.quantity) && item.quantity > 0);

    if (requestedItems.length === 0) {
        throw new Error('Los items enviados no son validos.');
    }

    const inventories = await prisma.inventory.findMany({
        where: {
            tenantId: ctx.tenantId,
            locationId,
            productId: {
                in: requestedItems.map((item) => item.productId),
            },
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    sku: true,
                },
            },
        },
    });

    const inventoryMap = new Map(inventories.map((inventory) => [inventory.productId, inventory]));
    const results = requestedItems.map((item) => {
        const inventory = inventoryMap.get(item.productId);
        const availableQuantity = inventory?.quantity ?? 0;

        return {
            productId: item.productId,
            name: inventory?.product.name ?? 'Producto no encontrado',
            sku: inventory?.product.sku ?? 'N/A',
            requestedQuantity: item.quantity,
            availableQuantity,
            isAvailable: availableQuantity >= item.quantity,
        } satisfies PosStockValidationItemResult;
    });

    return {
        ok: results.every((item) => item.isAvailable),
        locationId,
        items: results,
    };
};

const findExistingSaleByClientReference = async (ctx: VendixContext, clientReference?: string) => {
    if (!clientReference) {
        return null;
    }

    return prisma.sale.findFirst({
        where: {
            tenantId: ctx.tenantId,
            clientReference,
        },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            name: true,
                            sku: true,
                        },
                    },
                },
            },
        },
    });
};

export const createPosSale = async (ctx: VendixContext, payload: PosSaleRequest): Promise<PosSaleResponse> => {
    requireRole(ctx, POS_WRITE_ROLES);
    const locationId = resolveLocationId(ctx, payload.locationId);
    const paymentMethod = normalizePaymentMethod(payload.paymentMethod);
    const taxRate = typeof payload.taxRate === 'number' ? Math.max(payload.taxRate, 0) : DEFAULT_TAX_RATE;

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
        throw new Error('El carrito esta vacio.');
    }

    const existingSale = await findExistingSaleByClientReference(ctx, payload.clientReference);
    if (existingSale) {
        return serializeSale(existingSale, true);
    }

    const consolidatedItems = Array.from(
        payload.items.reduce((map, current) => {
            const quantity = Number(current.quantity);
            if (!current.productId || !Number.isFinite(quantity) || quantity <= 0) {
                return map;
            }

            const previous = map.get(current.productId) ?? 0;
            map.set(current.productId, previous + Math.trunc(quantity));
            return map;
        }, new Map<string, number>()),
    ).map(([productId, quantity]) => ({ productId, quantity }));

    if (consolidatedItems.length === 0) {
        throw new Error('No hay items validos para procesar la venta.');
    }

    const result = await prisma.$transaction(async (tx) => {
        const [location, products, inventories] = await Promise.all([
            tx.location.findFirst({
                where: {
                    id: locationId,
                    tenantId: ctx.tenantId,
                },
            }),
            tx.product.findMany({
                where: {
                    tenantId: ctx.tenantId,
                    deletedAt: null,
                    isActive: true,
                    id: {
                        in: consolidatedItems.map((item) => item.productId),
                    },
                },
            }),
            tx.inventory.findMany({
                where: {
                    tenantId: ctx.tenantId,
                    locationId,
                    productId: {
                        in: consolidatedItems.map((item) => item.productId),
                    },
                },
            }),
        ]);

        if (!location) {
            throw new Error('La sucursal seleccionada no existe para el tenant actual.');
        }

        const productMap = new Map(products.map((product) => [product.id, product]));
        const inventoryMap = new Map(inventories.map((inventory) => [inventory.productId, inventory]));

        for (const item of consolidatedItems) {
            const product = productMap.get(item.productId);
            if (!product) {
                throw new Error(`Producto no encontrado: ${item.productId}.`);
            }

            const inventory = inventoryMap.get(item.productId);
            if (!inventory || inventory.quantity < item.quantity) {
                throw new Error(`Stock insuficiente para ${product.name}.`);
            }
        }

        const subtotal = roundCurrency(
            consolidatedItems.reduce((accumulator, item) => {
                const product = productMap.get(item.productId);
                return accumulator + toNumber(product?.price) * item.quantity;
            }, 0),
        );
        const tax = roundCurrency(subtotal * taxRate);
        const total = roundCurrency(subtotal + tax);

        const sale = await tx.sale.create({
            data: {
                tenantId: ctx.tenantId,
                locationId,
                userId: ctx.userId,
                status: 'COMPLETED',
                subtotal: toDecimal(subtotal),
                tax: toDecimal(tax),
                total: toDecimal(total),
                paymentMethod,
                clientReference: payload.clientReference,
                notes: payload.notes,
                metadata: {
                    source: payload.offline ? 'offline-sync' : 'pos-live',
                    ...(payload.metadata ?? {}),
                },
                syncedAt: payload.offline ? new Date() : null,
                items: {
                    create: consolidatedItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: toDecimal(toNumber(productMap.get(item.productId)?.price)),
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                sku: true,
                            },
                        },
                    },
                },
            },
        });

        for (const item of consolidatedItems) {
            const inventory = inventoryMap.get(item.productId);
            if (!inventory) {
                continue;
            }

            await tx.inventory.update({
                where: {
                    id: inventory.id,
                },
                data: {
                    quantity: inventory.quantity - item.quantity,
                },
            });
        }

        await tx.inventoryMovement.createMany({
            data: consolidatedItems.map((item) => ({
                tenantId: ctx.tenantId,
                productId: item.productId,
                locationId,
                type: 'OUT',
                quantity: item.quantity,
                reference: sale.id,
                notes: payload.notes,
                createdBy: ctx.userId,
            })),
        });

        await tx.auditLog.create({
            data: {
                tenantId: ctx.tenantId,
                entity: 'Sale',
                entityId: sale.id,
                action: 'pos.sale.completed',
                changes: {
                    userId: ctx.userId,
                    locationId,
                    paymentMethod,
                    subtotal,
                    tax,
                    total,
                    itemCount: consolidatedItems.length,
                    clientReference: payload.clientReference,
                    offline: payload.offline ?? false,
                },
            },
        });

        return sale;
    });

    return serializeSale(result);
};

export const syncOfflineSales = async (ctx: VendixContext, payload: PosSyncRequest): Promise<PosSyncResponse> => {
    requireRole(ctx, POS_WRITE_ROLES);

    if (!Array.isArray(payload.sales) || payload.sales.length === 0) {
        throw new Error('No hay ventas offline para sincronizar.');
    }

    const results: PosSyncSaleResult[] = [];

    for (const sale of payload.sales) {
        try {
            const syncedSale = await createPosSale(ctx, {
                ...sale,
                offline: true,
            });

            results.push({
                clientReference: sale.clientReference,
                ok: true,
                sale: syncedSale,
            });
        } catch (error) {
            results.push({
                clientReference: sale.clientReference,
                ok: false,
                error: error instanceof Error ? error.message : 'No fue posible sincronizar la venta.',
            });
        }
    }

    return {
        ok: results.every((result) => result.ok),
        results,
    };
};