import { Prisma } from '@prisma/client';
import { prisma } from './client';
import type {
    ID,
    PosCatalogItem,
    PosCatalogResponse,
    PosInventoryIssue,
    PosSaleCancellationResponse,
    PosSaleContext,
    PosSaleItemInput,
    PosSaleItemSummary,
    PosSaleRequest,
    PosSaleResponse,
} from '@vendix/types';

const POS_TRANSACTION_OPTIONS = {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 5_000,
    timeout: 10_000,
} as const;

const MAX_TRANSACTION_RETRIES = 3;
const DEFAULT_CATALOG_LIMIT = 24;
const MAX_CATALOG_LIMIT = 100;

type PosTransactionClient = Prisma.TransactionClient;

type CatalogProductRecord = {
    id: string;
    name: string;
    sku: string;
    category: string | null;
    price: Prisma.Decimal;
    barcode: string | null;
    qrCode: string | null;
    inventories: Array<{
        quantity: number;
        minStock: number;
    }>;
};

type LockedInventoryRow = {
    id: string;
    tenantId: string;
    productId: string;
    locationId: string;
    quantity: number;
    minStock: number;
};

type ProductSnapshot = {
    id: string;
    name: string;
    sku: string;
    price: Prisma.Decimal;
};

const decimalToNumber = (value: Prisma.Decimal | number | string) => {
    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'string') {
        return Number(value);
    }

    return Number(value.toString());
};

const roundMoney = (value: Prisma.Decimal | number | string) => {
    return Number(decimalToNumber(value).toFixed(2));
};

const normalizeCatalogLimit = (limit?: number) => {
    const normalized = Number.isFinite(limit) ? Math.trunc(limit as number) : DEFAULT_CATALOG_LIMIT;
    return Math.min(Math.max(normalized, 1), MAX_CATALOG_LIMIT);
};

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

    throw new Error('No fue posible completar la transacción de POS.');
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
            changes,
        },
    });
};

const ensurePositiveInteger = (value: unknown) => {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
};

const normalizeSaleItems = (items: PosSaleItemInput[]) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new PosProcessError('INVALID_PAYLOAD', 'Debes enviar al menos un producto para procesar la venta.', 400);
    }

    const mergedItems = new Map<string, PosSaleItemInput>();

    for (const item of items) {
        if (!item?.productId || !ensurePositiveInteger(item.quantity)) {
            throw new PosProcessError('INVALID_PAYLOAD', 'Cada item debe incluir productId y quantity entero mayor a cero.', 400);
        }

        const existing = mergedItems.get(item.productId);
        if (existing) {
            mergedItems.set(item.productId, {
                productId: item.productId,
                quantity: existing.quantity + item.quantity,
            });
            continue;
        }

        mergedItems.set(item.productId, {
            productId: item.productId,
            quantity: item.quantity,
        });
    }

    return Array.from(mergedItems.values());
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

const buildInventoryIssues = (
    items: PosSaleItemInput[],
    productsById: Map<string, ProductSnapshot>,
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
                productName: product.name,
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
                productName: product.name,
                sku: product.sku,
                requestedQuantity: item.quantity,
                availableQuantity: inventory.quantity,
                reason: 'INSUFFICIENT_STOCK',
            });
        }
    }

    return issues;
};

const assertContext = (context: PosSaleContext) => {
    if (!context.tenantId) {
        throw new PosProcessError('INVALID_CONTEXT', 'tenantId es obligatorio para procesar ventas.', 400);
    }

    if (!context.locationId) {
        throw new PosProcessError('INVALID_CONTEXT', 'locationId es obligatorio para procesar ventas.', 400);
    }

    if (!context.userId) {
        throw new PosProcessError('INVALID_CONTEXT', 'userId es obligatorio para procesar ventas.', 400);
    }
};

const assertPaymentMethod = (paymentMethod: string) => {
    if (!['CASH', 'TRANSFER', 'CARD', 'OTHER'].includes(paymentMethod)) {
        throw new PosProcessError('INVALID_PAYLOAD', 'paymentMethod es inválido.', 400);
    }
};

const ensureOperationalEntities = async (tx: PosTransactionClient, context: PosSaleContext) => {
    const [location, user] = await Promise.all([
        tx.location.findFirst({
            where: {
                id: context.locationId,
                tenantId: context.tenantId,
            },
            select: {
                id: true,
                name: true,
            },
        }),
        tx.user.findFirst({
            where: {
                id: context.userId,
                tenantId: context.tenantId,
                isActive: true,
            },
            select: {
                id: true,
                email: true,
            },
        }),
    ]);

    if (!location) {
        throw new PosProcessError('LOCATION_NOT_FOUND', 'La sucursal no existe para el tenant actual.', 404);
    }

    if (!user) {
        throw new PosProcessError('USER_NOT_FOUND', 'El usuario no existe o está inactivo para el tenant actual.', 404);
    }

    return { location, user };
};

