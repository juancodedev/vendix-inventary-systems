'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Wifi, WifiOff, RotateCcw, AlertTriangle } from 'lucide-react';
import ProductSearch from './ProductSearch';
import ScannerComponent from './ScannerComponent';
import CartPanel from './CartPanel';
import PaymentModal from './PaymentModal';
import {
    fetchProducts,
    createSale,
    syncQueuedSales,
    validateStock,
} from '@/lib/pos/api';
import {
    getOfflineQueue,
    getProductCache,
    getClientContext,
    pushOfflineSale,
    toClientReference,
} from '@/lib/pos/offline';
import type { PosCartItem, PosPaymentMethod, PosProduct } from '@/lib/pos/types';

const TAX_RATE = 0.12;

const calcTotals = (items: PosCartItem[]) => {
    const subtotal = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
    const tax = subtotal * TAX_RATE;
    return {
        subtotal,
        tax,
        total: subtotal + tax,
    };
};

const productMatchesCode = (product: PosProduct, code: string) => {
    const normalized = code.trim().toLowerCase();
    return [product.sku, product.barcode, product.qrCode, product.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase() === normalized);
};

export default function POSLayout() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [products, setProducts] = useState<PosProduct[]>([]);
    const [cart, setCart] = useState<PosCartItem[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>('CASH');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
    const [offlineCount, setOfflineCount] = useState(0);

    const totals = useMemo(() => calcTotals(cart), [cart]);

    useEffect(() => {
        inputRef.current?.focus();
        const cached = getProductCache();
        if (cached.products.length > 0) {
            setProducts(cached.products);
        }

        setOfflineCount(getOfflineQueue().length);
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(async () => {
            setIsLoadingProducts(true);
            try {
                const ctx = getClientContext();
                const response = await fetchProducts(query, ctx.locationId);
                setProducts(response.data);
            } catch {
                if (!navigator.onLine) {
                    const cached = getProductCache();
                    setProducts(cached.products);
                }
            } finally {
                setIsLoadingProducts(false);
            }
        }, 160);

        return () => window.clearTimeout(timeout);
    }, [query]);

    useEffect(() => {
        const onOnline = async () => {
            setIsOnline(true);
            try {
                const result = await syncQueuedSales();
                if (result) {
                    const failed = result.results.filter((entry) => !entry.ok).length;
                    setOfflineCount(failed);
                    setMessage(failed === 0 ? 'Sincronizacion offline completada.' : `Quedaron ${failed} ventas pendientes.`);
                }
            } catch {
                setMessage('No se pudo sincronizar cola offline.');
            }
        };

        const onOffline = () => setIsOnline(false);

        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

    const addProductToCart = (product: PosProduct) => {
        setCart((previous) => {
            const existing = previous.find((item) => item.productId === product.id);
            if (existing) {
                if (existing.quantity >= existing.stockAvailable) {
                    setMessage(`No hay mas stock disponible de ${product.name}.`);
                    return previous;
                }

                return previous.map((item) =>
                    item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
                );
            }

            return [
                ...previous,
                {
                    productId: product.id,
                    name: product.name,
                    sku: product.sku,
                    unitPrice: product.price,
                    quantity: 1,
                    stockAvailable: product.stock,
                },
            ];
        });

        setMessage(null);
        inputRef.current?.focus();
    };

    const handleScannerDetected = (code: string) => {
        const product = products.find((item) => productMatchesCode(item, code));
        if (product) {
            addProductToCart(product);
            setQuery('');
            return;
        }

        setQuery(code);
        setMessage(`Codigo detectado: ${code}. Verifica y agrega el producto.`);
    };

    const updateItemQuantity = (productId: string, delta: number) => {
        setCart((previous) => {
            return previous
                .map((item) => {
                    if (item.productId !== productId) {
                        return item;
                    }

                    const nextQuantity = item.quantity + delta;
                    if (nextQuantity > item.stockAvailable) {
                        setMessage(`Stock maximo alcanzado para ${item.name}.`);
                        return item;
                    }

                    return {
                        ...item,
                        quantity: nextQuantity,
                    };
                })
                .filter((item) => item.quantity > 0);
        });
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        const ctx = getClientContext();
        const payload = {
            locationId: ctx.locationId,
            paymentMethod,
            taxRate: TAX_RATE,
            clientReference: toClientReference(),
            items: cart.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
            })),
        };

        try {
            if (!navigator.onLine) {
                pushOfflineSale(payload);
                setOfflineCount(getOfflineQueue().length);
                setCart([]);
                setIsPaymentModalOpen(false);
                setMessage('Venta guardada offline. Se sincronizara automaticamente.');
                return;
            }

            await validateStock({
                locationId: ctx.locationId,
                items: payload.items,
            });

            await createSale(payload);
            setCart([]);
            setIsPaymentModalOpen(false);
            setMessage('Venta completada correctamente.');

            const refreshed = await fetchProducts('', ctx.locationId);
            setProducts(refreshed.data);
        } catch (error) {
            const messageText = error instanceof Error ? error.message : 'No fue posible completar la venta.';
            setMessage(messageText);
        } finally {
            setIsSubmitting(false);
            inputRef.current?.focus();
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-3 sm:p-4 lg:p-6">
            <div className="max-w-[1600px] mx-auto space-y-4">
                <header className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">POS Vendix</h1>
                        <p className="text-sm text-slate-600">Caja rapida para operaciones en tienda fisica.</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                            {isOnline ? 'Online' : 'Offline'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                            <RotateCcw size={14} />
                            Pendientes: {offlineCount}
                        </span>
                    </div>
                </header>

                {message && (
                    <div className="rounded-2xl border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3 text-sm flex items-center gap-2">
                        <AlertTriangle size={16} />
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_390px] gap-4">
                    <div className="bg-slate-100 border border-slate-200 rounded-3xl p-3 sm:p-4 space-y-4">
                        <ProductSearch
                            query={query}
                            onQueryChange={setQuery}
                            onSelect={addProductToCart}
                            products={products}
                            isLoading={isLoadingProducts}
                            inputRef={inputRef}
                        />
                        <ScannerComponent onDetected={handleScannerDetected} />
                    </div>

                    <CartPanel
                        items={cart}
                        totals={totals}
                        onIncrement={(productId) => updateItemQuantity(productId, 1)}
                        onDecrement={(productId) => updateItemQuantity(productId, -1)}
                        onRemove={(productId) => setCart((previous) => previous.filter((item) => item.productId !== productId))}
                        onCheckout={() => setIsPaymentModalOpen(true)}
                    />
                </div>
            </div>

            <PaymentModal
                open={isPaymentModalOpen}
                isSubmitting={isSubmitting}
                totals={totals}
                paymentMethod={paymentMethod}
                onClose={() => setIsPaymentModalOpen(false)}
                onSelectPaymentMethod={setPaymentMethod}
                onConfirm={handleCheckout}
            />
        </div>
    );
}
