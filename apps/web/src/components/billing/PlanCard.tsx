'use client';

import React from 'react';

type PlanFeatureMap = Record<string, boolean>;
type PlanLimitMap = Record<string, number | null>;

export interface BillingPlan {
    id: string;
    code: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    interval: 'MONTHLY' | 'YEARLY';
    features: PlanFeatureMap;
    limits: PlanLimitMap;
}

interface PlanCardProps {
    plan: BillingPlan;
    currentPlanCode?: string;
    onSelectPlan?: (planCode: string) => void;
    loading?: boolean;
}

const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(price);
};

const readableInterval = (value: 'MONTHLY' | 'YEARLY') => (value === 'YEARLY' ? 'año' : 'mes');

export default function PlanCard({ plan, currentPlanCode, onSelectPlan, loading }: PlanCardProps) {
    const isCurrent = currentPlanCode === plan.code;

    return (
        <article className={`rounded-3xl border p-6 shadow-sm transition ${isCurrent ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{plan.code}</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900">{plan.name}</h3>
                    {plan.description ? <p className="mt-2 text-sm font-medium text-slate-600">{plan.description}</p> : null}
                </div>
                {isCurrent ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">Actual</span> : null}
            </div>

            <p className="mt-6 text-4xl font-black text-slate-900">
                {formatPrice(plan.price, plan.currency)}
                <span className="ml-2 text-base font-semibold text-slate-500">/{readableInterval(plan.interval)}</span>
            </p>

            <div className="mt-6 space-y-2">
                {Object.entries(plan.limits).map(([metric, value]) => (
                    <p key={metric} className="text-sm font-medium text-slate-700">
                        <span className="font-black uppercase tracking-[0.08em] text-slate-500">{metric}</span>: {value == null ? 'Ilimitado' : value}
                    </p>
                ))}
            </div>

            <ul className="mt-6 space-y-2">
                {Object.entries(plan.features).map(([feature, enabled]) => (
                    <li key={feature} className={`text-sm font-semibold ${enabled ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                        {feature.replaceAll('_', ' ')}
                    </li>
                ))}
            </ul>

            {onSelectPlan ? (
                <button
                    type="button"
                    onClick={() => onSelectPlan(plan.code)}
                    disabled={loading || isCurrent}
                    className="mt-6 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    {isCurrent ? 'Plan activo' : loading ? 'Procesando...' : 'Elegir plan'}
                </button>
            ) : null}
        </article>
    );
}
