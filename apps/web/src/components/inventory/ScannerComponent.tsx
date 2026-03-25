'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, ScanLine, Search } from 'lucide-react';

type ScannerComponentProps = {
    onDetected: (value: string) => void;
};

type DetectorResult = {
    rawValue?: string;
};

type BarcodeDetectorLike = {
    detect: (source: HTMLVideoElement) => Promise<DetectorResult[]>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

export default function ScannerComponent({ onDetected }: ScannerComponentProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<number | null>(null);
    const [manualCode, setManualCode] = useState('');
    const [status, setStatus] = useState('Usa la camara para leer codigos QR o de barras, o escribe el codigo manualmente.');
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
            }
            streamRef.current?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    const stopScanner = () => {
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsScanning(false);
    };

    const startScanner = async () => {
        const BarcodeDetectorApi = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
        if (!BarcodeDetectorApi) {
            setStatus('Este navegador no expone BarcodeDetector. Usa el input manual como fallback.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            const detector = new BarcodeDetectorApi({ formats: ['qr_code', 'code_128', 'ean_13', 'ean_8'] });
            setStatus('Escaneando... apunta la camara al producto.');
            setIsScanning(true);

            intervalRef.current = window.setInterval(async () => {
                if (!videoRef.current) {
                    return;
                }

                const results = await detector.detect(videoRef.current);
                const firstValue = results[0]?.rawValue?.trim();
                if (!firstValue) {
                    return;
                }

                stopScanner();
                setStatus(`Codigo detectado: ${firstValue}`);
                setManualCode(firstValue);
                onDetected(firstValue);
            }, 650);
        } catch (error) {
            setStatus(`No fue posible iniciar la camara. ${String(error)}`);
            stopScanner();
        }
    };

    const handleManualSearch = () => {
        if (!manualCode.trim()) {
            setStatus('Ingresa un SKU, QR o codigo de barras valido.');
            return;
        }

        setStatus(`Busqueda manual lista para ${manualCode.trim()}.`);
        onDetected(manualCode.trim());
    };

    return (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Scanner</p>
                    <h3 className="mt-2 text-xl font-extrabold text-slate-900">Busqueda por camara</h3>
                </div>
                <button
                    type="button"
                    onClick={isScanning ? stopScanner : startScanner}
                    className={`rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.16em] transition ${isScanning ? 'bg-rose-50 text-rose-700' : 'bg-slate-900 text-white hover:bg-slate-700'}`}
                >
                    <span className="inline-flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        {isScanning ? 'Detener' : 'Activar camara'}
                    </span>
                </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-slate-50">
                <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />
                {!isScanning ? (
                    <div className="flex aspect-[4/3] w-full items-center justify-center">
                        <div className="text-center text-slate-400">
                            <ScanLine className="mx-auto h-10 w-10" />
                            <p className="mt-3 text-sm font-semibold">Activa la camara para escanear</p>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="mt-4 flex gap-3">
                <input
                    value={manualCode}
                    onChange={(event) => setManualCode(event.target.value)}
                    placeholder="SKU, barcode o QR"
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white"
                />
                <button type="button" onClick={handleManualSearch} className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                    <Search className="h-5 w-5" />
                </button>
            </div>

            <p className="mt-4 text-sm font-medium leading-6 text-slate-500">{status}</p>
        </section>
    );
}