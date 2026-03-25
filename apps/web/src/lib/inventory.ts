import type {
    InventoryAlert,
    InventoryListItem,
    InventoryLocationStock,
    InventoryMovementRecord,
    InventoryProductDetail,
} from '@vendix/types';

export const inventoryLocations = [
    { id: 'loc-store-central', name: 'Tienda Central', type: 'STORE' },
    { id: 'loc-store-norte', name: 'Sucursal Norte', type: 'STORE' },
    { id: 'loc-warehouse-main', name: 'Bodega Principal', type: 'WAREHOUSE' },
];

const inventoryCatalog: InventoryProductDetail[] = [
    {
        id: 'prod-vdx-001',
        name: 'Terminal SmartPOS VDX One',
        sku: 'VDX-POS-001',
        category: 'POS',
        price: 449.9,
        barcode: '770100100001',
        qrCode: 'VDX-QR-001',
        stockTotal: 41,
        minStock: 6,
        isLowStock: false,
        stockByLocation: [
            { locationId: 'loc-store-central', locationName: 'Tienda Central', locationType: 'STORE', quantity: 11, minStock: 4, isLowStock: false },
            { locationId: 'loc-store-norte', locationName: 'Sucursal Norte', locationType: 'STORE', quantity: 7, minStock: 2, isLowStock: false },
            { locationId: 'loc-warehouse-main', locationName: 'Bodega Principal', locationType: 'WAREHOUSE', quantity: 23, minStock: 6, isLowStock: false },
        ],
        movements: [
            { id: 'mov-001', productId: 'prod-vdx-001', productName: 'Terminal SmartPOS VDX One', sku: 'VDX-POS-001', type: 'IN', quantity: 18, locationId: 'loc-warehouse-main', locationName: 'Bodega Principal', reference: 'PO-2048', createdBy: 'u-admin', createdAt: '2026-03-22T09:10:00.000Z' },
            { id: 'mov-002', productId: 'prod-vdx-001', productName: 'Terminal SmartPOS VDX One', sku: 'VDX-POS-001', type: 'TRANSFER', quantity: 5, locationId: 'loc-store-central', locationName: 'Tienda Central', sourceLocationId: 'loc-warehouse-main', sourceLocationName: 'Bodega Principal', destinationLocationId: 'loc-store-central', destinationLocationName: 'Tienda Central', reference: 'TR-0091', createdBy: 'u-admin', createdAt: '2026-03-23T11:00:00.000Z' },
            { id: 'mov-003', productId: 'prod-vdx-001', productName: 'Terminal SmartPOS VDX One', sku: 'VDX-POS-001', type: 'OUT', quantity: 2, locationId: 'loc-store-central', locationName: 'Tienda Central', reference: 'SALE-1904', createdBy: 'u-pos-1', createdAt: '2026-03-24T10:25:00.000Z' },
        ],
    },
    {
        id: 'prod-vdx-002',
        name: 'Escaner Zebra Fusion',
        sku: 'VDX-SCN-002',
        category: 'Accesorios',
        price: 129.5,
        barcode: '770100100002',
        qrCode: 'VDX-QR-002',
        stockTotal: 14,
        minStock: 5,
        isLowStock: true,
        stockByLocation: [
            { locationId: 'loc-store-central', locationName: 'Tienda Central', locationType: 'STORE', quantity: 3, minStock: 3, isLowStock: true },
            { locationId: 'loc-store-norte', locationName: 'Sucursal Norte', locationType: 'STORE', quantity: 1, minStock: 2, isLowStock: true },
            { locationId: 'loc-warehouse-main', locationName: 'Bodega Principal', locationType: 'WAREHOUSE', quantity: 10, minStock: 5, isLowStock: false },
        ],
        movements: [
            { id: 'mov-004', productId: 'prod-vdx-002', productName: 'Escaner Zebra Fusion', sku: 'VDX-SCN-002', type: 'OUT', quantity: 4, locationId: 'loc-store-central', locationName: 'Tienda Central', reference: 'SALE-1901', createdBy: 'u-pos-2', createdAt: '2026-03-24T08:15:00.000Z' },
            { id: 'mov-005', productId: 'prod-vdx-002', productName: 'Escaner Zebra Fusion', sku: 'VDX-SCN-002', type: 'TRANSFER', quantity: 2, locationId: 'loc-store-norte', locationName: 'Sucursal Norte', sourceLocationId: 'loc-warehouse-main', sourceLocationName: 'Bodega Principal', destinationLocationId: 'loc-store-norte', destinationLocationName: 'Sucursal Norte', reference: 'TR-0090', createdBy: 'u-admin', createdAt: '2026-03-23T14:40:00.000Z' },
        ],
    },
    {
        id: 'prod-vdx-003',
        name: 'Impresora Termica CloudPrint',
        sku: 'VDX-PRN-003',
        category: 'POS',
        price: 189,
        barcode: '770100100003',
        qrCode: 'VDX-QR-003',
        stockTotal: 9,
        minStock: 4,
        isLowStock: true,
        stockByLocation: [
            { locationId: 'loc-store-central', locationName: 'Tienda Central', locationType: 'STORE', quantity: 2, minStock: 2, isLowStock: true },
            { locationId: 'loc-store-norte', locationName: 'Sucursal Norte', locationType: 'STORE', quantity: 0, minStock: 1, isLowStock: true },
            { locationId: 'loc-warehouse-main', locationName: 'Bodega Principal', locationType: 'WAREHOUSE', quantity: 7, minStock: 4, isLowStock: false },
        ],
        movements: [
            { id: 'mov-006', productId: 'prod-vdx-003', productName: 'Impresora Termica CloudPrint', sku: 'VDX-PRN-003', type: 'OUT', quantity: 3, locationId: 'loc-store-central', locationName: 'Tienda Central', reference: 'SALE-1899', createdBy: 'u-pos-1', createdAt: '2026-03-24T07:55:00.000Z' },
            { id: 'mov-007', productId: 'prod-vdx-003', productName: 'Impresora Termica CloudPrint', sku: 'VDX-PRN-003', type: 'ADJUSTMENT', quantity: -1, locationId: 'loc-store-norte', locationName: 'Sucursal Norte', reference: 'ADJ-0031', notes: 'Equipo defectuoso', createdBy: 'u-admin', createdAt: '2026-03-23T17:30:00.000Z' },
        ],
    },
    {
        id: 'prod-vdx-004',
        name: 'Cable USB POS reforzado',
        sku: 'VDX-CBL-004',
        category: 'Accesorios',
        price: 14.9,
        barcode: '770100100004',
        qrCode: 'VDX-QR-004',
        stockTotal: 86,
        minStock: 15,
        isLowStock: false,
        stockByLocation: [
            { locationId: 'loc-store-central', locationName: 'Tienda Central', locationType: 'STORE', quantity: 18, minStock: 5, isLowStock: false },
            { locationId: 'loc-store-norte', locationName: 'Sucursal Norte', locationType: 'STORE', quantity: 15, minStock: 5, isLowStock: false },
            { locationId: 'loc-warehouse-main', locationName: 'Bodega Principal', locationType: 'WAREHOUSE', quantity: 53, minStock: 15, isLowStock: false },
        ],
        movements: [
            { id: 'mov-008', productId: 'prod-vdx-004', productName: 'Cable USB POS reforzado', sku: 'VDX-CBL-004', type: 'IN', quantity: 60, locationId: 'loc-warehouse-main', locationName: 'Bodega Principal', reference: 'PO-2051', createdBy: 'u-admin', createdAt: '2026-03-21T12:00:00.000Z' },
        ],
    },
    {
        id: 'prod-vdx-005',
        name: 'Tablet Punto de Venta 10"',
        sku: 'VDX-TAB-005',
        category: 'Hardware',
        price: 329,
        barcode: '770100100005',
        qrCode: 'VDX-QR-005',
        stockTotal: 5,
        minStock: 4,
        isLowStock: true,
        stockByLocation: [
            { locationId: 'loc-store-central', locationName: 'Tienda Central', locationType: 'STORE', quantity: 1, minStock: 2, isLowStock: true },
            { locationId: 'loc-store-norte', locationName: 'Sucursal Norte', locationType: 'STORE', quantity: 0, minStock: 1, isLowStock: true },
            { locationId: 'loc-warehouse-main', locationName: 'Bodega Principal', locationType: 'WAREHOUSE', quantity: 4, minStock: 4, isLowStock: true },
        ],
        movements: [
            { id: 'mov-009', productId: 'prod-vdx-005', productName: 'Tablet Punto de Venta 10"', sku: 'VDX-TAB-005', type: 'TRANSFER', quantity: 1, locationId: 'loc-store-central', locationName: 'Tienda Central', sourceLocationId: 'loc-warehouse-main', sourceLocationName: 'Bodega Principal', destinationLocationId: 'loc-store-central', destinationLocationName: 'Tienda Central', reference: 'TR-0092', createdBy: 'u-admin', createdAt: '2026-03-24T09:30:00.000Z' },
        ],
    },
    {
        id: 'prod-vdx-006',
        name: 'Kit Etiquetas QR 1000u',
        sku: 'VDX-LBL-006',
        category: 'Consumibles',
        price: 39.9,
        barcode: '770100100006',
        qrCode: 'VDX-QR-006',
        stockTotal: 120,
        minStock: 20,
        isLowStock: false,
        stockByLocation: [
            { locationId: 'loc-store-central', locationName: 'Tienda Central', locationType: 'STORE', quantity: 24, minStock: 8, isLowStock: false },
            { locationId: 'loc-store-norte', locationName: 'Sucursal Norte', locationType: 'STORE', quantity: 16, minStock: 6, isLowStock: false },
            { locationId: 'loc-warehouse-main', locationName: 'Bodega Principal', locationType: 'WAREHOUSE', quantity: 80, minStock: 20, isLowStock: false },
        ],
        movements: [
            { id: 'mov-010', productId: 'prod-vdx-006', productName: 'Kit Etiquetas QR 1000u', sku: 'VDX-LBL-006', type: 'IN', quantity: 50, locationId: 'loc-warehouse-main', locationName: 'Bodega Principal', reference: 'PO-2054', createdBy: 'u-admin', createdAt: '2026-03-20T16:10:00.000Z' },
        ],
    },
];

