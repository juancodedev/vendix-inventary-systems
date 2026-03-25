import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWARegister from '@/components/pos/PWARegister';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Vendix | SaaS Multitenant POS & Inventory",
    description: "Advanced inventory and POS management for modern businesses.",
    manifest: '/manifest.webmanifest',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className="scroll-smooth">
            <body className={inter.className}>
                <PWARegister />
                {children}
            </body>
        </html>
    );
}
