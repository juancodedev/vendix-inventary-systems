'use client';

import { useEffect } from 'react';

export default function PWARegister() {
    useEffect(() => {
        if (!('serviceWorker' in navigator)) {
            return;
        }

        const register = async () => {
            try {
                await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            } catch {
                // service worker registration is optional for local/dev contexts
            }
        };

        void register();
    }, []);

    return null;
}