export type InventoryFilterState = {
    search?: string;
    category?: string;
    locationId?: string;
    lowStockOnly?: boolean;
};

const cloneLocationStock = (stock: InventoryLocationStock): InventoryLocationStock => ({ ...stock });

const cloneProductDetail = (product: InventoryProductDetail): InventoryProductDetail => ({
    ...product,
    stockByLocation: product.stockByLocation.map(cloneLocationStock),
    movements: product.movements.map((movement) => ({ ...movement })),
});

const recalculateProduct = (product: InventoryProductDetail): InventoryProductDetail => {
    const stockTotal = product.stockByLocation.reduce((total, stock) => total + stock.quantity, 0);
    const minStock = product.stockByLocation.reduce((smallest, stock) => {
        return smallest === 0 ? stock.minStock : Math.min(smallest, stock.minStock);
    }, 0);

    return {
        ...product,
        stockTotal,
        minStock,
        isLowStock: product.stockByLocation.some((stock) => stock.quantity <= stock.minStock),
    };
};

export const inventoryProducts = inventoryCatalog.map(cloneProductDetail).map(recalculateProduct);

export const inventoryCategories = Array.from(
    new Set(inventoryProducts.map((product) => product.category).filter(Boolean)),
) as string[];

export const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);

export const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat('es-EC', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));

