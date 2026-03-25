'use client';

import React, { useMemo, useState } from 'react';
import type { InventoryListItem } from '@vendix/types';

type TransferFormProps = {
    products: InventoryListItem[];
    locations: Array<{ id: string; name: string; type: string }>;
};

export default function TransferForm({ products, locations }: TransferFormProps) {
    const [productId, setProductId] = useState(products[0]?.id ?? '');
    const [sourceLocationId, setSourceLocationId] = useState(locations[0]?.id ?? '');
    const [destinationLocationId, setDestinationLocationId] = useState(locations[1]?.id ?? locations[0]?.id ?? '');
    const [quantity, setQuantity] = useState('1');
    const [reference, setReference] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const selectedProduct = products.find((product) => product.id === productId) ?? products[0];
    const sourceStock = useMemo(() => selectedProduct?.stockByLocation.find((stock) => stock.locationId === sourceLocationId), [selectedProduct, sourceLocationId]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setMessage('');

        const normalizedQuantity = Number(quantity);
        if (!selectedProduct) {
            setError('Selecciona un producto.');
            return;
        }

        if (sourceLocationId === destinationLocationId) {
            setError('Origen y destino deben ser diferentes.');
            return;
        }

        if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
            setError('La cantidad debe ser mayor a 0.');
            return;
        }

        if (!sourceStock || sourceStock.quantity < normalizedQuantity) {
            setError('No hay stock suficiente en la sucursal origen.');
            return;
        }

        setMessage(`Transferencia validada para ${normalizedQuantity} unidades. Conecta este formulario al endpoint POST /inventory/transfer para ejecutar la salida y la entrada.`);
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Transferencia</p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-900">Mover stock entre sucursales</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">La operación debe generar doble movimiento, validar stock disponible y dejar trazabilidad completa para auditoría.</p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-bold text-slate-700 md:col-span-2">
                    <span>Producto</span>
                    <select value={productId} onChange={(event) => setProductId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white">
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>
                        ))}
                    </select>
                </label>

                <label className="space-y-2 text-sm font-bold text-slate-700">
                    <span>Origen</span>
                    <select value={sourceLocationId} onChange={(event) => setSourceLocationId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white">
                        {locations.map((location) => (
                            <option key={location.id} value={location.id}>{location.name}</option>
                        ))}
                    </select>
                </label>

                <label className="space-y-2 text-sm font-bold text-slate-700">
                    <span>Destino</span>
                    <select value={destinationLocationId} onChange={(event) => setDestinationLocationId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white">
                        {locations.map((location) => (
                            <option key={location.id} value={location.id}>{location.name}</option>
                        ))}
                    </select>
                </label>

                <label className="space-y-2 text-sm font-bold text-slate-700">
                    <span>Cantidad</span>
                    <input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min="1" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white" />
                </label>

                <label className="space-y-2 text-sm font-bold text-slate-700">
                    <span>Referencia</span>
                    <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="TR-0092" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white" />
                </label>
            </div>

            <div className="mt-6 rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Disponibilidad actual</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-600">Stock en origen</span>
                    <span className="text-lg font-black text-slate-900">{sourceStock?.quantity ?? 0}</span>
                </div>
            </div>

            {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}
            {message ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p> : null}

            <button type="submit" className="mt-6 w-full rounded-2xl bg-indigo-600 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-indigo-700">
                Ejecutar transferencia
            </button>
        </form>
    );
}