const buildSaleItemSummaries = (
    items: PosSaleItemInput[],
    productsById: Map<string, ProductSnapshot>,
    inventoryByProductId: Map<string, LockedInventoryRow>,
) => {
    const saleItems: PosSaleItemSummary[] = [];
    let total = new Prisma.Decimal(0);

    for (const item of items) {
        const product = productsById.get(item.productId);
        const inventory = inventoryByProductId.get(item.productId);

        if (!product || !inventory) {
            throw new PosProcessError('INVALID_STATE', 'No fue posible construir la venta por inconsistencias de catálogo.', 500);
        }

        const lineTotal = product.price.mul(item.quantity);
        total = total.plus(lineTotal);

        saleItems.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: item.quantity,
            unitPrice: roundMoney(product.price),
            lineTotal: roundMoney(lineTotal),
            remainingStock: inventory.quantity - item.quantity,
        });
    }

    return {
        saleItems,
        total,
    };
};

const assertExpectedTotal = (expectedTotal: number | undefined, total: Prisma.Decimal) => {
    if (typeof expectedTotal !== 'number' || !Number.isFinite(expectedTotal)) {
        return;
    }

    const currentTotal = roundMoney(total);
    const normalizedExpected = Number(expectedTotal.toFixed(2));

    if (currentTotal !== normalizedExpected) {
        throw new PosProcessError('TOTAL_MISMATCH', 'El total enviado no coincide con el precio vigente del catálogo.', 409, {
            expectedTotal: normalizedExpected,
            currentTotal,
        });
    }
};

export class PosProcessError extends Error {
    code: string;
    status: number;
    details?: Record<string, unknown>;

