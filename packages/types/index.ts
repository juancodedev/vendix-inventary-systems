/**
 * @vendix/types
 * Core domain entities for the Vendix SaaS platform.
 */

export type ID = string;

export interface BaseEntity {
  id: ID;
  tenant_id: ID;
  created_at: Date;
  updated_at: Date;
}

// 🟢 Auth & Tenant
export interface Tenant extends BaseEntity {
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended';
}

export interface User extends BaseEntity {
  email: string;
  role: 'admin' | 'manager' | 'cashier' | 'viewer';
}

// 🟢 Catalog
export interface Product extends BaseEntity {
  name: string;
  sku: string;
  barcode?: string;
  category_id: ID;
  price: number;
  cost: number;
}

// 🟢 Inventory
export interface Location extends BaseEntity {
  name: string;
  type: 'store' | 'warehouse' | 'other';
  address: string;
}

export interface Stock extends BaseEntity {
  product_id: ID;
  location_id: ID;
  quantity: number;
  min_stock: number;
}

// 🟢 Sales (POS)
export interface Sale extends BaseEntity {
  location_id: ID;
  user_id: ID;
  total: number;
  tax: number;
  payment_method: 'cash' | 'card' | 'transfer';
  status: 'completed' | 'cancelled' | 'refunded';
}

export interface SaleItem {
  id: ID;
  sale_id: ID;
  product_id: ID;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export type InventoryMovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';

export interface InventoryLocationStock {
  locationId: ID;
  locationName: string;
  locationType: string;
  quantity: number;
  minStock: number;
  isLowStock: boolean;
}

export interface InventoryMovementRecord {
  id: ID;
  productId: ID;
  productName: string;
  sku: string;
  type: InventoryMovementType;
  quantity: number;
  reference?: string;
  notes?: string;
  locationId?: ID;
  locationName?: string;
  sourceLocationId?: ID;
  sourceLocationName?: string;
  destinationLocationId?: ID;
  destinationLocationName?: string;
  createdBy?: ID;
  createdAt: string;
}

export interface InventoryListItem {
  id: ID;
  name: string;
  sku: string;
  category?: string;
  price: number;
  barcode?: string;
  qrCode?: string;
  stockTotal: number;
  minStock: number;
  isLowStock: boolean;
  stockByLocation: InventoryLocationStock[];
}

export interface InventoryProductDetail extends InventoryListItem {
  movements: InventoryMovementRecord[];
}

export interface InventoryAlert {
  id: ID;
  productId: ID;
  productName: string;
  sku: string;
  locationId: ID;
  locationName: string;
  quantity: number;
  minStock: number;
  severity: 'warning' | 'critical';
}

export interface InventoryPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface InventoryListResponse {
  data: InventoryListItem[];
  pagination: InventoryPagination;
}

export interface InventoryMovementInput {
  productId: ID;
  locationId: ID;
  type: Exclude<InventoryMovementType, 'TRANSFER'>;
  quantity: number;
  reference?: string;
  notes?: string;
  minStock?: number;
}

export interface InventoryTransferInput {
  productId: ID;
  sourceLocationId: ID;
  destinationLocationId: ID;
  quantity: number;
  reference?: string;
  notes?: string;
}

export interface InventoryBatchUpdateInput {
  productId?: ID;
  sku?: string;
  locationId?: ID;
  quantity?: number;
  minStock?: number;
  price?: number;
  category?: string;
}

export interface InventoryBatchRequest {
  action: 'import' | 'export' | 'update';
  csvContent?: string;
  items?: InventoryBatchUpdateInput[];
}

export type PosPaymentMethod = 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER';
export type PosSaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface PosSaleContext {
  tenantId: ID;
  locationId: ID;
  userId: ID;
}

export interface PosSaleItemInput {
  productId: ID;
  quantity: number;
}

export interface PosSaleRequest {
  items: PosSaleItemInput[];
  paymentMethod: PosPaymentMethod;
  expectedTotal?: number;
  notes?: string;
}

export interface PosInventoryIssue {
  productId: ID;
  productName?: string;
  sku?: string;
  requestedQuantity: number;
  availableQuantity: number;
  reason: 'PRODUCT_NOT_FOUND' | 'INVENTORY_NOT_FOUND' | 'INSUFFICIENT_STOCK';
}

export interface PosSaleItemSummary {
  productId: ID;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  remainingStock: number;
}

export interface PosSaleResponse {
  saleId: ID;
  tenantId: ID;
  locationId: ID;
  userId: ID;
  status: PosSaleStatus;
  paymentMethod: PosPaymentMethod;
  total: number;
  items: PosSaleItemSummary[];
  createdAt: string;
}

export interface PosSaleCancellationResponse {
  saleId: ID;
  tenantId: ID;
  locationId: ID;
  status: Extract<PosSaleStatus, 'CANCELLED'>;
  restoredItems: number;
  cancelledAt: string;
}

export interface PosCatalogItem {
  productId: ID;
  name: string;
  sku: string;
  category?: string;
  price: number;
  barcode?: string;
  qrCode?: string;
  availableStock: number;
  minStock: number;
  isLowStock: boolean;
}

export interface PosCatalogResponse {
  data: PosCatalogItem[];
  locationId: ID;
  total: number;
  generatedAt: string;
}
