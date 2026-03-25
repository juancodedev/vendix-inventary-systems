import Link from 'next/link';

export default function NotFoundPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
            <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">404</p>
                <h1 className="mt-3 text-3xl font-extrabold text-slate-900">Página no encontrada</h1>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                    La ruta que intentaste abrir no existe o fue movida dentro del panel.
                </p>
                <Link
                    href="/dashboard"
                    className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-700"
                >
                    Volver al dashboard
                </Link>
            </section>
        </main>
    );
}