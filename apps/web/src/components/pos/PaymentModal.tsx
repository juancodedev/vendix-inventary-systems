import React from 'react';
import { X } from 'lucide-react';
import type { PosPaymentMethod, PosTotals } from '@/lib/pos/types';

interface PaymentModalProps {
    open: boolean;
    isSubmitting: boolean;
    totals: PosTotals;
    paymentMethod: PosPaymentMethod;
    onClose: () => void;
    onSelectPaymentMethod: (method: PosPaymentMethod) => void;
    onConfirm: () => void;
}

const PAYMENT_METHODS: Array<{ value: PosPaymentMethod; label: string }> = [
    { value: 'CASH', label: 'Efectivo' },
    { value: 'CARD', label: 'Tarjeta' },
    { value: 'TRANSFER', label: 'Transferencia' },
    { value: 'OTHER', label: 'Otro' },
];

export default function PaymentModal({
    open,
    isSubmitting,
    totals,
    paymentMethod,
    onClose,
    onSelectPaymentMethod,
    onConfirm,
}: PaymentModalProps) {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 p-4 grid place-items-center">
            <div className="w-full max-w-md bg-white rounded-3xl p-5 space-y-4 border border-slate-200 shadow-2xl">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Confirmar pago</h3>
                    <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <X size={18} />
                    </button>
                </div>

                <p className="text-sm text-slate-600">Selecciona el metodo de pago para cerrar la venta.</p>

                <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((method) => (
                        <button
                            key={method.value}
                            type="button"
                            onClick={() => onSelectPaymentMethod(method.value)}
                            className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                                paymentMethod === method.value
                                    ? 'bg-sky-600 text-white border-sky-600'
                                    : 'bg-white text-slate-700 border-slate-200'
                            }`}
                        >
                            {method.label}
                        </button>
                    ))}
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Total a cobrar</p>
                    <p className="text-3xl font-black text-slate-900">${totals.total.toFixed(2)}</p>
                </div>

                <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={onConfirm}
                    className="w-full rounded-2xl bg-emerald-600 text-white py-4 font-bold disabled:opacity-60"
                >
                    {isSubmitting ? 'Procesando...' : 'Finalizar venta'}
                </button>
            </div>
        </div>
    );
}
