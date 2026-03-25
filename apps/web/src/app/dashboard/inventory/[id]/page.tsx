'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock3, ScanLine, Warehouse } from 'lucide-react';
import ProductCard from '@/components/inventory/ProductCard';
import StockBadge from '@/components/inventory/StockBadge';
import { fetchInventoryDetail, formatDateTime, getInventoryDetail } from '@/lib/inventory';
import type { InventoryProductDetail } from '@vendix/types';

export default function InventoryDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const productId = params.id;

    const fallbackProduct = useMemo(() => getInventoryDetail(productId), [productId]);
    const [product, setProduct] = useState<InventoryProductDetail | null>(null);
    const [isFallback, setIsFallback] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            setIsLoading(true);
            setLoadError('');

            try {
                const detail = await fetchInventoryDetail(productId);
                if (!isMounted) {
                    return;
                }
                setProduct(detail);
                setIsFallback(false);
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                if (fallbackProduct) {
                    setProduct(fallbackProduct);
                    setIsFallback(true);
                    setLoadError(error instanceof Error ? error.message : 'No fue posible cargar el detalle en tiempo real.');
                } else {
                    router.replace('/dashboard/inventory');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void load();

        return () => {
            isMounted = false;
        };
    }, [fallbackProduct, productId, router]);

    if (isLoading && !product) {
        return <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">Cargando detalle de inventario...</div>;
    }

    if (!product) {
        return null;
    }

    return (
        <div className="space-y-8">
            {loadError ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">{loadError} {isFallback ? 'Mostrando detalle local de respaldo.' : ''}</p> : null}

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <Link href="/dashboard/inventory" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-500 transition hover:text-slate-900">
                        <ArrowLeft className="h-4 w-4" />
                        Volver a inventario
                    </Link>
                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{product.name}</h2>
                    <p className="mt-2 text-sm font-medium text-slate-500">SKU {product.sku} · Barcode {product.barcode ?? 'Sin asignar'} · QR {product.qrCode ?? 'Sin asignar'}</p>
                </div>
                <Link href="/dashboard/inventory/transfer" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-700">
                    Transferir stock
                </Link>
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <ProductCard product={product} emphasis={product.isLowStock ? 'alert' : 'default'} />

                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Stock por sucursal</p>
                            <h3 className="mt-2 text-xl font-extrabold text-slate-900">Disponibilidad en tiempo real</h3>
                        </div>
                        <Warehouse className="h-5 w-5 text-slate-400" />
                    </div>

                    <div className="mt-5 space-y-3">
                        {product.stockByLocation.map((stock) => (
                            <div key={stock.locationId} className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50/70 px-5 py-4">
                                <div>
                                    <p className="font-extrabold text-slate-900">{stock.locationName}</p>
                                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{stock.locationType}</p>
                                </div>
                                <div className="text-right">
                                    <StockBadge quantity={stock.quantity} minStock={stock.minStock} />
                                    <p className="mt-2 text-xs font-semibold text-slate-500">Minimo configurado: {stock.minStock}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Historial</p>
                        <h3 className="mt-2 text-xl font-extrabold text-slate-900">Movimientos recientes</h3>
                    </div>
                    <Clock3 className="h-5 w-5 text-slate-400" />
                </div>

                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/70 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            <tr>
                                <th className="px-5 py-4">Tipo</th>
                                <th className="px-5 py-4">Ubicacion</th>
                                <th className="px-5 py-4">Referencia</th>
                                <th className="px-5 py-4">Usuario</th>
                                <th className="px-5 py-4">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {product.movements.map((movement) => (
                                <tr key={movement.id}>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-700">{movement.type} · {movement.quantity}</span>
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-slate-600">{movement.locationName ?? movement.destinationLocationName ?? 'Sistema'}</td>
                                    <td className="px-5 py-4 text-slate-500">{movement.reference ?? 'Sin referencia'}</td>
                                    <td className="px-5 py-4 text-slate-500">{movement.createdBy ?? 'system'}</td>
                                    <td className="px-5 py-4 text-slate-500">{formatDateTime(movement.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium text-slate-600">
                    <ScanLine className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    El producto ya expone SKU, barcode y QR para integrarlo con scanner, POS y futuras ordenes de compra.
                </div>
            </section>
        </div>
    );
}
