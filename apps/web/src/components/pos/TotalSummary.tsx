import React from 'react';
import type { PosTotals } from '@/lib/pos/types';

interface TotalSummaryProps {
    totals: PosTotals;
}

export default function TotalSummary({ totals }: TotalSummaryProps) {
    return (
        <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-700">${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
                <span>Impuesto</span>
                <span className="font-semibold text-slate-700">${totals.tax.toFixed(2)}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-xl font-black text-slate-900">
                <span>Total</span>
                <span>${totals.total.toFixed(2)}</span>
            </div>
        </div>
    );
}
