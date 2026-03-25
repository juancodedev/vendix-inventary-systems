import React from 'react';
import type { InventoryListItem } from '@vendix/types';
import { formatCurrency } from '@/lib/inventory';
import StockBadge from '@/components/inventory/StockBadge';

type ProductCardProps = {
    product: InventoryListItem;
    emphasis?: 'default' | 'alert';
};

export default function ProductCard({ product, emphasis = 'default' }: ProductCardProps) {
    return (
        <article className={`rounded-3xl border p-5 shadow-sm transition ${emphasis === 'alert' ? 'border-amber-200 bg-amber-50/70 shadow-amber-100' : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/50'}`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{product.category ?? 'Sin categoria'}</p>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-900">{product.name}</h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">SKU {product.sku}</p>
                </div>
                <StockBadge quantity={product.stockTotal} minStock={product.minStock} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Precio</p>
                    <p className="mt-2 text-lg font-black text-slate-900">{formatCurrency(product.price)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Stock Total</p>
                    <p className="mt-2 text-lg font-black text-slate-900">{product.stockTotal}</p>
                </div>
            </div>

            <div className="mt-5 space-y-2">
                {product.stockByLocation.map((stock) => (
                    <div key={stock.locationId} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3">
                        <div>
                            <p className="text-sm font-bold text-slate-800">{stock.locationName}</p>
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{stock.locationType}</p>
                        </div>
                        <StockBadge quantity={stock.quantity} minStock={stock.minStock} compact />
                    </div>
                ))}
            </div>
        </article>
    );
}