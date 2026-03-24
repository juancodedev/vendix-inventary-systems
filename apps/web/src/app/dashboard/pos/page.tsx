import React from 'react';
import { Search, Plus, Trash2, CreditCard, ChevronRight } from 'lucide-react';

export default function POSPage() {
    return (
        <div className="h-full flex space-x-6 overflow-hidden">
            {/* Products Grid */}
            <div className="flex-1 flex flex-col space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar productos o escanear..."
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    />
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-95">
                            <div className="aspect-square bg-slate-50 rounded-xl mb-4 flex items-center justify-center text-slate-400 font-medium">
                                Imagen
                            </div>
                            <h3 className="font-bold text-slate-800 line-clamp-1 mb-1">Producto de Ejemplo {i}</h3>
                            <p className="text-indigo-600 font-extrabold text-lg">$24.99</p>
                            <div className="mt-3 flex justify-between items-center text-xs font-bold text-slate-400">
                                <span>SKU: PRD-{i}00</span>
                                <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-[10px] uppercase">En Stock</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart Panel */}
            <div className="w-96 bg-white border border-slate-200 rounded-3xl flex flex-col shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Carrito actual</h2>
                    <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">3 items</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-4 p-3 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-all border-none">
                            <div className="w-14 h-14 bg-slate-100 rounded-xl flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">Producto Seleccionado {i}</p>
                                <p className="text-xs text-slate-500 font-medium">$24.99 x 1</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button className="text-slate-400 hover:text-red-500 p-1 transition"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium text-slate-500">
                            <span>Subtotal</span>
                            <span>$74.97</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium text-slate-500">
                            <span>Impuestos (12%)</span>
                            <span>$8.99</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-slate-200">
                            <span>Total</span>
                            <span>$83.96</span>
                        </div>
                    </div>

                    <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all">
                        <CreditCard size={20} />
                        <span>Procesar Pago</span>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
