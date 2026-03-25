import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { prisma, Prisma, MovementType } from '@vendix/database';
import type {
    ID,
    InventoryAlert,
    InventoryBatchRequest,
    InventoryBatchUpdateInput,
    InventoryListItem,
    InventoryListResponse,
    InventoryLocationStock,
    InventoryMovementInput,
    InventoryMovementRecord,
    InventoryProductDetail,
    InventoryTransferInput,
} from '@vendix/types';
import { getVendixContext, hasAnyRole } from '@vendix/utils';

const app = new Hono();

const READ_ROLES = ['ADMIN', 'SELLER', 'DASHBOARD', 'POS'];
const WRITE_ROLES = ['ADMIN'];
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

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

const parseInteger = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (value: string | undefined) => value === 'true' || value === '1';

const normalizePageSize = (value: string | undefined) => {
    const pageSize = parseInteger(value, DEFAULT_PAGE_SIZE);
    return Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
};

const errorResponse = (message: string, status = 400, details?: unknown) => {
    return { error: message, details, status };
};

const ensureRoles = (ctx: ReturnType<typeof getVendixContext>, roles: string[]) => {
    return hasAnyRole(ctx, roles);
};

const parseCsvLine = (line: string) => {
    const cells: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];

        if (char === '"') {
            const nextChar = line[index + 1];
            if (insideQuotes && nextChar === '"') {
                current += '"';
                index += 1;
            } else {
                insideQuotes = !insideQuotes;
            }
            continue;
        }

        if (char === ',' && !insideQuotes) {
            cells.push(current.trim());
            current = '';
            continue;
        }

        current += char;
    }

    cells.push(current.trim());
    return cells;
};

const csvEscape = (value: string | number | undefined) => {
    const normalized = value == null ? '' : String(value);
    if (!normalized.includes(',') && !normalized.includes('"') && !normalized.includes('\n')) {
        return normalized;
    }
    return `"${normalized.replace(/"/g, '""')}"`;
};

const serializeLocationStock = (inventory: {
    locationId: string;
    quantity: number;
    minStock: number;
    location: { id: string; name: string; type: string };
}): InventoryLocationStock => ({
    locationId: inventory.locationId,
    locationName: inventory.location.name,
    locationType: inventory.location.type,
    quantity: inventory.quantity,
    minStock: inventory.minStock,
    isLowStock: inventory.quantity <= inventory.minStock,
});

const serializeMovement = (movement: {
    id: string;
    type: MovementType;
    quantity: number;
    reference: string | null;
    notes: string | null;
    createdBy: string | null;
    createdAt: Date;
    productId: string;
    product: { name: string; sku: string };
    locationId: string | null;
    location: { name: string } | null;
    sourceLocationId: string | null;
    sourceLocation: { name: string } | null;
    destinationLocationId: string | null;
    destinationLocation: { name: string } | null;
}): InventoryMovementRecord => ({
    id: movement.id,
    productId: movement.productId,
    productName: movement.product.name,
    sku: movement.product.sku,
    type: movement.type,
    quantity: movement.quantity,
    reference: movement.reference ?? undefined,
    notes: movement.notes ?? undefined,
    locationId: movement.locationId ?? undefined,
    locationName: movement.location?.name,
    sourceLocationId: movement.sourceLocationId ?? undefined,
    sourceLocationName: movement.sourceLocation?.name,
    destinationLocationId: movement.destinationLocationId ?? undefined,
    destinationLocationName: movement.destinationLocation?.name,
    createdBy: movement.createdBy ?? undefined,
    createdAt: movement.createdAt.toISOString(),
});

const serializeInventoryItem = (product: {
    id: string;
    name: string;
    sku: string;
    category: string | null;
    price: Prisma.Decimal;
    barcode: string | null;
    qrCode: string | null;
    inventories: Array<{
        locationId: string;
        quantity: number;
        minStock: number;
        location: { id: string; name: string; type: string };
    }>;
}): InventoryListItem => {
    const stockByLocation = product.inventories.map(serializeLocationStock);
    const stockTotal = stockByLocation.reduce((total, stock) => total + stock.quantity, 0);
    const minStock = stockByLocation.reduce((currentMin, stock) => {
        return currentMin === 0 ? stock.minStock : Math.min(currentMin, stock.minStock);
    }, 0);

    return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category ?? undefined,
        price: toNumber(product.price),
        barcode: product.barcode ?? undefined,
        qrCode: product.qrCode ?? undefined,
        stockTotal,
        minStock,
        isLowStock: stockByLocation.some((stock) => stock.isLowStock),
        stockByLocation,
    };
};

