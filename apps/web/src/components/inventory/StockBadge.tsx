import React from 'react';

type StockBadgeProps = {
    quantity: number;
    minStock: number;
    compact?: boolean;
};

export default function StockBadge({ quantity, minStock, compact = false }: StockBadgeProps) {
    const tone = quantity === 0
        ? 'bg-rose-50 text-rose-700 ring-rose-200'
        : quantity <= minStock
            ? 'bg-amber-50 text-amber-700 ring-amber-200'
            : 'bg-emerald-50 text-emerald-700 ring-emerald-200';

    const label = quantity === 0 ? 'Critico' : quantity <= minStock ? 'Bajo' : 'OK';

    return (
        <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] ring-1 ${tone} ${compact ? 'min-w-[76px]' : 'min-w-[92px]'}`}>
            {label} · {quantity}
        </span>
    );
}