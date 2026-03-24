import React from 'react';
import { LayoutDashboard, Store, Package, ShoppingCart, BarChart2, Settings, Users } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
                <div className="p-6">
                    <div className="text-2xl font-bold text-indigo-600">Vendix</div>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
                    <NavItem icon={<Store size={20} />} label="Sucursales" />
                    <NavItem icon={<Package size={20} />} label="Inventario" />
                    <NavItem icon={<ShoppingCart size={20} />} label="Ventas (POS)" />
                    <NavItem icon={<BarChart2 size={20} />} label="Analytics" />
                    <NavItem icon={<Users size={20} />} label="Usuarios" />
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <NavItem icon={<Settings size={20} />} label="Configuración" />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Bienvenido de nuevo</h1>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-700">Juan Pérez</p>
                            <p className="text-xs text-slate-500">Mi Tienda S.A.</p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-100 rounded-full border border-indigo-200" />
                    </div>
                </header>

                {children}
            </main>
        </div>
    );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <a
            href="#"
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${active
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-50'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
        >
            {icon}
            <span>{label}</span>
        </a>
    );
}