const createAuditLog = async (
    tx: Prisma.TransactionClient,
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

const ensureProduct = async (tenantId: string, productId: string) => {
    const product = await prisma.product.findFirst({
        where: {
            id: productId,
            tenantId,
            deletedAt: null,
        },
    });

    if (!product) {
        throw new Error('Producto no encontrado para el tenant actual.');
    }

    return product;
};

const ensureLocation = async (tenantId: string, locationId: string) => {
    const location = await prisma.location.findFirst({
        where: {
            id: locationId,
            tenantId,
        },
    });

    if (!location) {
        throw new Error('Sucursal no encontrada para el tenant actual.');
    }

    return location;
};

const getInventoryRecord = async (tenantId: string, productId: string, locationId: string) => {
    return prisma.inventory.findFirst({
        where: {
            tenantId,
            productId,
            locationId,
        },
    });
};

const buildInventoryCsv = (rows: InventoryListItem[]) => {
    const headers = [
        'productId',
        'name',
        'sku',
        'category',
        'price',
        'stockTotal',
        'locationName',
        'locationId',
        'locationType',
        'locationStock',
        'minStock',
    ];

    const lines = rows.flatMap((row) => {
        if (row.stockByLocation.length === 0) {
            return [[
                row.id,
                row.name,
                row.sku,
                row.category ?? '',
                row.price,
                row.stockTotal,
                '',
                '',
                '',
                0,
                row.minStock,
            ]];
        }

        return row.stockByLocation.map((stock) => [
            row.id,
            row.name,
            row.sku,
            row.category ?? '',
            row.price,
            row.stockTotal,
            stock.locationName,
            stock.locationId,
            stock.locationType,
            stock.quantity,
            stock.minStock,
        ]);
    });

    return [headers, ...lines].map((line) => line.map(csvEscape).join(',')).join('\n');
};

app.get('/inventory', async (c) => {
    const ctx = getVendixContext(c.req);
    if (!ensureRoles(ctx, READ_ROLES)) {
        return c.json(errorResponse('No tienes permisos para consultar inventario.', 403), 403);
    }

    try {
        const page = Math.max(parseInteger(c.req.query('page'), 1), 1);
        const pageSize = normalizePageSize(c.req.query('pageSize'));
        const offset = (page - 1) * pageSize;
        const search = c.req.query('search')?.trim();
        const category = c.req.query('category')?.trim();
        const locationId = c.req.query('locationId')?.trim();
        const lowStockOnly = parseBoolean(c.req.query('lowStock'));

        const where: Prisma.ProductWhereInput = {
            tenantId: ctx.tenantId,
            deletedAt: null,
            ...(category
                ? {
                      category: {
                          equals: category,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(search
                ? {
                      OR: [
                          { name: { contains: search, mode: 'insensitive' } },
                          { sku: { contains: search, mode: 'insensitive' } },
                          { barcode: { contains: search, mode: 'insensitive' } },
                      ],
                  }
                : {}),
        };

        const query = {
            where,
            orderBy: { updatedAt: 'desc' as const },
            include: {
                inventories: {
                    where: {
                        tenantId: ctx.tenantId,
                        ...(locationId ? { locationId } : {}),
                    },
                    include: {
                        location: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                            },
                        },
                    },
                },
            },
        };

        let rows: InventoryListItem[];
        let total = 0;

        if (lowStockOnly) {
            const products = await prisma.product.findMany(query);
            const filtered = products.map(serializeInventoryItem).filter((row) => row.isLowStock);
            total = filtered.length;
            rows = filtered.slice(offset, offset + pageSize);
        } else {
            const [products, count] = await prisma.$transaction([
                prisma.product.findMany({
                    ...query,
                    skip: offset,
                    take: pageSize,
                }),
                prisma.product.count({ where }),
            ]);
            rows = products.map(serializeInventoryItem);
            total = count;
        }

        const response: InventoryListResponse = {
            data: rows,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.max(Math.ceil(total / pageSize), 1),
            },
        };

        return c.json(response);
    } catch (error) {
        return c.json(errorResponse('No fue posible cargar el inventario.', 500, String(error)), 500);
    }
});

app.get('/inventory/low-stock', async (c) => {
    const ctx = getVendixContext(c.req);
    if (!ensureRoles(ctx, READ_ROLES)) {
        return c.json(errorResponse('No tienes permisos para consultar alertas.', 403), 403);
    }

    try {
        const locationId = c.req.query('locationId')?.trim();
        const inventories = await prisma.inventory.findMany({
            where: {
                tenantId: ctx.tenantId,
                ...(locationId ? { locationId } : {}),
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                    },
                },
                location: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: [{ quantity: 'asc' }, { updatedAt: 'asc' }],
        });

        const alerts: InventoryAlert[] = inventories
            .filter((inventory) => inventory.quantity <= inventory.minStock)
            .map((inventory) => ({
                id: `${inventory.productId}:${inventory.locationId}`,
                productId: inventory.product.id,
                productName: inventory.product.name,
                sku: inventory.product.sku,
                locationId: inventory.location.id,
                locationName: inventory.location.name,
                quantity: inventory.quantity,
                minStock: inventory.minStock,
                severity: inventory.quantity === 0 ? 'critical' : 'warning',
            }));

        return c.json({ data: alerts, total: alerts.length });
    } catch (error) {
        return c.json(errorResponse('No fue posible cargar las alertas de bajo stock.', 500, String(error)), 500);
    }
});

