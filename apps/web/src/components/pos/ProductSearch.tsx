import React from 'react';
import { Search, AlertCircle } from 'lucide-react';
import type { PosProduct } from '@/lib/pos/types';

interface ProductSearchProps {
    query: string;
    onQueryChange: (value: string) => void;
    onSelect: (product: PosProduct) => void;
    products: PosProduct[];
    isLoading: boolean;
    inputRef: React.RefObject<HTMLInputElement>;
}

export default function ProductSearch({
    query,
    onQueryChange,
    onSelect,
    products,
    isLoading,
    inputRef,
}: ProductSearchProps) {
    return (
        <section className="flex flex-col h-full">
            <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    placeholder="Buscar por nombre, SKU o codigo"
                    className="w-full bg-white border border-slate-300 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
                />
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pb-2">
                {isLoading && (
                    <div className="col-span-full rounded-2xl bg-white border border-slate-200 p-6 text-sm text-slate-500">
                        Cargando productos...
                    </div>
                )}

                {!isLoading && products.length === 0 && (
                    <div className="col-span-full rounded-2xl bg-white border border-amber-200 p-6 text-sm text-amber-700 flex items-center gap-2">
                        <AlertCircle size={18} />
                        Sin resultados para la busqueda actual.
                    </div>
                )}

                {products.map((product) => (
                    <button
                        key={product.id}
                        type="button"
                        onClick={() => onSelect(product)}
                        className="bg-white p-4 text-left rounded-2xl border border-slate-200 shadow-sm active:scale-[0.99] hover:border-sky-300 hover:shadow transition-all"
                    >
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{product.name}</h3>
                            <span className="text-xs font-semibold text-slate-500">{product.sku}</span>
                        </div>
                        <p className="text-sky-700 font-extrabold text-lg">${product.price.toFixed(2)}</p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-slate-500">Stock: {product.stock}</span>
                            <span className={`px-2 py-0.5 rounded-full font-semibold ${product.isLowStock ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {product.isLowStock ? 'Bajo' : 'Disponible'}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}