    constructor(code: string, message: string, status: number, details?: Record<string, unknown>) {
        super(message);
        this.name = 'PosProcessError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

export const getPosCatalog = async (
    context: Pick<PosSaleContext, 'tenantId' | 'locationId'>,
    options?: {
        search?: string;
        limit?: number;
    },
): Promise<PosCatalogResponse> => {
    if (!context.tenantId) {
        throw new PosProcessError('INVALID_CONTEXT', 'tenantId es obligatorio para consultar catálogo POS.', 400);
    }

    if (!context.locationId) {
        throw new PosProcessError('INVALID_CONTEXT', 'locationId es obligatorio para consultar catálogo POS.', 400);
    }

    const search = options?.search?.trim();
    const limit = normalizeCatalogLimit(options?.limit);

    const products = await prisma.product.findMany({
        where: {
            tenantId: context.tenantId,
            deletedAt: null,
            isActive: true,
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { sku: { contains: search, mode: 'insensitive' } },
                        { barcode: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        },
        orderBy: {
            name: 'asc',
        },
        take: limit,
        include: {
            inventories: {
                where: {
                    tenantId: context.tenantId,
                    locationId: context.locationId,
                },
                select: {
                    quantity: true,
                    minStock: true,
                },
            },
        },
    });

    const data: PosCatalogItem[] = products.map((product: CatalogProductRecord) => {
        const inventory = product.inventories[0];
        const availableStock = inventory?.quantity ?? 0;
        const minStock = inventory?.minStock ?? 0;

        return {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            category: product.category ?? undefined,
            price: roundMoney(product.price),
            barcode: product.barcode ?? undefined,
            qrCode: product.qrCode ?? undefined,
            availableStock,
            minStock,
            isLowStock: availableStock <= minStock,
        };
    });

    return {
        data,
        locationId: context.locationId,
        total: data.length,
        generatedAt: new Date().toISOString(),
    };
};

export const processPosSale = async (
    context: PosSaleContext,
    payload: PosSaleRequest,
): Promise<PosSaleResponse> => {
    assertContext(context);
    assertPaymentMethod(payload.paymentMethod);

    const items = normalizeSaleItems(payload.items);

    return executeWithRetry(async () => {
        return prisma.$transaction(async (tx) => {
            await ensureOperationalEntities(tx, context);

            const productIds = items.map((item) => item.productId);
            const [products, lockedInventoryRows] = await Promise.all([
                tx.product.findMany({
                    where: {
                        tenantId: context.tenantId,
                        id: {
                            in: productIds,
                        },
                        deletedAt: null,
                        isActive: true,
                    },
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        price: true,
                    },
                }),
                lockInventoryRows(tx, context.tenantId, context.locationId, productIds),
            ]);

            const productsById = new Map(products.map((product) => [product.id, product]));
            const inventoryByProductId = new Map(lockedInventoryRows.map((inventory) => [inventory.productId, inventory]));
            const inventoryIssues = buildInventoryIssues(items, productsById, inventoryByProductId);

            if (inventoryIssues.length > 0) {
                throw new PosProcessError('INSUFFICIENT_STOCK', 'Uno o más productos no tienen stock suficiente.', 409, {
                    inventoryIssues,
                });
            }

            const { saleItems, total } = buildSaleItemSummaries(items, productsById, inventoryByProductId);
            assertExpectedTotal(payload.expectedTotal, total);

            const sale = await tx.sale.create({
                data: {
                    tenantId: context.tenantId,
                    locationId: context.locationId,
                    userId: context.userId,
                    status: 'COMPLETED',
                    total,
                    paymentMethod: payload.paymentMethod,
                },
            });

            await tx.saleItem.createMany({
                data: saleItems.map((item) => ({
                    saleId: sale.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.unitPrice,
                })),
            });

            await Promise.all(
                saleItems.map((item) => {
                    const inventory = inventoryByProductId.get(item.productId);

                    if (!inventory) {
                        throw new PosProcessError('INVALID_STATE', 'Inventario bloqueado no encontrado para actualización.', 500);
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
                    tenantId: context.tenantId,
                    productId: item.productId,
                    locationId: context.locationId,
                    type: 'OUT',
                    quantity: item.quantity,
                    reference: sale.id,
                    notes: payload.notes,
                    createdBy: context.userId,
                })),
            });

            await createAuditLog(tx, context.tenantId, 'Sale', sale.id, 'pos.sale.completed', {
                userId: context.userId,
                locationId: context.locationId,
                paymentMethod: payload.paymentMethod,
                notes: payload.notes,
                items: saleItems,
                total: roundMoney(total),
            });

            return {
                saleId: sale.id,
                tenantId: context.tenantId,
                locationId: context.locationId,
                userId: context.userId,
                status: sale.status,
                paymentMethod: sale.paymentMethod,
                total: roundMoney(total),
                items: saleItems,
                createdAt: sale.createdAt.toISOString(),
            };
        }, POS_TRANSACTION_OPTIONS);
    });
};

export const cancelPosSale = async (
    context: PosSaleContext,
    saleId: ID,
    reason?: string,
): Promise<PosSaleCancellationResponse> => {
    assertContext(context);

    if (!saleId) {
        throw new PosProcessError('INVALID_PAYLOAD', 'saleId es obligatorio para cancelar la venta.', 400);
    }

    return executeWithRetry(async () => {
        return prisma.$transaction(async (tx) => {
            await ensureOperationalEntities(tx, context);

            const sales = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
                SELECT id
                FROM "Sale"
                WHERE id = ${saleId}
                  AND "tenantId" = ${context.tenantId}
                FOR UPDATE
            `);

            if (sales.length === 0) {
                throw new PosProcessError('SALE_NOT_FOUND', 'La venta no existe para el tenant actual.', 404);
            }

            const sale = await tx.sale.findFirst({
                where: {
                    id: saleId,
                    tenantId: context.tenantId,
                },
                include: {
                    items: true,
                },
            });

            if (!sale) {
                throw new PosProcessError('SALE_NOT_FOUND', 'La venta no existe para el tenant actual.', 404);
            }

            if (sale.status === 'CANCELLED') {
                throw new PosProcessError('SALE_ALREADY_CANCELLED', 'La venta ya fue cancelada previamente.', 409);
            }

            const productIds = sale.items.map((item) => item.productId);
            const lockedInventoryRows = await lockInventoryRows(tx, context.tenantId, sale.locationId, productIds);
            const inventoryByProductId = new Map(lockedInventoryRows.map((inventory) => [inventory.productId, inventory]));

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
                            tenantId: context.tenantId,
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
                    tenantId: context.tenantId,
                    productId: item.productId,
                    locationId: sale.locationId,
                    type: 'IN',
                    quantity: item.quantity,
                    reference: sale.id,
                    notes: reason ?? 'Venta cancelada',
                    createdBy: context.userId,
                })),
            });

            await createAuditLog(tx, context.tenantId, 'Sale', sale.id, 'pos.sale.cancelled', {
                userId: context.userId,
                reason,
                restoredItems: sale.items.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                })),
            });

            return {
                saleId: sale.id,
                tenantId: context.tenantId,
                locationId: sale.locationId,
                status: 'CANCELLED',
                restoredItems: sale.items.length,
                cancelledAt: new Date().toISOString(),
            };
        }, POS_TRANSACTION_OPTIONS);
    });
};