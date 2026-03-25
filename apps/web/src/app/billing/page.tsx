'use client';

import React, { useEffect, useState } from 'react';
import BillingHistory from '@/components/billing/BillingHistory';
import UsageMeter from '@/components/billing/UsageMeter';

type SubscriptionPayload = {
    subscription: {
        id: string;
        status: string;
        cancelAtPeriodEnd: boolean;
        currentPeriodEnd: string;
        plan: {
            name: string;
            code: string;
        };
    };
    usage: Array<{
        metric: string;
        used: number;
        limit: number | null;
    }>;
    invoices: Array<{
        id: string;
        amount: number;
        currency: string;
        status: string;
        dueDate?: string;
        paidAt?: string;
        createdAt: string;
    }>;
};

export default function BillingPage() {
    const [data, setData] = useState<SubscriptionPayload | null>(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        const response = await fetch('/api/subscription', { cache: 'no-store' });
        const payload = await response.json();
        setData(payload?.data ?? null);
        setLoading(false);
    };

    useEffect(() => {
        load().catch((error) => {
            console.error(error);
            setLoading(false);
        });
    }, []);

    const updateCancelState = async (action: 'cancel' | 'resume') => {
        const response = await fetch(`/api/${action}`, { method: 'POST' });
        if (!response.ok) {
            const payload = await response.json();
            alert(payload?.error ?? 'No fue posible actualizar la suscripcion.');
            return;
        }

        await load();
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-50 px-6 py-10">Cargando billing...</div>;
    }

    if (!data) {
        return <div className="min-h-screen bg-slate-50 px-6 py-10">No se encontro informacion de billing.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 px-6 py-10 md:px-10">
            <div className="mx-auto max-w-6xl space-y-8">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Billing Center</p>
                    <h1 className="mt-3 text-4xl font-black text-slate-900">Suscripcion y facturacion</h1>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-indigo-700">Plan {data.subscription.plan.code}</span>
                        <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-slate-700">Estado {data.subscription.status}</span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600">Periodo actual hasta {new Date(data.subscription.currentPeriodEnd).toLocaleDateString('es-ES')}</p>

                    <div className="mt-6 flex gap-3">
                        {data.subscription.cancelAtPeriodEnd ? (
                            <button type="button" onClick={() => updateCancelState('resume')} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-emerald-700">Reanudar suscripcion</button>
                        ) : (
                            <button type="button" onClick={() => updateCancelState('cancel')} className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-rose-700">Cancelar al final del ciclo</button>
                        )}
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    {data.usage.map((item) => (
                        <UsageMeter key={item.metric} metric={item.metric} used={item.used} limit={item.limit} />
                    ))}
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-black text-slate-900">Historial de facturas</h2>
                    <BillingHistory invoices={data.invoices} />
                </section>
            </div>
        </div>
    );
}
