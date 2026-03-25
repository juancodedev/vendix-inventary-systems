import React from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    Settings,
    Store,
    LogOut,
    ExternalLink
} from 'lucide-react';

export default function Sidebar() {
    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', href: '/dashboard' },
        { icon: <Package size={20} />, label: 'Inventario', href: '/dashboard/inventory' },
        { icon: <ShoppingCart size={20} />, label: 'Movimientos', href: '/dashboard/inventory/movements' },
        { icon: <Store size={20} />, label: 'Transferencias', href: '/dashboard/inventory/transfer' },
        { icon: <Users size={20} />, label: 'Usuarios', href: '/dashboard/users' },
        { icon: <Store size={20} />, label: 'Mi Tienda', href: '/dashboard/settings' },
        { icon: <Settings size={20} />, label: 'Configuración', href: '/dashboard/profile' },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
            <div className="p-6">
                <div className="text-2xl font-bold tracking-tight text-indigo-600 flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-lg">V</div>
                    Vendix
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2 py-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Menú Principal</p>
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center space-x-3 px-3 py-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group font-medium"
                    >
                        <span className="text-slate-400 group-hover:text-indigo-600">{item.icon}</span>
                        <span>{item.label}</span>
                    </Link>
                ))}

                <div className="pt-8">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Punto de Venta</p>
                    <a
                        href="http://localhost:3001"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 group"
                    >
                        <div className="flex items-center space-x-3">
                            <ShoppingCart size={20} />
                            <span className="font-bold">Abrir POS</span>
                        </div>
                        <ExternalLink size={14} className="opacity-50 group-hover:opacity-100" />
                    </a>
                </div>
            </nav>

            <div className="p-4 border-t border-slate-100">
                <button className="flex items-center space-x-3 w-full px-3 py-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}
