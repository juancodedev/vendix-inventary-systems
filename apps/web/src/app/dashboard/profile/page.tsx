import React from 'react';

export default function ProfilePage() {
    return (
        <div className="max-w-4xl">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Configuración de Perfil</h2>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8">
                <div className="flex items-center space-x-6 mb-10 pb-10 border-b border-slate-50">
                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-3xl font-black text-indigo-700">
                        JP
                    </div>
                    <div>
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition">
                            Cambiar Foto
                        </button>
                    </div>
                </div>

                <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Nombre</label>
                        <input
                            type="text"
                            defaultValue="Juan"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Apellido</label>
                        <input
                            type="text"
                            defaultValue="Perez"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-slate-700">Email Corporativo</label>
                        <input
                            type="email"
                            defaultValue="juan.perez@vendix.com"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                        />
                    </div>

                    <div className="md:col-span-2 pt-4">
                        <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
