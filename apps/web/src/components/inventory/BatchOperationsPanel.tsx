'use client';

import React, { useMemo, useState } from 'react';
import type { InventoryListItem } from '@vendix/types';
import { buildInventoryCsv } from '@/lib/inventory';

type BatchOperationsPanelProps = {
    items: InventoryListItem[];
};

const exampleImportCsv = `sku,name,price,locationId,quantity,minStock,category\nVDX-POS-001,Terminal SmartPOS VDX One,449.90,loc-store-central,12,4,POS`;

export default function BatchOperationsPanel({ items }: BatchOperationsPanelProps) {
    const [mode, setMode] = useState<'import' | 'update'>('import');
    const [payload, setPayload] = useState(exampleImportCsv);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const templateForUpdate = useMemo(() => {
        const rows = items.slice(0, 3).map((item) => ({
            sku: item.sku,
            productId: item.id,
            locationId: item.stockByLocation[0]?.locationId,
            quantity: item.stockByLocation[0]?.quantity ?? 0,
            minStock: item.stockByLocation[0]?.minStock ?? item.minStock,
            price: item.price,
        }));

        return JSON.stringify(rows, null, 2);
    }, [items]);

    const handleLoadTemplate = () => {
        setPayload(mode === 'import' ? exampleImportCsv : templateForUpdate);
        setError('');
        setMessage('Template cargado. Ajusta datos y conecta al endpoint POST /inventory/batch para persistir.');
    };

    const handleSimulate = () => {
        setError('');
        setMessage('');

        if (!payload.trim()) {
            setError('Ingresa contenido para ejecutar la operación masiva.');
            return;
        }

        if (mode === 'import') {
            const lines = payload.split(/\r?\n/).filter((line) => line.trim().length > 0);
            if (lines.length < 2) {
                setError('El CSV de importación debe contener encabezado y al menos una fila.');
                return;
            }

            setMessage(`Importación validada con ${lines.length - 1} filas. Endpoint objetivo: POST /inventory/batch con action=import.`);
            return;
        }

        try {
            const data = JSON.parse(payload);
            if (!Array.isArray(data) || data.length === 0) {
                setError('El payload update debe ser un arreglo JSON con al menos un item.');
                return;
            }

            setMessage(`Actualización masiva validada para ${data.length} items. Endpoint objetivo: POST /inventory/batch con action=update.`);
        } catch {
            setError('El payload update debe ser JSON válido.');
        }
    };

    const handleDownloadFilteredCsv = () => {
        const csv = buildInventoryCsv(items);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'inventory-batch-export.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Batch Ops</p>
                    <h3 className="mt-2 text-xl font-extrabold text-slate-900">Operaciones masivas</h3>
                </div>
                <button type="button" onClick={handleDownloadFilteredCsv} className="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                    Exportar CSV actual
                </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setMode('import')}
                    className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${mode === 'import' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Importar CSV
                </button>
                <button
                    type="button"
                    onClick={() => setMode('update')}
                    className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${mode === 'update' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Edición masiva
                </button>
                <button type="button" onClick={handleLoadTemplate} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-slate-700">
                    Cargar template
                </button>
            </div>

            <textarea
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
                rows={8}
                className="mt-4 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 font-mono text-xs text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white"
            />

            {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}
            {message ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p> : null}

            <button type="button" onClick={handleSimulate} className="mt-5 w-full rounded-2xl bg-indigo-600 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-indigo-700">
                Validar batch
            </button>
        </section>
    );
}