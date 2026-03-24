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