export const getInventoryItems = (): InventoryListItem[] =>
    inventoryProducts.map(({ movements, ...product }) => ({
        ...product,
        stockByLocation: product.stockByLocation.map(cloneLocationStock),
    }));

export const getInventoryDetail = (productId: string) => {
    const product = inventoryProducts.find((item) => item.id === productId);
    return product ? cloneProductDetail(product) : null;
};

const projectRowForLocation = (row: InventoryListItem, locationId?: string): InventoryListItem => {
    if (!locationId) {
        return {
            ...row,
            stockByLocation: row.stockByLocation.map(cloneLocationStock),
        };
    }

    const locationStock = row.stockByLocation.filter((stock) => stock.locationId === locationId).map(cloneLocationStock);
    const stockTotal = locationStock.reduce((total, stock) => total + stock.quantity, 0);
    const minStock = locationStock.reduce((smallest, stock) => {
        return smallest === 0 ? stock.minStock : Math.min(smallest, stock.minStock);
    }, 0);

    return {
        ...row,
        stockByLocation: locationStock,
        stockTotal,
        minStock,
        isLowStock: locationStock.some((stock) => stock.quantity <= stock.minStock),
    };
};

export const filterInventoryItems = (filters: InventoryFilterState) => {
    const search = filters.search?.trim().toLowerCase();

    return getInventoryItems()
        .map((row) => projectRowForLocation(row, filters.locationId))
        .filter((row) => !filters.locationId || row.stockByLocation.length > 0)
        .filter((row) => !filters.category || row.category === filters.category)
        .filter((row) => !filters.lowStockOnly || row.isLowStock)
        .filter((row) => {
            if (!search) {
                return true;
            }

            return [row.name, row.sku, row.barcode, row.qrCode]
                .filter(Boolean)
                .some((value) => value?.toLowerCase().includes(search));
        })
        .sort((left, right) => {
            if (left.isLowStock !== right.isLowStock) {
                return left.isLowStock ? -1 : 1;
            }

            return left.name.localeCompare(right.name, 'es');
        });
};

