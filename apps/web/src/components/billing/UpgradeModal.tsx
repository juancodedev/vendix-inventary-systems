'use client';

import React, { useMemo, useState } from 'react';
import type { BillingPlan } from './PlanCard';

interface UpgradeModalProps {
    open: boolean;
    plans: BillingPlan[];
    onClose: () => void;
}

export default function UpgradeModal({ open, plans, onClose }: UpgradeModalProps) {
    const [selectedPlan, setSelectedPlan] = useState('BASIC');
    const [loading, setLoading] = useState(false);
    const selected = useMemo(() => plans.find((plan) => plan.code === selectedPlan), [plans, selectedPlan]);

    if (!open) {
        return null;
    }

    const subscribe = async () => {
        if (!selected) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planCode: selected.code,
                    successUrl: `${window.location.origin}/subscription?status=success`,
                    cancelUrl: `${window.location.origin}/pricing?status=cancelled`,
                }),
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'No fue posible iniciar el checkout.');
            }

            if (payload.mode === 'checkout' && payload.checkoutUrl) {
                window.location.href = payload.checkoutUrl;
                return;
            }

            window.location.href = '/subscription?status=updated';
        } catch (error) {
            alert(String(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Upgrade</p>
                        <h3 className="mt-2 text-2xl font-black text-slate-900">Cambia tu suscripcion</h3>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-3 py-1 text-sm font-bold text-slate-600 hover:bg-slate-50">Cerrar</button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {plans.map((plan) => (
                        <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlan(plan.code)}
                            className={`rounded-2xl border px-4 py-3 text-left ${selectedPlan === plan.code ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}`}
                        >
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{plan.code}</p>
                            <p className="mt-1 text-lg font-black text-slate-900">{plan.name}</p>
                        </button>
                    ))}
                </div>

                <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-600">Plan seleccionado</p>
                    <p className="mt-1 text-xl font-black text-slate-900">{selected?.name}</p>
                    <p className="text-sm font-medium text-slate-500">{selected?.description}</p>
                </div>

                <button type="button" onClick={subscribe} disabled={loading} className="mt-6 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-white hover:bg-indigo-700 disabled:bg-slate-300">
                    {loading ? 'Procesando...' : 'Continuar a pago'}
                </button>
            </div>
        </div>
    );
}
