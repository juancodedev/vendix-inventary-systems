import React from 'react';
import Link from 'next/link';
import { ArrowRightLeft, Boxes, ChevronLeft, ChevronRight } from 'lucide-react';
import type { InventoryListItem } from '@vendix/types';
import { formatCurrency } from '@/lib/inventory';
import StockBadge from '@/components/inventory/StockBadge';

type InventoryTableProps = {
    rows: InventoryListItem[];
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
};

export default function InventoryTable({ rows, page, totalPages, onPageChange }: InventoryTableProps) {
    return (
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="hidden lg:block">
                <table className="w-full text-left">
                    <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                        <tr>
                            <th className="px-6 py-4">Producto</th>
                            <th className="px-6 py-4">SKU</th>
                            <th className="px-6 py-4">Precio</th>
                            <th className="px-6 py-4">Stock Total</th>
                            <th className="px-6 py-4">Sucursales</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {rows.map((row) => (
                            <tr key={row.id} className="transition hover:bg-slate-50/80">
                                <td className="px-6 py-5">
                                    <div>
                                        <p className="font-extrabold text-slate-900">{row.name}</p>
                                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{row.category ?? 'Sin categoria'}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-5 font-semibold text-slate-600">{row.sku}</td>
                                <td className="px-6 py-5 font-extrabold text-slate-900">{formatCurrency(row.price)}</td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2 font-extrabold text-slate-900">
                                        <Boxes className="h-4 w-4 text-slate-400" />
                                        {row.stockTotal}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-wrap gap-2">
                                        {row.stockByLocation.map((stock) => (
                                            <span key={stock.locationId} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                                {stock.locationName} · {stock.quantity}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <StockBadge quantity={row.stockTotal} minStock={row.minStock} />
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link href={`/dashboard/inventory/${row.id}`} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600">
                                            Ver detalle
                                        </Link>
                                        <Link href="/dashboard/inventory/transfer" className="rounded-full bg-slate-900 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-slate-700">
                                            <span className="inline-flex items-center gap-2">
                                                <ArrowRightLeft className="h-3.5 w-3.5" />
                                                Transferir
                                            </span>
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="space-y-4 p-4 lg:hidden">
                {rows.map((row) => (
                    <div key={row.id} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{row.category ?? 'Sin categoria'}</p>
                                <h3 className="mt-2 text-lg font-extrabold text-slate-900">{row.name}</h3>
                                <p className="mt-1 text-sm font-medium text-slate-500">{row.sku}</p>
                            </div>
                            <StockBadge quantity={row.stockTotal} minStock={row.minStock} compact />
                        </div>

                        <div className="mt-4 flex items-center justify-between text-sm">
                            <span className="font-bold text-slate-500">Precio</span>
                            <span className="font-extrabold text-slate-900">{formatCurrency(row.price)}</span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {row.stockByLocation.map((stock) => (
                                <span key={stock.locationId} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                                    {stock.locationName} · {stock.quantity}
                                </span>
                            ))}
                        </div>

                        <div className="mt-4 flex gap-2">
                            <Link href={`/dashboard/inventory/${row.id}`} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-slate-700">
                                Ver detalle
                            </Link>
                            <Link href="/dashboard/inventory/transfer" className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-white">
                                Transferir
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-4 sm:px-6">
                <p className="text-sm font-medium text-slate-500">Pagina {page} de {totalPages}</p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}