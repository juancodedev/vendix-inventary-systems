import React from 'react';

interface UsageMeterProps {
    metric: string;
    used: number;
    limit: number | null;
}

export default function UsageMeter({ metric, used, limit }: UsageMeterProps) {
    const percentage = limit == null || limit === 0 ? 0 : Math.min((used / limit) * 100, 100);
    const warning = limit != null && percentage >= 80;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{metric}</p>
                <p className={`text-sm font-black ${warning ? 'text-amber-600' : 'text-slate-700'}`}>
                    {limit == null ? `${used} / ilimitado` : `${used} / ${limit}`}
                </p>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                    className={`h-full rounded-full transition-all ${warning ? 'bg-amber-500' : 'bg-indigo-600'}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