app.get('/inventory/:productId', async (c) => {
    const ctx = getVendixContext(c.req);
    if (!ensureRoles(ctx, READ_ROLES)) {
        return c.json(errorResponse('No tienes permisos para consultar el producto.', 403), 403);
    }

    try {
        const productId = c.req.param('productId');
        const product = await prisma.product.findFirst({
            where: {
                id: productId,
                tenantId: ctx.tenantId,
                deletedAt: null,
            },
            include: {
                inventories: {
                    where: {
                        tenantId: ctx.tenantId,
                    },
                    include: {
                        location: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                            },
                        },
                    },
                },
                movements: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 25,
                    include: {
                        product: {
                            select: {
                                name: true,
                                sku: true,
                            },
                        },
                        location: {
                            select: {
                                name: true,
                            },
                        },
                        sourceLocation: {
                            select: {
                                name: true,
                            },
                        },
                        destinationLocation: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!product) {
            return c.json(errorResponse('Producto no encontrado.', 404), 404);
        }

        const detail: InventoryProductDetail = {
            ...serializeInventoryItem(product),
            movements: product.movements.map(serializeMovement),
        };

        return c.json(detail);
    } catch (error) {
        return c.json(errorResponse('No fue posible cargar el detalle del producto.', 500, String(error)), 500);
    }
});

app.post('/inventory/movement', async (c) => {
    const ctx = getVendixContext(c.req);
    if (!ensureRoles(ctx, WRITE_ROLES)) {
        return c.json(errorResponse('Solo ADMIN puede registrar movimientos.', 403), 403);
    }

    try {
        const payload = (await c.req.json()) as InventoryMovementInput;
        const quantity = Number(payload.quantity);

        if (!payload.productId || !payload.locationId || !payload.type || !Number.isFinite(quantity) || quantity === 0) {
            return c.json(errorResponse('Payload de movimiento inválido.'), 400);
        }

        if (payload.type === 'TRANSFER') {
            return c.json(errorResponse('Usa el endpoint /inventory/transfer para transferencias.'), 400);
        }

        await ensureProduct(ctx.tenantId, payload.productId);
        await ensureLocation(ctx.tenantId, payload.locationId);

        const result = await prisma.$transaction(async (tx) => {
            const existingInventory = await tx.inventory.findFirst({
                where: {
                    tenantId: ctx.tenantId,
                    productId: payload.productId,
                    locationId: payload.locationId,
                },
            });

            const currentQuantity = existingInventory?.quantity ?? 0;
            const normalizedQuantity = Math.abs(quantity);
            const delta = payload.type === 'IN'
                ? normalizedQuantity
                : payload.type === 'OUT'
                    ? -normalizedQuantity
                    : quantity;

            const nextQuantity = currentQuantity + delta;
            if (nextQuantity < 0) {
                throw new Error('La operación dejaría stock negativo.');
            }

            const inventory = await tx.inventory.upsert({
                where: {
                    productId_locationId: {
                        productId: payload.productId,
                        locationId: payload.locationId,
                    },
                },
                update: {
                    quantity: nextQuantity,
                    ...(typeof payload.minStock === 'number' ? { minStock: payload.minStock } : {}),
                },
                create: {
                    tenantId: ctx.tenantId,
                    productId: payload.productId,
                    locationId: payload.locationId,
                    quantity: nextQuantity,
                    minStock: payload.minStock ?? 5,
                },
            });

            const movement = await tx.inventoryMovement.create({
                data: {
                    tenantId: ctx.tenantId,
                    productId: payload.productId,
                    locationId: payload.locationId,
                    type: payload.type,
                    quantity: payload.type === 'ADJUSTMENT' ? quantity : normalizedQuantity,
                    reference: payload.reference,
                    notes: payload.notes,
                    createdBy: ctx.userId,
                },
                include: {
                    product: {
                        select: {
                            name: true,
                            sku: true,
                        },
                    },
                    location: {
                        select: {
                            name: true,
                        },
                    },
                    sourceLocation: {
                        select: {
                            name: true,
                        },
                    },
                    destinationLocation: {
                        select: {
                            name: true,
                        },
                    },
                },
            });

            await createAuditLog(tx, ctx.tenantId, 'Inventory', inventory.id, 'inventory.movement.created', {
                userId: ctx.userId,
                payload,
                previousQuantity: currentQuantity,
                nextQuantity,
            });

            return {
                inventory,
                movement: serializeMovement(movement),
            };
        });

        return c.json(result, 201);
    } catch (error) {
        return c.json(errorResponse('No fue posible registrar el movimiento.', 400, String(error)), 400);
    }
});

app.post('/inventory/transfer', async (c) => {
    const ctx = getVendixContext(c.req);
    if (!ensureRoles(ctx, WRITE_ROLES)) {
        return c.json(errorResponse('Solo ADMIN puede transferir inventario.', 403), 403);
    }

    try {
        const payload = (await c.req.json()) as InventoryTransferInput;
        const quantity = Math.abs(Number(payload.quantity));

        if (!payload.productId || !payload.sourceLocationId || !payload.destinationLocationId || !Number.isFinite(quantity) || quantity <= 0) {
            return c.json(errorResponse('Payload de transferencia inválido.'), 400);
        }

        if (payload.sourceLocationId === payload.destinationLocationId) {
            return c.json(errorResponse('La sucursal origen y destino deben ser distintas.'), 400);
        }

        await Promise.all([
            ensureProduct(ctx.tenantId, payload.productId),
            ensureLocation(ctx.tenantId, payload.sourceLocationId),
            ensureLocation(ctx.tenantId, payload.destinationLocationId),
        ]);

        const result = await prisma.$transaction(async (tx) => {
            const sourceInventory = await tx.inventory.findFirst({
                where: {
                    tenantId: ctx.tenantId,
                    productId: payload.productId,
                    locationId: payload.sourceLocationId,
                },
            });

            if (!sourceInventory || sourceInventory.quantity < quantity) {
                throw new Error('Stock insuficiente en la sucursal de origen.');
            }

            const destinationInventory = await tx.inventory.findFirst({
                where: {
                    tenantId: ctx.tenantId,
                    productId: payload.productId,
                    locationId: payload.destinationLocationId,
                },
            });

            const updatedSource = await tx.inventory.update({
                where: {
                    id: sourceInventory.id,
                },
                data: {
                    quantity: sourceInventory.quantity - quantity,
                },
            });

            const updatedDestination = await tx.inventory.upsert({
                where: {
                    productId_locationId: {
                        productId: payload.productId,
                        locationId: payload.destinationLocationId,
                    },
                },
                update: {
                    quantity: (destinationInventory?.quantity ?? 0) + quantity,
                },
                create: {
                    tenantId: ctx.tenantId,
                    productId: payload.productId,
                    locationId: payload.destinationLocationId,
                    quantity,
                    minStock: destinationInventory?.minStock ?? sourceInventory.minStock,
                },
            });

            const movements = await tx.inventoryMovement.createMany({
                data: [
                    {
                        tenantId: ctx.tenantId,
                        productId: payload.productId,
                        locationId: payload.sourceLocationId,
                        sourceLocationId: payload.sourceLocationId,
                        destinationLocationId: payload.destinationLocationId,
                        type: 'TRANSFER',
                        quantity,
                        reference: payload.reference,
                        notes: payload.notes,
                        createdBy: ctx.userId,
                    },
                    {
                        tenantId: ctx.tenantId,
                        productId: payload.productId,
                        locationId: payload.destinationLocationId,
                        sourceLocationId: payload.sourceLocationId,
                        destinationLocationId: payload.destinationLocationId,
                        type: 'TRANSFER',
                        quantity,
                        reference: payload.reference,
                        notes: payload.notes,
                        createdBy: ctx.userId,
                    },
                ],
            });

            await createAuditLog(tx, ctx.tenantId, 'Inventory', payload.productId, 'inventory.transfer.created', {
                userId: ctx.userId,
                payload,
                sourcePreviousQuantity: sourceInventory.quantity,
                sourceNextQuantity: updatedSource.quantity,
                destinationPreviousQuantity: destinationInventory?.quantity ?? 0,
                destinationNextQuantity: updatedDestination.quantity,
                movementCount: movements.count,
            });

            return {
                sourceInventory: updatedSource,
                destinationInventory: updatedDestination,
            };
        });

        return c.json(result, 201);
    } catch (error) {
        return c.json(errorResponse('No fue posible completar la transferencia.', 400, String(error)), 400);
    }
});

app.post('/inventory/batch', async (c) => {
    const ctx = getVendixContext(c.req);
    if (!ensureRoles(ctx, WRITE_ROLES)) {
        return c.json(errorResponse('Solo ADMIN puede ejecutar operaciones masivas.', 403), 403);
    }

    try {
        const payload = (await c.req.json()) as InventoryBatchRequest;

        if (payload.action === 'export') {
            const products = await prisma.product.findMany({
                where: {
                    tenantId: ctx.tenantId,
                    deletedAt: null,
                },
                orderBy: {
                    name: 'asc',
                },
                include: {
                    inventories: {
                        where: {
                            tenantId: ctx.tenantId,
                        },
                        include: {
                            location: {
                                select: {
                                    id: true,
                                    name: true,
                                    type: true,
                                },
                            },
                        },
                    },
                },
            });

            const csv = buildInventoryCsv(products.map(serializeInventoryItem));
            return c.json({ action: 'export', count: products.length, csv });
        }

        if (payload.action === 'update') {
            const items = payload.items ?? [];
            if (items.length === 0) {
                return c.json(errorResponse('Debes enviar items para actualización masiva.'), 400);
            }

            const result = await prisma.$transaction(async (tx) => {
                const updatedItems: InventoryBatchUpdateInput[] = [];

                for (const item of items) {
                    const product = item.productId
                        ? await tx.product.findFirst({ where: { id: item.productId, tenantId: ctx.tenantId, deletedAt: null } })
                        : item.sku
                            ? await tx.product.findFirst({ where: { sku: item.sku, tenantId: ctx.tenantId, deletedAt: null } })
                            : null;

                    if (!product) {
                        throw new Error(`Producto no encontrado para item ${item.sku ?? item.productId ?? 'sin identificador'}.`);
                    }

                    if (typeof item.price === 'number' || typeof item.category === 'string') {
                        await tx.product.update({
                            where: { id: product.id },
                            data: {
                                ...(typeof item.price === 'number' ? { price: item.price } : {}),
                                ...(typeof item.category === 'string' ? { category: item.category } : {}),
                            },
                        });
                    }

                    if (item.locationId && (typeof item.quantity === 'number' || typeof item.minStock === 'number')) {
                        await ensureLocation(ctx.tenantId, item.locationId);
                        await tx.inventory.upsert({
                            where: {
                                productId_locationId: {
                                    productId: product.id,
                                    locationId: item.locationId,
                                },
                            },
                            update: {
                                ...(typeof item.quantity === 'number' ? { quantity: item.quantity } : {}),
                                ...(typeof item.minStock === 'number' ? { minStock: item.minStock } : {}),
                            },
                            create: {
                                tenantId: ctx.tenantId,
                                productId: product.id,
                                locationId: item.locationId,
                                quantity: item.quantity ?? 0,
                                minStock: item.minStock ?? 5,
                            },
                        });
                    }

                    updatedItems.push({
                        ...item,
                        productId: product.id,
                    });
                }

                await createAuditLog(tx, ctx.tenantId, 'Inventory', ctx.tenantId, 'inventory.batch.updated', {
                    userId: ctx.userId,
                    itemCount: updatedItems.length,
                });

                return updatedItems;
            });

            return c.json({ action: 'update', count: result.length, items: result });
        }

        if (payload.action === 'import') {
            if (!payload.csvContent?.trim()) {
                return c.json(errorResponse('Debes enviar csvContent para importar.'), 400);
            }

            const lines = payload.csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
            if (lines.length < 2) {
                return c.json(errorResponse('El CSV no contiene filas de datos.'), 400);
            }

            const headers = parseCsvLine(lines[0]).map((header) => header.trim());
            const requiredHeaders = ['sku', 'name', 'price', 'locationId', 'quantity'];
            const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
            if (missingHeaders.length > 0) {
                return c.json(errorResponse('Faltan columnas requeridas en el CSV.', 400, missingHeaders), 400);
            }

            const imported = await prisma.$transaction(async (tx) => {
                let importedCount = 0;

                for (const line of lines.slice(1)) {
                    const cells = parseCsvLine(line);
                    const row = headers.reduce<Record<string, string>>((accumulator, header, index) => {
                        accumulator[header] = cells[index] ?? '';
                        return accumulator;
                    }, {});

                    const locationId = row.locationId;
                    await ensureLocation(ctx.tenantId, locationId);

                    const product = await tx.product.upsert({
                        where: {
                            tenantId_sku: {
                                tenantId: ctx.tenantId,
                                sku: row.sku,
                            },
                        },
                        update: {
                            name: row.name,
                            price: Number(row.price),
                            category: row.category || null,
                            barcode: row.barcode || null,
                            qrCode: row.qrCode || null,
                            isActive: true,
                        },
                        create: {
                            tenantId: ctx.tenantId,
                            name: row.name,
                            sku: row.sku,
                            category: row.category || null,
                            price: Number(row.price),
                            barcode: row.barcode || null,
                            qrCode: row.qrCode || null,
                        },
                    });

                    await tx.inventory.upsert({
                        where: {
                            productId_locationId: {
                                productId: product.id,
                                locationId,
                            },
                        },
                        update: {
                            quantity: Number(row.quantity),
                            minStock: Number(row.minStock || 5),
                        },
                        create: {
                            tenantId: ctx.tenantId,
                            productId: product.id,
                            locationId,
                            quantity: Number(row.quantity),
                            minStock: Number(row.minStock || 5),
                        },
                    });

                    importedCount += 1;
                }

                await createAuditLog(tx, ctx.tenantId, 'Inventory', ctx.tenantId, 'inventory.batch.imported', {
                    userId: ctx.userId,
                    importedCount,
                });

                return importedCount;
            });

            return c.json({ action: 'import', imported });
        }

        return c.json(errorResponse('Acción batch no soportada.'), 400);
    } catch (error) {
        return c.json(errorResponse('No fue posible ejecutar la operación masiva.', 400, String(error)), 400);
    }
});

app.get('/health', (c) => {
    return c.json({ status: 'ok' });
});

const port = Number(process.env.PORT ?? 3003);

if (import.meta.url === `file://${process.argv[1]}`) {
    serve({ fetch: app.fetch, port });
    console.log(`inventory-service running on http://localhost:${port}`);
}

export default app;
