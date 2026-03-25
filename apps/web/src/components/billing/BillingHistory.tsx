import React from 'react';

interface BillingHistoryItem {
    id: string;
    amount: number;
    currency: string;
    status: string;
    dueDate?: string;
    paidAt?: string;
    createdAt: string;
}

interface BillingHistoryProps {
    invoices: BillingHistoryItem[];
}

const formatMoney = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency,
    }).format(amount);
};

export default function BillingHistory({ invoices }: BillingHistoryProps) {
    if (!invoices.length) {
        return <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-500">No hay facturas registradas.</p>;
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">Monto</th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">Pago</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {invoices.map((invoice) => (
                        <tr key={invoice.id}>
                            <td className="px-4 py-3 text-sm font-semibold text-slate-700">{new Date(invoice.createdAt).toLocaleDateString('es-ES')}</td>
                            <td className="px-4 py-3 text-sm font-bold text-slate-900">{formatMoney(invoice.amount, invoice.currency)}</td>
                            <td className="px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">{invoice.status}</td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-500">{invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('es-ES') : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
