import { prisma, Prisma, PaymentMethod, SaleStatus } from '@vendix/database';
import { hasAnyRole, type VendixContext } from '@vendix/utils';

const POS_READ_ROLES = ['ADMIN', 'SELLER', 'POS'];
const POS_WRITE_ROLES = ['ADMIN', 'SELLER', 'POS'];
const POS_CANCEL_ROLES = ['ADMIN'];
const DEFAULT_TAX_RATE = 0.12;
const DEFAULT_PRODUCT_LIMIT = 24;
const MAX_PRODUCT_LIMIT = 50;
const MAX_TRANSACTION_RETRIES = 3;
const POS_TRANSACTION_OPTIONS = {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 5_000,
    timeout: 10_000,
} as const;

type LockedInventoryRow = {
    id: string;
    tenantId: string;
    productId: string;
    locationId: string;
    quantity: number;
    minStock: number;
};
type PosTransactionClient = Prisma.TransactionClient;

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
    minStock: number;
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
    metadata?: Record<string, unknown>;
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
    remainingStock: number;
}

export interface PosInventoryIssue {
    productId: string;
    name?: string;
    sku?: string;
    requestedQuantity: number;
    availableQuantity: number;
    reason: 'PRODUCT_NOT_FOUND' | 'INVENTORY_NOT_FOUND' | 'INSUFFICIENT_STOCK';
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

export interface PosCancelSaleRequest {
    reason?: string;
}

export interface PosCancelSaleResponse {
    id: string;
    tenantId: string;
    locationId: string;
    userId: string;
    status: Extract<keyof typeof SaleStatus, 'CANCELLED'>;
    restoredItems: number;
    cancelledAt: string;
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

export class PosCoreError extends Error {
    code: string;
    status: number;
    details?: Record<string, unknown>;

    constructor(code: string, message: string, status: number, details?: Record<string, unknown>) {
        super(message);
        this.name = 'PosCoreError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
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

const isRetryableTransactionError = (error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return error.code === 'P2034';
    }

    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes('could not serialize access') || message.includes('deadlock detected');
    }

    return false;
};

const executeWithRetry = async <T>(operation: () => Promise<T>) => {
    let attempt = 0;

    while (attempt < MAX_TRANSACTION_RETRIES) {
        try {
            return await operation();
        } catch (error) {
            attempt += 1;

            if (!isRetryableTransactionError(error) || attempt >= MAX_TRANSACTION_RETRIES) {
                throw error;
            }
        }
    }

    throw new PosCoreError('TRANSACTION_FAILED', 'No fue posible completar la transacción del POS.', 409);
};

const normalizePaymentMethod = (value: string) => {
    const normalized = value?.toUpperCase();
    if (normalized && normalized in PaymentMethod) {
        return normalized as PosPaymentMethod;
    }

    throw new PosCoreError('INVALID_PAYMENT_METHOD', 'Metodo de pago invalido.', 400);
};

const requireRole = (ctx: VendixContext, allowedRoles: string[]) => {
    if (!hasAnyRole(ctx, allowedRoles)) {
        throw new PosCoreError('FORBIDDEN', 'No tienes permisos para operar el POS.', 403);
    }
};

const resolveLocationId = (ctx: VendixContext, requestedLocationId?: string) => {
    const locationId = requestedLocationId ?? ctx.locationId;
    if (!locationId) {
        throw new PosCoreError('INVALID_CONTEXT', 'locationId es obligatorio para el POS.', 400);
    }

    return locationId;
};

const createAuditLog = async (
    tx: PosTransactionClient,
    tenantId: string,
    entity: string,
    entityId: string,
    action: string,
    changes: Record<string, unknown>,
) => {
    await tx.auditLog.create({
        data: {
            tenantId,
            entity,
            entityId,
            action,
            changes: changes as Prisma.InputJsonValue,
        },
    });
};

const normalizeSaleItems = (items: PosSaleItemInput[]) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new PosCoreError('EMPTY_CART', 'El carrito esta vacio.', 400);
    }

