import React from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign, ArrowUpRight } from 'lucide-react';

export default function AnalyticsDashboard() {
    return (
        <div className="space-y-8">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Ventas Totales" value="$45,231.89" trend="+12.5%" icon={<DollarSign className="text-emerald-600" />} />
                <KPICard title="Órdenes" value="1,240" trend="+8.2%" icon={<ShoppingBag className="text-indigo-600" />} />
                <KPICard title="Clientes Nuevos" value="148" trend="+15.1%" icon={<Users className="text-blue-600" />} />
                <KPICard title="Margen Bruto" value="32.4%" trend="-2.4%" icon={<TrendingUp className="text-amber-600" />} />
            </div>

            {/* Main Charts & Lists */}
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold text-slate-800">Ventas por Sucursal</h2>
                        <button className="text-indigo-600 font-bold text-sm hover:underline">Ver detalles</button>
                    </div>
                    <div className="h-64 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-medium italic">
                        [ Gráfico de Tendencias: Crecimiento Semanal ]
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Productos Top</h2>
                    <div className="space-y-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg text-xs font-bold flex items-center justify-center text-slate-400">P{i}</div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Producto {i}</p>
                                        <p className="text-xs text-slate-500">{i * 120} unidades</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-800">${i * 1250}</p>
                                    <p className="text-[10px] text-emerald-500 font-bold">+5.4%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, trend, icon }: { title: string, value: string, trend: string, icon: React.ReactNode }) {
    const isPositive = trend.startsWith('+');
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
                <div className={`flex items-center space-x-0.5 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <span>{trend}</span>
                    <ArrowUpRight size={12} />
                </div>
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
            </div>
        </div>
    );
}