export const paginateInventoryItems = (rows: InventoryListItem[], page: number, pageSize: number) => {
    const total = rows.length;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * pageSize;

    return {
        rows: rows.slice(start, start + pageSize),
        page: safePage,
        total,
        totalPages,
    };
};

export const getInventoryMovements = (productId?: string) => {
    const rows = inventoryProducts.flatMap((product) => product.movements.map((movement) => ({ ...movement })));
    const filteredRows = productId ? rows.filter((movement) => movement.productId === productId) : rows;
    return filteredRows.sort((left, right) => +new Date(right.createdAt) - +new Date(left.createdAt));
};

export const getLowStockAlerts = (locationId?: string): InventoryAlert[] => {
    return getInventoryItems()
        .flatMap((item) =>
            item.stockByLocation
                .filter((stock) => (!locationId || stock.locationId === locationId) && stock.quantity <= stock.minStock)
                .map((stock) => ({
                    id: `${item.id}:${stock.locationId}`,
                    productId: item.id,
                    productName: item.name,
                    sku: item.sku,
                    locationId: stock.locationId,
                    locationName: stock.locationName,
                    quantity: stock.quantity,
                    minStock: stock.minStock,
                    severity: stock.quantity === 0 ? ('critical' as const) : ('warning' as const),
                })),
        )
        .sort((left, right) => left.quantity - right.quantity);
};

export const getInventoryMetrics = () => {
    const rows = getInventoryItems();
    const alerts = getLowStockAlerts();

    return {
        skuCount: rows.length,
        totalUnits: rows.reduce((total, row) => total + row.stockTotal, 0),
        lowStockCount: alerts.length,
        criticalCount: alerts.filter((alert) => alert.severity === 'critical').length,
        inventoryValue: rows.reduce((total, row) => total + row.stockTotal * row.price, 0),
    };
};

export const buildInventoryCsv = (rows: InventoryListItem[]) => {
    const headers = ['SKU', 'Producto', 'Categoria', 'Precio', 'Stock Total', 'Ubicacion', 'Stock', 'Minimo'];
    const lines = rows.flatMap((row) =>
        row.stockByLocation.map((stock) => [
            row.sku,
            row.name,
            row.category ?? 'Sin categoria',
            row.price.toFixed(2),
            String(row.stockTotal),
            stock.locationName,
            String(stock.quantity),
            String(stock.minStock),
        ]),
    );

    return [headers, ...lines].map((line) => line.join(',')).join('\n');
};

export const findProductByScan = (value: string) => {
    const normalizedValue = value.trim().toLowerCase();
    if (!normalizedValue) {
        return null;
    }

    return getInventoryItems().find((item) =>
        [item.sku, item.barcode, item.qrCode, item.name]
            .filter(Boolean)
            .some((field) => field?.toLowerCase() === normalizedValue),
    ) ?? null;
};