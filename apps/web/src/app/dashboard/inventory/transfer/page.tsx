'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ProductCard from '@/components/inventory/ProductCard';
import TransferForm from '@/components/inventory/TransferForm';
import {
    deriveInventoryLocations,
    fetchInventoryItems,
    fetchLowStockAlerts,
    getInventoryItems,
    getLowStockAlerts,
    inventoryLocations,
} from '@/lib/inventory';
import type { InventoryAlert, InventoryListItem } from '@vendix/types';

export default function InventoryTransferPage() {
    const [items, setItems] = useState<InventoryListItem[]>([]);
    const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
    const [isFallback, setIsFallback] = useState(false);
    const [loadError, setLoadError] = useState('');
    const fallbackItems = useMemo(() => getInventoryItems(), []);

    const loadData = useCallback(async () => {
        setLoadError('');
        try {
            const [inventoryResponse, alertsResponse] = await Promise.all([
                fetchInventoryItems({ page: 1, pageSize: 100 }),
                fetchLowStockAlerts(),
            ]);

            setItems(inventoryResponse.data);
            setAlerts(alertsResponse);
            setIsFallback(false);
        } catch (error) {
            setIsFallback(true);
            setLoadError(error instanceof Error ? error.message : 'No fue posible cargar inventario en tiempo real.');
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const activeItems = isFallback ? fallbackItems : items;
    const activeAlerts = isFallback ? getLowStockAlerts() : alerts;
    const activeLocations = useMemo(
        () => (isFallback ? inventoryLocations : deriveInventoryLocations(activeItems)),
        [activeItems, isFallback],
    );

    const priorityItems = activeItems.filter((item) => item.isLowStock).slice(0, 2);
    const visibleAlerts = activeAlerts.slice(0, 4);

    return (
        <div className="space-y-8">
            {loadError ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">{loadError} {isFallback ? 'Mostrando datos locales de respaldo.' : ''}</p> : null}

            <TransferForm products={activeItems.length > 0 ? activeItems : fallbackItems} locations={activeLocations.length > 0 ? activeLocations : inventoryLocations} onSuccess={loadData} />

            <section className="grid gap-6 lg:grid-cols-2">
                {priorityItems.map((item) => (
                    <ProductCard key={item.id} product={item} emphasis="alert" />
                ))}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Alertas relacionadas</p>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-900">Sucursales que requieren rebalanceo</h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {visibleAlerts.map((alert) => (
                        <div key={alert.id} className={`rounded-3xl border px-4 py-4 ${alert.severity === 'critical' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}>
                            <p className="font-extrabold text-slate-900">{alert.productName}</p>
                            <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{alert.locationName}</p>
                            <p className="mt-3 text-sm font-bold text-slate-700">Disponible {alert.quantity} · Minimo {alert.minStock}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}