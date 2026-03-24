import React, { useState } from 'react';
import { Search, ShoppingCart, CreditCard, Trash2, Plus, Minus, Package } from 'lucide-react';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export default function App() {
    const [cart, setCart] = useState<CartItem[]>([]);

    const products = [
        { id: '1', name: 'Smartphone Vendix Pro', price: 699.99, stock: 15 },
        { id: '2', name: 'Cámara 4K Ultra', price: 249.50, stock: 8 },
        { id: '3', name: 'Audífonos Bluetooth', price: 89.99, stock: 42 },
        { id: '4', name: 'Tablet 10" Air', price: 349.00, stock: 12 },
        { id: '5', name: 'Smartwatch Sport', price: 129.99, stock: 25 },
        { id: '6', name: 'Laptop V-Book', price: 1299.00, stock: 5 },
    ];

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * 0.12;
    const total = subtotal + tax;

    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900">
            {/* Search & Products */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-black text-indigo-600 tracking-tight">VENDIX POS</h1>
                    <div className="relative w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar productos o escanear..."
                            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
                    {products.map(p => (
                        <div
                            key={p.id}
                            onClick={() => addToCart(p)}
                            className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                        >
                            <div className="aspect-square bg-slate-100 rounded-2xl mb-4 flex items-center justify-center">
                                <Package className="text-slate-300 w-12 h-12" />
                            </div>
                            <h3 className="font-bold text-slate-800 truncate mb-1">{p.name}</h3>
                            <p className="text-indigo-600 font-black text-xl">${p.price.toFixed(2)}</p>
                            <div className="mt-2 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <span>Stock: {p.stock}</span>
                                <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">Disponible</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart Summary */}
            <div className="w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-2xl">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center space-x-3">
                        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
                            <ShoppingCart size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Orden #1245</h2>
                    </div>
                    <span className="bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-tighter">
                        {cart.length} items
                    </span>
                </div>

                {/* Scrollable Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                            <ShoppingCart size={48} strokeWidth={1} />
                            <p className="font-medium">El carrito está vacío</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex items-center space-x-4 p-4 rounded-3xl border border-slate-100 hover:bg-slate-50 transition-all">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                                    <p className="text-lg font-black text-indigo-600">${item.price.toFixed(2)}</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                        <button className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200"><Minus size={14} /></button>
                                        <span className="text-sm font-bold text-slate-700 px-2">{item.quantity}</span>
                                        <button className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200"><Plus size={14} /></button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-slate-300 hover:text-red-500 p-2 transition"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Totals */}
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium text-slate-500">
                            <span>Subtotal</span>
                            <span className="text-slate-800">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium text-slate-500">
                            <span>IVA (12%)</span>
                            <span className="text-slate-800">${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-3xl font-black text-slate-900 pt-4 border-t border-slate-200 tracking-tighter">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        disabled={cart.length === 0}
                        className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all mt-4"
                    >
                        <CreditCard size={20} />
                        <span className="text-lg">Procesar Pago</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
