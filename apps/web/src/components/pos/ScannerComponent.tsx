'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';

interface ScannerComponentProps {
    onDetected: (code: string) => void;
}

export default function ScannerComponent({ onDetected }: ScannerComponentProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [enabled, setEnabled] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let intervalId: number | null = null;

        const start = async () => {
            if (!enabled || !videoRef.current) {
                return;
            }

            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: 'environment' },
                    },
                    audio: false,
                });
                videoRef.current.srcObject = stream;
                await videoRef.current.play();

                const detectorCtor = window.BarcodeDetector as
                    | (new (options?: { formats?: string[] }) => BarcodeDetector)
                    | undefined;

                if (!detectorCtor) {
                    setError('BarcodeDetector no soportado en este navegador.');
                    return;
                }

                const detector = new detectorCtor({
                    formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e'],
                });

                intervalId = window.setInterval(async () => {
                    if (!videoRef.current) {
                        return;
                    }

                    try {
                        const barcodes = await detector.detect(videoRef.current);
                        const code = barcodes[0]?.rawValue?.trim();
                        if (code) {
                            onDetected(code);
                        }
                    } catch {
                        // keep scanning
                    }
                }, 300);
            } catch {
                setError('No se pudo abrir la camara para escaneo.');
            }
        };

        void start();

        return () => {
            if (intervalId) {
                window.clearInterval(intervalId);
            }

            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [enabled, onDetected]);

    return (
        <section className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
            <button
                type="button"
                onClick={() => setEnabled((current) => !current)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white font-semibold"
            >
                {enabled ? <CameraOff size={18} /> : <Camera size={18} />}
                {enabled ? 'Detener camara' : 'Escanear con camara'}
            </button>

            {enabled && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-black/90">
                    <video ref={videoRef} className="w-full h-32 object-cover" muted playsInline />
                </div>
            )}

            {error && <p className="text-xs text-amber-700">{error}</p>}
        </section>
    );
}

declare global {
    interface Window {
        BarcodeDetector?: {
            new (options?: { formats?: string[] }): BarcodeDetector;
        };
    }

    interface BarcodeDetector {
        detect(source: ImageBitmapSource): Promise<Array<{ rawValue?: string }>>;
    }
}
