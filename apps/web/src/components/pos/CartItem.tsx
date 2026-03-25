import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { PosCartItem } from '@/lib/pos/types';

interface CartItemProps {
    item: PosCartItem;
    onIncrement: (productId: string) => void;
    onDecrement: (productId: string) => void;
    onRemove: (productId: string) => void;
}

export default function CartItem({ item, onIncrement, onDecrement, onRemove }: CartItemProps) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-3">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="font-bold text-sm text-slate-800 line-clamp-2">{item.name}</p>
                    <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                </div>
                <button type="button" onClick={() => onRemove(item.productId)} className="text-slate-400 hover:text-red-600">
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="mt-3 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                    <button type="button" onClick={() => onDecrement(item.productId)} className="w-8 h-8 rounded-lg bg-slate-100 grid place-items-center">
                        <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button type="button" onClick={() => onIncrement(item.productId)} className="w-8 h-8 rounded-lg bg-slate-100 grid place-items-center">
                        <Plus size={14} />
                    </button>
                </div>

                <div className="text-right">
                    <p className="text-xs text-slate-500">${item.unitPrice.toFixed(2)} c/u</p>
                    <p className="font-extrabold text-slate-900">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
}
