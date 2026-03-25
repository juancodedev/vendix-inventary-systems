'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type SubscriptionData = {
    subscription: {
        status: string;
        plan: {
            code: string;
            name: string;
        };
        currentPeriodStart: string;
        currentPeriodEnd: string;
        cancelAtPeriodEnd: boolean;
    };
};

export default function SubscriptionPage() {
    const [data, setData] = useState<SubscriptionData | null>(null);

    useEffect(() => {
        fetch('/api/subscription', { cache: 'no-store' })
            .then((response) => response.json())
            .then((payload) => setData(payload?.data ?? null))
            .catch((error) => console.error(error));
    }, []);

    if (!data) {
        return <div className="min-h-screen bg-slate-50 px-6 py-10">Cargando estado de suscripcion...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 px-6 py-10 md:px-10">
            <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Subscription</p>
                <h1 className="mt-3 text-4xl font-black text-slate-900">Estado de tu suscripcion</h1>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Plan</p>
                        <p className="mt-2 text-xl font-black text-slate-900">{data.subscription.plan.name}</p>
                        <p className="text-sm font-semibold text-slate-500">{data.subscription.plan.code}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Estado</p>
                        <p className="mt-2 text-xl font-black text-slate-900">{data.subscription.status}</p>
                        <p className="text-sm font-semibold text-slate-500">Cancelación programada: {data.subscription.cancelAtPeriodEnd ? 'Si' : 'No'}</p>
                    </div>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-600">Ciclo activo</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                        {new Date(data.subscription.currentPeriodStart).toLocaleDateString('es-ES')} - {new Date(data.subscription.currentPeriodEnd).toLocaleDateString('es-ES')}
                    </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/pricing" className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-indigo-700">Cambiar plan</Link>
                    <Link href="/billing" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50">Ver facturacion</Link>
                </div>
            </div>
        </div>
    );
}
