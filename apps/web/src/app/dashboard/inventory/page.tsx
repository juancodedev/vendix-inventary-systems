'use client';

import React, { startTransition, useDeferredValue, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRightLeft, Download, Search } from 'lucide-react';
import InventoryTable from '@/components/inventory/InventoryTable';
import MovementForm from '@/components/inventory/MovementForm';
import ProductCard from '@/components/inventory/ProductCard';
import ScannerComponent from '@/components/inventory/ScannerComponent';
import {
    buildInventoryCsv,
    filterInventoryItems,
    findProductByScan,
    formatCurrency,
    getInventoryItems,
    getInventoryMetrics,
    getLowStockAlerts,
    inventoryCategories,
    inventoryLocations,
    paginateInventoryItems,
} from '@/lib/inventory';

const PAGE_SIZE = 4;

export default function InventoryPage() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [locationId, setLocationId] = useState('');
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [scannerResult, setScannerResult] = useState('');

    const deferredSearch = useDeferredValue(search);
    const metrics = getInventoryMetrics();
    const alerts = getLowStockAlerts(locationId || undefined).slice(0, 3);
    const filteredRows = filterInventoryItems({
        search: deferredSearch,
        category: category || undefined,
        locationId: locationId || undefined,
        lowStockOnly,
    });
    const paginated = paginateInventoryItems(filteredRows, page, PAGE_SIZE);
    const featuredRows = filteredRows.slice(0, 2);

    const handleExport = () => {
        const csv = buildInventoryCsv(filteredRows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'inventory-export.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleDetected = (value: string) => {
        const match = findProductByScan(value);
        startTransition(() => {
            setSearch(match?.sku ?? value);
            setScannerResult(match ? `Coincidencia detectada: ${match.name}` : `No se encontro coincidencia exacta para ${value}.`);
            setPage(1);
        });
    };

    const handleFilterChange = (updater: () => void) => {
        startTransition(() => {
            updater();
            setPage(1);
        });
    };

    return (
        <div className="space-y-8">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Inventario SaaS</p>
                        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Control multitenant y multisucursal</h2>
                        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">Consulta stock en tiempo real, registra movimientos, detecta alertas y prepara el módulo para integrarse con POS, compras y notificaciones.</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button type="button" onClick={handleExport} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                            <span className="inline-flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Exportar CSV
                            </span>
                        </button>
                        <Link href="/dashboard/inventory/movements" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                            Historial
                        </Link>
                        <Link href="/dashboard/inventory/transfer" className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-indigo-700">
                            <span className="inline-flex items-center gap-2">
                                <ArrowRightLeft className="h-4 w-4" />
                                Transferir stock
                            </span>
                        </Link>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard label="SKUs activos" value={String(metrics.skuCount)} accent="slate" />
                    <MetricCard label="Unidades disponibles" value={String(metrics.totalUnits)} accent="emerald" />
                    <MetricCard label="Alertas de bajo stock" value={String(metrics.lowStockCount)} accent="amber" />
                    <MetricCard label="Valor del inventario" value={formatCurrency(metrics.inventoryValue)} accent="indigo" />
                </div>
            </section>

            <section className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
                <div className="space-y-6">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px_200px]">
                            <label className="relative block">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(event) => handleFilterChange(() => setSearch(event.target.value))}
                                    placeholder="Buscar por nombre, SKU, barcode o QR"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white"
                                />
                            </label>

                            <select value={locationId} onChange={(event) => handleFilterChange(() => setLocationId(event.target.value))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white">
                                <option value="">Todas las sucursales</option>
                                {inventoryLocations.map((location) => (
                                    <option key={location.id} value={location.id}>{location.name}</option>
                                ))}
                            </select>

                            <select value={category} onChange={(event) => handleFilterChange(() => setCategory(event.target.value))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white">
                                <option value="">Todas las categorias</option>
                                {inventoryCategories.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => handleFilterChange(() => setLowStockOnly((current) => !current))}
                                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${lowStockOnly ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                Solo bajo stock
                            </button>

                            <p className="text-sm font-medium text-slate-500">{filteredRows.length} productos visibles</p>
                        </div>
                    </div>

                    <InventoryTable rows={paginated.rows} page={paginated.page} totalPages={paginated.totalPages} onPageChange={setPage} />
                </div>

                <div className="space-y-6">
                    <ScannerComponent onDetected={handleDetected} />
                    {scannerResult ? <p className="rounded-2xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">{scannerResult}</p> : null}

                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Alertas</p>
                                <h3 className="mt-2 text-xl font-extrabold text-slate-900">Prioridades de reposicion</h3>
                            </div>
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                        </div>

                        <div className="mt-5 space-y-3">
                            {alerts.map((alert) => (
                                <Link key={alert.id} href={`/dashboard/inventory/${alert.productId}`} className={`block rounded-3xl border px-4 py-4 transition ${alert.severity === 'critical' ? 'border-rose-200 bg-rose-50 hover:border-rose-300' : 'border-amber-200 bg-amber-50 hover:border-amber-300'}`}>
                                    <p className="text-sm font-extrabold text-slate-900">{alert.productName}</p>
                                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{alert.locationName} · {alert.sku}</p>
                                    <p className="mt-3 text-sm font-bold text-slate-700">Disponible {alert.quantity} · Minimo {alert.minStock}</p>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <MovementForm products={getInventoryItems()} locations={inventoryLocations} />
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                {featuredRows.map((product) => (
                    <ProductCard key={product.id} product={product} emphasis={product.isLowStock ? 'alert' : 'default'} />
                ))}
            </section>
        </div>
    );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent: 'slate' | 'emerald' | 'amber' | 'indigo' }) {
    const accentClassName = {
        slate: 'bg-slate-100 text-slate-900',
        emerald: 'bg-emerald-100 text-emerald-800',
        amber: 'bg-amber-100 text-amber-800',
        indigo: 'bg-indigo-100 text-indigo-800',
    }[accent];

    return (
        <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${accentClassName}`}>{label.split(' ')[0]}</div>
            <p className="mt-4 text-2xl font-black text-slate-900">{value}</p>
        </div>
    );
}
