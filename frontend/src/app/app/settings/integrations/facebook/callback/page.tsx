'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { facebookAdsService } from '@/services/facebookAdsService';
import { Loader2 } from 'lucide-react';

export default function FacebookCallbackPage() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const [status, setStatus] = useState('Autenticando...');

    useEffect(() => {
        if (error) {
            setStatus('Erro na autenticação: ' + error);
            setTimeout(() => window.close(), 3000);
            return;
        }

        if (code) {
            const handleAuth = async () => {
                try {
                    // Exchange code for token
                    // We need to pass the same redirect URI used in the login URL
                    const redirectUri = window.location.origin + window.location.pathname;
                    const accessToken = await facebookAdsService.handleCallback(code, redirectUri);

                    // Send token back to opener
                    if (window.opener) {
                        window.opener.postMessage({ type: 'FB_AUTH_SUCCESS', accessToken }, '*');
                    }

                    setStatus('Conectado com sucesso! Fechando...');
                    setTimeout(() => window.close(), 1500);
                } catch (err: any) {
                    console.error(err);
                    setStatus('Falha ao trocar token: ' + (err.response?.data?.error || err.message));
                }
            };
            handleAuth();
        }
    }, [code, error]);

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600 font-medium">{status}</p>
        </div>
    );
}
