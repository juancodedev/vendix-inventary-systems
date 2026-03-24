import React from 'react';
import { CheckCircle, BarChart3, Store, Smartphone, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="text-2xl font-bold tracking-tight text-indigo-600">Vendix</div>
                <div className="hidden md:flex space-x-8 font-medium">
                    <a href="#features" className="hover:text-indigo-600 transition">Funcionalidades</a>
                    <a href="#pricing" className="hover:text-indigo-600 transition">Precios</a>
                </div>
                <div className="flex space-x-4">
                    <button className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 transition">Login</button>
                    <button className="bg-indigo-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
                        Probar gratis
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="px-8 pt-20 pb-32 max-w-7xl mx-auto text-center">
                <div className="inline-block bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 tracking-wide uppercase">
                    Reinventando el POS
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight leading-tight">
                    Tu inventario y ventas, <br />
                    <span className="text-indigo-600">bajo control total.</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
                    La plataforma multitenant más avanzada para gestionar inventarios, ventas multisucursal y operaciones en tiempo real. Diseñada para escalar con tu negocio.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <button className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-2xl shadow-indigo-200">
                        Empieza ahora
                    </button>
                    <button className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 px-10 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition">
                        Ver demo
                    </button>
                </div>
                <div className="mt-20 relative px-4">
                    <div className="bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 max-w-5xl mx-auto">
                        <div className="bg-slate-100 rounded-2xl aspect-video flex items-center justify-center text-slate-400 font-medium">
                            Dashboards Interactivos - Visualización en vivo
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="bg-white py-32 px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold mb-4 tracking-tight">Todo lo que necesitas para operar</h2>
                        <p className="text-slate-500 text-lg">Módulos especializados integrados en una sola plataforma.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-12">
                        <FeatureCard
                            icon={<Store className="w-8 h-8 text-indigo-600" />}
                            title="Multisucursal Nativo"
                            description="Gestiona bodegas y tiendas físicas desde un solo lugar. Stock sincronizado al instante."
                        />
                        <FeatureCard
                            icon={<BarChart3 className="w-8 h-8 text-indigo-600" />}
                            title="Analytics Avanzado"
                            description="Reportes inteligentes y KPIs para tomar decisiones basadas en datos reales."
                        />
                        <FeatureCard
                            icon={<Smartphone className="w-8 h-8 text-indigo-600" />}
                            title="POS Mobile-First"
                            description="Vende desde cualquier tablet o celular. Preparado para operar offline si es necesario."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="w-8 h-8 text-indigo-600" />}
                            title="Seguridad Empresarial"
                            description="Aislamiento de datos multitenant y roles granulares para proteger tu información."
                        />
                        <FeatureCard
                            icon={<CheckCircle className="w-8 h-8 text-indigo-600" />}
                            title="Inventario Inteligente"
                            description="Alertas de bajo stock, SKU management y actualizaciones masivas en segundos."
                        />
                        <FeatureCard
                            icon={<CheckCircle className="w-8 h-8 text-indigo-600" />}
                            title="Facturación Integrada"
                            description="Genera documentos y reportes contables automáticamente al registrar ventas."
                        />
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-32 px-8 bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold mb-4">Planes diseñados para crecer</h2>
                        <p className="text-slate-500 text-lg">Elige el plan que mejor se adapte a tu etapa actual.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <PricingCard
                            name="Free"
                            price="0"
                            features={["1 Sucursal", "Hasta 50 productos", "Dashboard básico", "1 Usuario"]}
                        />
                        <PricingCard
                            name="Basic"
                            price="29"
                            features={["3 Sucursales", "Productos ilimitados", "Analytics intermedio", "5 Usuarios", "Soporte email"]}
                            highlighted
                        />
                        <PricingCard
                            name="Pro"
                            price="99"
                            features={["Sucursales ilimitadas", "Reportes avanzados", "API Access", "Usuarios ilimitados", "Soporte 24/7"]}
                        />
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <footer className="bg-indigo-600 py-20 px-8 text-center text-white">
                <h2 className="text-4xl font-bold mb-8 tracking-tight">¿Listo para transformar tu operación?</h2>
                <button className="bg-white text-indigo-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-slate-100 transition shadow-xl">
                    Empieza gratis ahora
                </button>
                <div className="mt-12 text-indigo-200 text-sm font-medium">
                    © 2026 Vendix Systems. Todos los derechos reservados.
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="group p-8 rounded-2xl border border-slate-100 bg-white hover:shadow-2xl hover:border-indigo-100 transition-all duration-300">
            <div className="mb-6 bg-slate-50 w-16 h-16 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-slate-600 leading-relaxed">{description}</p>
        </div>
    );
}

function PricingCard({ name, price, features, highlighted = false }: { name: string, price: string, features: string[], highlighted?: boolean }) {
    return (
        <div className={`p-10 rounded-3xl border ${highlighted ? 'bg-white border-indigo-600 shadow-2xl scale-105 relative z-10' : 'bg-slate-50 border-slate-200'} transition-all`}>
            {highlighted && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase">Más popular</div>}
            <h3 className="text-2xl font-bold mb-2">{name}</h3>
            <div className="flex items-baseline mb-8">
                <span className="text-4xl font-extrabold tracking-tight">${price}</span>
                <span className="text-slate-500 ml-2">/ mes</span>
            </div>
            <ul className="mb-10 space-y-4">
                {features.map((f, i) => (
                    <li key={i} className="flex items-center text-slate-700">
                        <CheckCircle className="w-5 h-5 text-indigo-500 mr-3 shrink-0" />
                        <span className="font-medium">{f}</span>
                    </li>
                ))}
            </ul>
            <button className={`w-full py-4 rounded-xl font-bold transition-all ${highlighted ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}>
                Seleccionar plan
            </button>
        </div>
    );
}
