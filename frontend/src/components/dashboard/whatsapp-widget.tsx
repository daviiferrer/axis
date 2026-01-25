'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, RefreshCw, Smartphone, Wifi, WifiOff } from "lucide-react";
import { wahaService } from "@/services/waha";
import { Skeleton } from "@/components/ui/skeleton";
import Image from 'next/image';

export function WhatsAppWidget() {
    const [session, setSession] = useState<any>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadSession = async () => {
        try {
            // Using 'default' session for now or fetching from API
            // Ideally backend should return the "primary" session for this user
            const sessions = await wahaService.getSessions();
            const primary = sessions.find((s: any) => s.status !== 'STOPPED') || sessions[0];

            if (primary) {
                setSession(primary);
                if (primary.status === 'SCAN_QR_CODE') {
                    const qr = await wahaService.getScreenshot(primary.name);
                    setQrCode(qr ? URL.createObjectURL(qr) : null);
                } else {
                    setQrCode(null);
                }
            }
        } catch (error) {
            console.error("Failed to load WhatsApp session", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadSession();
        // Poll status every 10s if Scan QR
        const interval = setInterval(() => {
            // Only poll if we have a session to check or no session loaded yet
            loadSession();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        loadSession();
    };

    if (loading) {
        return <Skeleton className="h-[200px] w-full rounded-xl" />;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'WORKING': return 'bg-green-500 hover:bg-green-600';
            case 'SCAN_QR_CODE': return 'bg-yellow-500 hover:bg-yellow-600';
            case 'STOPPED': return 'bg-red-500 hover:bg-red-600';
            default: return 'bg-gray-500';
        }
    };

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Conexão WhatsApp
                </CardTitle>
                {session?.status === 'WORKING' ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                )}
            </CardHeader>
            <CardContent>
                {!session ? (
                    <div className="flex flex-col items-center justify-center h-[140px] gap-2 text-center">
                        <p className="text-muted-foreground text-sm">Nenhuma sessão encontrada.</p>
                        <Button size="sm" onClick={() => wahaService.startSession('default')}>Iniciar Sessão</Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{session.name}</span>
                            <Badge className={getStatusColor(session.status)}>{session.status}</Badge>
                        </div>

                        {session.status === 'SCAN_QR_CODE' && qrCode && (
                            <div className="relative aspect-square w-full max-w-[150px] mx-auto bg-white p-2 rounded-lg border">
                                <Image
                                    src={qrCode}
                                    alt="QR Code"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        )}

                        {session.status === 'WORKING' && (
                            <div className="text-xs text-muted-foreground text-center">
                                Sessão ativa e pronta para envio.
                            </div>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-auto"
                            onClick={handleRefresh}
                            disabled={refreshing}
                        >
                            <RefreshCw className={`h-3 w-3 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
