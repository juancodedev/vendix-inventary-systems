import React from 'react';
import { Store, MapPin, Phone, Mail } from 'lucide-react';

export default function StoreSettingsPage() {
    return (
        <div className="max-w-4xl">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Administración de la Tienda</h2>

            <div className="space-y-8">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Store className="text-indigo-600" size={24} />
                        Información General
                    </h3>

                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Nombre de la Empresa</label>
                                <input
                                    type="text"
                                    defaultValue="Vendix Central"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">RUC / Tax ID</label>
                                <input
                                    type="text"
                                    defaultValue="1790000000001"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <MapPin size={16} /> Dirección Principal
                            </label>
                            <input
                                type="text"
                                defaultValue="Av. de los Granados y Av. Eloy Alfaro"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Phone size={16} /> Teléfono
                                </label>
                                <input
                                    type="text"
                                    defaultValue="+593 99 999 9999"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Mail size={16} /> Email de Contacto
                                </label>
                                <input
                                    type="email"
                                    defaultValue="contacto@vendix.com"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 uppercase tracking-wide">
                                Actualizar Información
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