    const mergedItems = new Map<string, number>();

    for (const item of items) {
        const quantity = Number(item?.quantity);
        if (!item?.productId || !Number.isInteger(quantity) || quantity <= 0) {
            throw new PosCoreError('INVALID_PAYLOAD', 'Los items enviados no son validos.', 400);
        }

        mergedItems.set(item.productId, (mergedItems.get(item.productId) ?? 0) + quantity);
    }

    return Array.from(mergedItems.entries()).map(([productId, quantity]) => ({ productId, quantity }));
};

const lockInventoryRows = async (
    tx: PosTransactionClient,
    tenantId: string,
    locationId: string,
    productIds: string[],
) => {
    if (productIds.length === 0) {
        return [] as LockedInventoryRow[];
    }

    return tx.$queryRaw<LockedInventoryRow[]>(Prisma.sql`
        SELECT id, "tenantId", "productId", "locationId", quantity, "minStock"
        FROM "Inventory"
        WHERE "tenantId" = ${tenantId}
          AND "locationId" = ${locationId}
          AND "productId" IN (${Prisma.join(productIds)})
        ORDER BY "productId"
        FOR UPDATE
    `);
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
        minStock: inventory?.minStock ?? 0,
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
}, duplicate = false, remainingStockByProductId?: Map<string, number>): PosSaleResponse => ({
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
        remainingStock: remainingStockByProductId?.get(item.productId) ?? 0,
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

const buildInventoryIssues = (
    items: Array<{ productId: string; quantity: number }>,
    productsById: Map<string, { id: string; name: string; sku: string; price: Prisma.Decimal }>,
    inventoryByProductId: Map<string, LockedInventoryRow>,
) => {
    const issues: PosInventoryIssue[] = [];

    for (const item of items) {
        const product = productsById.get(item.productId);
        const inventory = inventoryByProductId.get(item.productId);

        if (!product) {
            issues.push({
                productId: item.productId,
                requestedQuantity: item.quantity,
                availableQuantity: 0,
                reason: 'PRODUCT_NOT_FOUND',
            });
            continue;
        }

        if (!inventory) {
            issues.push({
                productId: item.productId,
                name: product.name,
                sku: product.sku,
                requestedQuantity: item.quantity,
                availableQuantity: 0,
                reason: 'INVENTORY_NOT_FOUND',
            });
            continue;
        }

        if (inventory.quantity < item.quantity) {
            issues.push({
                productId: item.productId,
                name: product.name,
                sku: product.sku,
                requestedQuantity: item.quantity,
                availableQuantity: inventory.quantity,
                reason: 'INSUFFICIENT_STOCK',
            });
        }
    }

    return issues;
};

const ensureSaleAccess = async (tx: PosTransactionClient, ctx: VendixContext, locationId: string) => {
    const [location, user] = await Promise.all([
        tx.location.findFirst({
            where: {
                id: locationId,
                tenantId: ctx.tenantId,
            },
            select: {
                id: true,
            },
        }),
        tx.user.findFirst({
            where: {
                id: ctx.userId,
                tenantId: ctx.tenantId,
                isActive: true,
            },
            select: {
                id: true,
            },
        }),
    ]);

    if (!location) {
        throw new PosCoreError('LOCATION_NOT_FOUND', 'La sucursal seleccionada no existe para el tenant actual.', 404);
    }

    if (!user) {
        throw new PosCoreError('USER_NOT_FOUND', 'El usuario no existe o esta inactivo para el tenant actual.', 404);
    }
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
        throw new PosCoreError('INVALID_PAYLOAD', 'Debes enviar al menos un item para validar stock.', 400);
    }

    const requestedItems = payload.items
        .map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
        }))
        .filter((item) => item.productId && Number.isFinite(item.quantity) && item.quantity > 0);

    if (requestedItems.length === 0) {
        throw new PosCoreError('INVALID_PAYLOAD', 'Los items enviados no son validos.', 400);
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
    const normalizedItems = normalizeSaleItems(payload.items);

    const existingSale = await findExistingSaleByClientReference(ctx, payload.clientReference);
    if (existingSale) {
        return serializeSale(existingSale, true);
    }

    try {
        return await executeWithRetry(async () => {
            return prisma.$transaction(async (tx) => {
                await ensureSaleAccess(tx, ctx, locationId);

                const productIds = normalizedItems.map((item) => item.productId);
                const [products, lockedInventories] = await Promise.all([
                    tx.product.findMany({
                        where: {
                            tenantId: ctx.tenantId,
                            deletedAt: null,
                            isActive: true,
                            id: {
                                in: productIds,
                            },
                        },
                        select: {
                            id: true,
                            name: true,
                            sku: true,
                            price: true,
                        },
                    }),
                    lockInventoryRows(tx, ctx.tenantId, locationId, productIds),
                ]);

                const productsById = new Map(products.map((product) => [product.id, product]));
                const inventoryByProductId = new Map(lockedInventories.map((inventory) => [inventory.productId, inventory]));
                const issues = buildInventoryIssues(normalizedItems, productsById, inventoryByProductId);

                if (issues.length > 0) {
                    throw new PosCoreError('INSUFFICIENT_STOCK', 'Uno o mas productos no tienen stock suficiente.', 409, {
                        issues,
                    });
                }

                const saleItems = normalizedItems.map((item) => {
                    const product = productsById.get(item.productId);
                    const inventory = inventoryByProductId.get(item.productId);

                    if (!product || !inventory) {
                        throw new PosCoreError('INVALID_STATE', 'El inventario bloqueado no coincide con el catalogo.', 500);
                    }

                    const unitPrice = toNumber(product.price);
                    return {
                        productId: item.productId,
                        name: product.name,
                        sku: product.sku,
                        quantity: item.quantity,
                        unitPrice,
                        subtotal: roundCurrency(unitPrice * item.quantity),
                        remainingStock: inventory.quantity - item.quantity,
                    };
                });

                const subtotal = roundCurrency(saleItems.reduce((total, item) => total + item.subtotal, 0));
                const tax = roundCurrency(subtotal * taxRate);
                const total = roundCurrency(subtotal + tax);
                const remainingStockByProductId = new Map(saleItems.map((item) => [item.productId, item.remainingStock]));

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
                        } as Prisma.InputJsonValue,
                        syncedAt: payload.offline ? new Date() : null,
                        items: {
                            create: saleItems.map((item) => ({
                                productId: item.productId,
                                quantity: item.quantity,
                                price: toDecimal(item.unitPrice),
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

                await Promise.all(
                    saleItems.map((item) => {
                        const inventory = inventoryByProductId.get(item.productId);

                        if (!inventory) {
                            throw new PosCoreError('INVALID_STATE', 'No se encontro el inventario bloqueado para actualizar.', 500);
                        }

                        return tx.inventory.update({
                            where: {
                                id: inventory.id,
                            },
                            data: {
                                quantity: item.remainingStock,
                            },
                        });
                    }),
                );

                await tx.inventoryMovement.createMany({
                    data: saleItems.map((item) => ({
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

                await createAuditLog(tx, ctx.tenantId, 'Sale', sale.id, 'pos.sale.completed', {
                    userId: ctx.userId,
                    locationId,
                    paymentMethod,
                    subtotal,
                    tax,
                    total,
                    itemCount: saleItems.length,
                    clientReference: payload.clientReference,
                    offline: payload.offline ?? false,
                });

                return serializeSale(sale, false, remainingStockByProductId);
            }, POS_TRANSACTION_OPTIONS);
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002' &&
            payload.clientReference
        ) {
            const duplicatedSale = await findExistingSaleByClientReference(ctx, payload.clientReference);
            if (duplicatedSale) {
                return serializeSale(duplicatedSale, true);
            }
        }

        throw error;
    }
};

export const cancelPosSale = async (
    ctx: VendixContext,
    saleId: string,
    payload?: PosCancelSaleRequest,
): Promise<PosCancelSaleResponse> => {
    requireRole(ctx, POS_CANCEL_ROLES);

    if (!saleId) {
        throw new PosCoreError('INVALID_PAYLOAD', 'saleId es obligatorio para cancelar la venta.', 400);
    }

    return executeWithRetry(async () => {
        return prisma.$transaction(async (tx) => {
            const sales = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
                SELECT id
                FROM "Sale"
                WHERE id = ${saleId}
                  AND "tenantId" = ${ctx.tenantId}
                FOR UPDATE
            `);

            if (sales.length === 0) {
                throw new PosCoreError('SALE_NOT_FOUND', 'La venta no existe para el tenant actual.', 404);
            }

            const sale = await tx.sale.findFirst({
                where: {
                    id: saleId,
                    tenantId: ctx.tenantId,
                },
                include: {
                    items: true,
                },
            });

            if (!sale) {
                throw new PosCoreError('SALE_NOT_FOUND', 'La venta no existe para el tenant actual.', 404);
            }

            if (sale.status === 'CANCELLED') {
                throw new PosCoreError('SALE_ALREADY_CANCELLED', 'La venta ya fue cancelada previamente.', 409);
            }

            await ensureSaleAccess(tx, ctx, sale.locationId);

            const productIds = sale.items.map((item) => item.productId);
            const lockedInventories = await lockInventoryRows(tx, ctx.tenantId, sale.locationId, productIds);
            const inventoryByProductId = new Map(lockedInventories.map((inventory) => [inventory.productId, inventory]));

            await Promise.all(
                sale.items.map(async (item) => {
                    const inventory = inventoryByProductId.get(item.productId);

                    if (inventory) {
                        await tx.inventory.update({
                            where: {
                                id: inventory.id,
                            },
                            data: {
                                quantity: inventory.quantity + item.quantity,
                            },
                        });
                        return;
                    }

                    await tx.inventory.create({
                        data: {
                            tenantId: ctx.tenantId,
                            productId: item.productId,
                            locationId: sale.locationId,
                            quantity: item.quantity,
                            minStock: 0,
                        },
                    });
                }),
            );

            await tx.sale.update({
                where: {
                    id: sale.id,
                },
                data: {
                    status: 'CANCELLED',
                },
            });

            await tx.inventoryMovement.createMany({
                data: sale.items.map((item) => ({
                    tenantId: ctx.tenantId,
                    productId: item.productId,
                    locationId: sale.locationId,
                    type: 'IN',
                    quantity: item.quantity,
                    reference: sale.id,
                    notes: payload?.reason ?? 'Venta cancelada',
                    createdBy: ctx.userId,
                })),
            });

            await createAuditLog(tx, ctx.tenantId, 'Sale', sale.id, 'pos.sale.cancelled', {
                userId: ctx.userId,
                reason: payload?.reason,
                restoredItems: sale.items.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                })),
            });

            return {
                id: sale.id,
                tenantId: ctx.tenantId,
                locationId: sale.locationId,
                userId: ctx.userId,
                status: 'CANCELLED',
                restoredItems: sale.items.length,
                cancelledAt: new Date().toISOString(),
            };
        }, POS_TRANSACTION_OPTIONS);
    });
};

export const syncOfflineSales = async (ctx: VendixContext, payload: PosSyncRequest): Promise<PosSyncResponse> => {
    requireRole(ctx, POS_WRITE_ROLES);

    if (!Array.isArray(payload.sales) || payload.sales.length === 0) {
        throw new PosCoreError('INVALID_PAYLOAD', 'No hay ventas offline para sincronizar.', 400);
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