'use client';

import React, { useEffect, useState } from 'react';
import PlanCard, { type BillingPlan } from '@/components/billing/PlanCard';
import UpgradeModal from '@/components/billing/UpgradeModal';

export default function PricingPage() {
    const [plans, setPlans] = useState<BillingPlan[]>([]);
    const [currentPlan, setCurrentPlan] = useState<string>();
    const [loadingPlan, setLoadingPlan] = useState<string>();
    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
        const load = async () => {
            const [plansResponse, subscriptionResponse] = await Promise.all([
                fetch('/api/plans', { cache: 'no-store' }),
                fetch('/api/subscription', { cache: 'no-store' }),
            ]);

            const plansPayload = await plansResponse.json();
            const subscriptionPayload = await subscriptionResponse.json();

            setPlans(plansPayload?.data ?? []);
            setCurrentPlan(subscriptionPayload?.data?.subscription?.plan?.code);
        };

        load().catch((error) => {
            console.error(error);
        });
    }, []);

    const choosePlan = async (planCode: string) => {
        setLoadingPlan(planCode);

        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planCode,
                    successUrl: `${window.location.origin}/subscription?status=success`,
                    cancelUrl: `${window.location.origin}/pricing?status=cancelled`,
                }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.error ?? 'No fue posible suscribirte.');
            }

            if (payload.mode === 'checkout' && payload.checkoutUrl) {
                window.location.href = payload.checkoutUrl;
                return;
            }

            window.location.href = '/subscription?status=updated';
        } catch (error) {
            alert(String(error));
        } finally {
            setLoadingPlan(undefined);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 px-6 py-10 md:px-10">
            <div className="mx-auto max-w-6xl">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Pricing</p>
                    <h1 className="mt-3 text-4xl font-black text-slate-900">Planes para escalar tu inventario + POS</h1>
                    <p className="mt-3 max-w-3xl text-sm font-medium text-slate-600">Elige un plan por tenant. Puedes cambiar entre FREE, BASIC y PRO. Los upgrades se aplican de inmediato y los downgrades se programan al final del ciclo.</p>
                    <button type="button" onClick={() => setOpenModal(true)} className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-slate-700 hover:bg-slate-50">
                        Upgrade rápido
                    </button>
                </section>

                <section className="mt-8 grid gap-5 lg:grid-cols-3">
                    {plans.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            currentPlanCode={currentPlan}
                            onSelectPlan={choosePlan}
                            loading={loadingPlan === plan.code}
                        />
                    ))}
                </section>
            </div>

            <UpgradeModal open={openModal} plans={plans} onClose={() => setOpenModal(false)} />
        </div>
    );
}
