'use client';

import React, { useDeferredValue, useState } from 'react';
import { Search } from 'lucide-react';
import MovementForm from '@/components/inventory/MovementForm';
import { formatDateTime, getInventoryItems, getInventoryMovements, inventoryLocations } from '@/lib/inventory';

export default function InventoryMovementsPage() {
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const movements = getInventoryMovements().filter((movement) => {
        const normalizedSearch = deferredSearch.trim().toLowerCase();
        if (!normalizedSearch) {
            return true;
        }

        return [movement.productName, movement.sku, movement.reference, movement.locationName]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(normalizedSearch));
    });

    return (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Historial</p>
                        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Movimientos de inventario</h2>
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">Consulta entradas, salidas, ajustes y transferencias con contexto de usuario, referencia y sucursal.</p>
                    </div>

                    <label className="relative block w-full md:max-w-sm">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por producto, SKU o referencia" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white" />
                    </label>
                </div>

                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/70 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            <tr>
                                <th className="px-5 py-4">Producto</th>
                                <th className="px-5 py-4">Tipo</th>
                                <th className="px-5 py-4">Ubicacion</th>
                                <th className="px-5 py-4">Referencia</th>
                                <th className="px-5 py-4">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {movements.map((movement) => (
                                <tr key={movement.id}>
                                    <td className="px-5 py-4">
                                        <p className="font-extrabold text-slate-900">{movement.productName}</p>
                                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{movement.sku}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-700">{movement.type} · {movement.quantity}</span>
                                    </td>
                                    <td className="px-5 py-4 text-slate-500">{movement.locationName ?? movement.sourceLocationName ?? 'Sistema'}</td>
                                    <td className="px-5 py-4 text-slate-500">{movement.reference ?? 'Sin referencia'}</td>
                                    <td className="px-5 py-4 text-slate-500">{formatDateTime(movement.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <MovementForm products={getInventoryItems()} locations={inventoryLocations} />
        </div>
    );
}