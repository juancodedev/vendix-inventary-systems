import React from 'react';
import { TrendingUp, Users, ShoppingBag, CreditCard } from 'lucide-react';

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bienvenido, Juan 👋</h2>
                    <p className="text-slate-500 font-medium">Aquí tienes un resumen del rendimiento de tu tienda hoy.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-600">
                    Marzo 24, 2026
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Ventas Totales"
                    value="$12,450.00"
                    change="+12.5%"
                    icon={<CreditCard className="text-emerald-600" />}
                    color="bg-emerald-50"
                />
                <StatCard
                    title="Pedidos"
                    value="156"
                    change="+8%"
                    icon={<ShoppingBag className="text-blue-600" />}
                    color="bg-blue-50"
                />
                <StatCard
                    title="Clientes Nuevos"
                    value="42"
                    change="+15%"
                    icon={<Users className="text-indigo-600" />}
                    color="bg-indigo-50"
                />
                <StatCard
                    title="Crecimiento"
                    value="24%"
                    change="+2.4%"
                    icon={<TrendingUp className="text-orange-600" />}
                    color="bg-orange-50"
                />
            </div>

            {/* Placeholder for charts/tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-slate-900">Ventas Recientes</h3>
                        <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Ver todo</button>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors px-2 rounded-xl -mx-2">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-slate-100 rounded-full"></div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Pedido #TX-00{i}</p>
                                        <p className="text-xs font-medium text-slate-500">Hace {i * 10} min - Cliente Invitado</p>
                                    </div>
                                </div>
                                <div className="text-right font-extrabold text-slate-900">
                                    $ {(Math.random() * 100).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200">
                    <h3 className="text-xl font-bold mb-4">Acceso Rápido POS</h3>
                    <p className="text-indigo-100 mb-8 font-medium leading-relaxed">Vende e imprime recibos en segundos con nuestra interfaz optimizada para terminales táctiles.</p>
                    <a
                        href="http://localhost:3001"
                        target="_blank"
                        className="block w-full bg-white text-indigo-600 text-center py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition shadow-xl"
                    >
                        Abrir Punto de Venta
                    </a>
                    <div className="mt-8 pt-8 border-t border-indigo-500/50 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-indigo-200 font-medium">Terminales Activas</span>
                            <span className="font-bold">03</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-indigo-200 font-medium">Estado</span>
                            <span className="bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-widest">En Línea</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, change, icon, color }: { title: string, value: string, change: string, icon: React.ReactNode, color: string }) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 group hover:border-indigo-100 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${color} group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                <div className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    {change}
                </div>
            </div>
            <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
            </div>
        </div>
    );
}
