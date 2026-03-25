'use client';

import React, { useState } from 'react';
import type { InventoryListItem } from '@vendix/types';
import { createInventoryMovement } from '@/lib/inventory';

type MovementFormProps = {
    products: InventoryListItem[];
    locations: Array<{ id: string; name: string; type: string }>;
    defaultProductId?: string;
    onSuccess?: () => Promise<void> | void;
};

const movementTypes = [
    { value: 'IN', label: 'Entrada' },
    { value: 'OUT', label: 'Salida' },
    { value: 'ADJUSTMENT', label: 'Ajuste' },
];

export default function MovementForm({ products, locations, defaultProductId, onSuccess }: MovementFormProps) {
    const [productId, setProductId] = useState(defaultProductId ?? products[0]?.id ?? '');
    const [locationId, setLocationId] = useState(locations[0]?.id ?? '');
    const [type, setType] = useState('IN');
    const [quantity, setQuantity] = useState('1');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage('');
        setError('');

        if (!productId || !locationId) {
            setError('Selecciona producto y sucursal.');
            return;
        }

        const normalizedQuantity = Number(quantity);
        if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
            setError('La cantidad debe ser mayor a 0.');
            return;
        }

        try {
            setIsSubmitting(true);
            await createInventoryMovement({
                productId,
                locationId,
                type: type as 'IN' | 'OUT' | 'ADJUSTMENT',
                quantity: normalizedQuantity,
                reference: reference.trim() || undefined,
                notes: notes.trim() || undefined,
            });

            setMessage(`Movimiento ${type} registrado para ${normalizedQuantity} unidades.`);
            if (onSuccess) {
                await onSuccess();
            }
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'No fue posible registrar el movimiento.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Movimiento</p>
                    <h3 className="mt-2 text-xl font-extrabold text-slate-900">Registrar stock</h3>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Admin</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-bold text-slate-700">
                    <span>Producto</span>
                    <select value={productId} onChange={(event) => setProductId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white">
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>{product.name}</option>
                        ))}
                    </select>
                </label>

                <label className="space-y-2 text-sm font-bold text-slate-700">
                    <span>Sucursal</span>
                    <select value={locationId} onChange={(event) => setLocationId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white">
                        {locations.map((location) => (
                            <option key={location.id} value={location.id}>{location.name}</option>
                        ))}
                    </select>
                </label>

                <label className="space-y-2 text-sm font-bold text-slate-700">
                    <span>Tipo</span>
                    <select value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white">
                        {movementTypes.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </label>

                <label className="space-y-2 text-sm font-bold text-slate-700">
                    <span>Cantidad</span>
                    <input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min="1" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white" />
                </label>

                <label className="space-y-2 text-sm font-bold text-slate-700 md:col-span-2">
                    <span>Referencia</span>
                    <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="PO-2048, SALE-1904, ADJ-0031" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white" />
                </label>

                <label className="space-y-2 text-sm font-bold text-slate-700 md:col-span-2">
                    <span>Notas</span>
                    <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Motivo del movimiento o contexto operativo" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white" />
                </label>
            </div>

            {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}
            {message ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p> : null}

            <button type="submit" disabled={isSubmitting} className="mt-6 w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'Guardando...' : 'Registrar movimiento'}
            </button>
        </form>
    );
}