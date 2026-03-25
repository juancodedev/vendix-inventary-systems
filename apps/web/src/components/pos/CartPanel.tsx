import React from 'react';
import { CreditCard } from 'lucide-react';
import CartItem from './CartItem';
import TotalSummary from './TotalSummary';
import type { PosCartItem, PosTotals } from '@/lib/pos/types';

interface CartPanelProps {
    items: PosCartItem[];
    totals: PosTotals;
    onIncrement: (productId: string) => void;
    onDecrement: (productId: string) => void;
    onRemove: (productId: string) => void;
    onCheckout: () => void;
}

export default function CartPanel({
    items,
    totals,
    onIncrement,
    onDecrement,
    onRemove,
    onCheckout,
}: CartPanelProps) {
    return (
        <aside className="w-full xl:w-[390px] bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                <h2 className="font-bold text-slate-900">Carrito</h2>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-sky-100 text-sky-700">{items.length} items</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-48">
                {items.length === 0 && <p className="text-sm text-slate-500 p-3">Agrega productos para iniciar una venta.</p>}
                {items.map((item) => (
                    <CartItem
                        key={item.productId}
                        item={item}
                        onIncrement={onIncrement}
                        onDecrement={onDecrement}
                        onRemove={onRemove}
                    />
                ))}
            </div>

            <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                <TotalSummary totals={totals} />
                <button
                    type="button"
                    disabled={items.length === 0}
                    onClick={onCheckout}
                    className="w-full rounded-2xl bg-sky-600 text-white py-4 font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                    <CreditCard size={18} />
                    Cobrar
                </button>
            </div>
        </aside>
    );
}
