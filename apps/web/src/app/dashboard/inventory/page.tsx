import React from 'react';
import { Plus, Filter, Download, MoreVertical } from 'lucide-react';

export default function InventoryPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Inventario Global</h2>
                    <p className="text-slate-500 text-sm">Gestiona tus productos en todas las sucursales.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition shadow-sm">
                        <Download size={18} />
                        <span>Exportar</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
                        <Plus size={18} />
                        <span>Nuevo Producto</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                    <div className="flex space-x-4">
                        <button className="text-sm font-bold text-indigo-600 border-b-2 border-indigo-600 pb-1">Todos</button>
                        <button className="text-sm font-medium text-slate-500 hover:text-slate-700">Stock Bajo</button>
                        <button className="text-sm font-medium text-slate-500 hover:text-slate-700">Sin Stock</button>
                    </div>
                    <button className="text-slate-500 hover:text-slate-800">
                        <Filter size={20} />
                    </button>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Producto</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Precio</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {[1, 2, 3, 4, 5].map(i => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg" />
                                        <span className="font-bold text-slate-800">Cámara Vendix Pro {i}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-600">CM-202{i}V</td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">Electrónica</span>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-800">$299.99</td>
                                <td className="px-6 py-4 font-bold text-slate-800">1{i}5</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-2 py-1 rounded">Activo</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-slate-800 transition"><MoreVertical size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
