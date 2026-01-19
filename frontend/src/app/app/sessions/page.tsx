'use client'

import React, { useEffect, useState } from 'react'
import { Plus, Smartphone, Loader2, RefreshCw, MoreVertical, Search, Zap, Trash2 } from 'lucide-react'
import { SimulatorDialog } from '@/components/app/SimulatorDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { parsePhoneNumber } from 'libphonenumber-js'
import { Button } from '@/components/ui/button'
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from '@/context/AuthContext'
import { wahaService } from '@/services/waha'
import useSWR from 'swr'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

// WhatsApp Logo Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
)

// Format WhatsApp ID to international phone number format
const formatPhoneNumber = (waId: string): string => {
    try {
        // Remove @c.us suffix if present
        const phoneNumber = waId.replace('@c.us', '').replace('@s.whatsapp.net', '');
        const parsed = parsePhoneNumber('+' + phoneNumber);
        return parsed ? parsed.formatInternational() : phoneNumber;
    } catch {
        return waId;
    }
}

function QRCodeDisplay({ session, isVisible }: { session: string, isVisible: boolean }) {
    const { data: qrData, error } = useSWR(
        session && isVisible ? `/qr/${session}` : null,
        () => wahaService.getQR(session),
        {
            refreshInterval: 3000,
            keepPreviousData: true,
            onError: (err) => console.log('[QRCodeDisplay] SWR Error:', err)
        }
    )

    if (!isVisible) return null;

    let base64 = '';
    if (typeof qrData === 'string') {
        base64 = qrData;
    } else if (qrData?.data) {
        base64 = qrData.data;
    } else if (qrData?.url) {
        console.warn('[QRCodeDisplay] Received URL instead of base64:', qrData.url);
    }

    const qrSrc = base64 ? `data:image/png;base64,${base64}` : null

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Escanear QR Code</h3>

            <div className="bg-white p-2 rounded-lg border border-gray-200 mb-4">
                {qrSrc ? (
                    <div className="relative size-[200px]">
                        <img src={qrSrc} alt="QR Code" className="w-full h-full object-contain" />
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 opacity-50 animate-scan pointer-events-none" />
                    </div>
                ) : (
                    <div className="size-[200px] flex flex-col items-center justify-center bg-gray-50 rounded-lg">
                        <Loader2 className="size-8 text-blue-600 animate-spin mb-2" />
                        <span className="text-xs text-gray-500">Gerando...</span>
                    </div>
                )}
            </div>

            <p className="text-sm text-gray-500 text-center max-w-xs">
                Abra o WhatsApp &gt; Aparelhos Conectados &gt; <span className="text-blue-600 font-medium">Conectar Aparelho</span>
            </p>
        </div>
    )
}


export default function SessionsPage() {
    const { user } = useAuth()
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false)

    // ... existing hooks ...
    const [isCreating, setIsCreating] = useState(false)
    const [selectedSessionForQR, setSelectedSessionForQR] = useState<string | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newSessionName, setNewSessionName] = useState("")

    const { data: sessions = [], error, isLoading, mutate } = useSWR(
        '/sessions',
        () => wahaService.getSessions(true),
        {
            refreshInterval: 1000,
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            revalidateIfStale: true,
            dedupingInterval: 500
        }
    )

    const handleAction = async (action: 'start' | 'stop' | 'restart' | 'logout' | 'delete', sessionName: string) => {
        try {
            if (action !== 'delete') {
                const optimisticStatus = action === 'start' ? 'STARTING' : action === 'stop' ? 'STOPPED' : 'STARTING';
                mutate(
                    sessions.map((s: any) => s.name === sessionName ? { ...s, status: optimisticStatus } : s),
                    false
                );
            }

            switch (action) {
                case 'start': await wahaService.startSession(sessionName); break;
                case 'stop': await wahaService.stopSession(sessionName); break;
                case 'restart': await wahaService.restartSession(sessionName); break;
                case 'logout': await wahaService.logoutSession(sessionName); break;
                case 'delete':
                    if (!confirm(`Tem certeza que deseja excluir a sessão "${sessionName}"?`)) return;
                    mutate(sessions.filter((s: any) => s.name !== sessionName), false);
                    await wahaService.deleteSession(sessionName);
                    break;
            }

            await mutate();
            if (action === 'delete' && selectedSessionForQR === sessionName) setSelectedSessionForQR(null);
        } catch (error) {
            console.error(`Failed to ${action} session`, error);
            await mutate();
            alert(`Erro ao executar ação: ${action}`);
        }
    }

    const handleCreateSession = async () => {
        setIsCreating(true)
        try {
            await wahaService.createSession({ name: newSessionName || undefined })
            await mutate()
            setIsDialogOpen(false)
            setNewSessionName("")
        } catch (error) {
            console.error('Failed to create session', error)
        } finally {
            setIsCreating(false)
        }
    }

    useEffect(() => {
        const scanningSession = sessions.find((s: any) => s.status === 'SCAN_QR_CODE');
        if (scanningSession && !selectedSessionForQR) {
            setSelectedSessionForQR(scanningSession.name);
        }
    }, [sessions, selectedSessionForQR]);

    useEffect(() => {
        const fetchProfilesForWorkingSessions = async () => {
            for (const session of sessions) {
                if (session.status === 'WORKING' && !session.me) {
                    try {
                        const profileData = await wahaService.getMe(session.name);
                        mutate(
                            sessions.map((s: any) => s.name === session.name ? { ...s, me: profileData } : s),
                            false
                        );
                    } catch (error) {
                        console.log(`Failed to fetch profile for ${session.name}:`, error);
                    }
                }
            }
        };

        if (sessions.length > 0) {
            fetchProfilesForWorkingSessions();
        }
    }, [sessions, mutate]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'WORKING': return { text: 'Online', className: 'bg-green-100 text-green-700' };
            case 'SCAN_QR_CODE': return { text: 'Escanear QR', className: 'bg-yellow-100 text-yellow-700' };
            case 'STOPPED': return { text: 'Parado', className: 'bg-red-50 text-red-700' };
            case 'STARTING': return { text: 'Iniciando', className: 'bg-blue-50 text-blue-700' };
            case 'FAILED': return { text: 'Falha', className: 'bg-red-100 text-red-800' };
            default: return { text: status, className: 'bg-gray-100 text-gray-700' };
        }
    };

    return (
        <div className="h-full w-full bg-white flex flex-col font-inter">

            {/* Simple Clean Header */}
            <header className="h-16 px-8 flex items-center justify-between border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-inter">Sessões do WhatsApp</h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="rounded-full h-9 px-4 text-sm" onClick={() => setIsSimulatorOpen(true)}>
                        <Zap className="mr-2 size-4 text-amber-500 fill-current" />
                        Simulador
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-9 px-4 text-sm font-medium shadow-sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Nova Sessão
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Criar Nova Sessão</DialogTitle>
                                <DialogDescription>
                                    Dê um nome para identificar esta conexão.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                    Nome da Sessão
                                </Label>
                                <Input
                                    id="name"
                                    value={newSessionName}
                                    onChange={(e) => setNewSessionName(e.target.value)}
                                    placeholder="Ex: Comercial"
                                    className="mt-2"
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateSession(); }}
                                />
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateSession} disabled={isCreating} className="bg-blue-600">
                                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Criar
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto bg-white p-8">
                {/* ... existing content ... */}
                <div className="max-w-[1400px] mx-auto">
                    {/* ... grid ... */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* ... components ... */}
                        {/* LEFT: Session List (7 cols) - CLEAN LIST STYLE */}
                        <div className="lg:col-span-7 space-y-3">
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="p-4 border rounded-lg flex items-center gap-4">
                                            <Skeleton className="size-10 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-1/3" />
                                                <Skeleton className="h-3 w-1/4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                                    <h3 className="text-gray-900 font-medium">Nenhuma sessão</h3>
                                    <p className="text-gray-500 text-sm">Crie uma nova sessão para começar.</p>
                                </div>
                            ) : (
                                sessions.map((session) => {
                                    const badge = getStatusBadge(session.status);
                                    const isSelected = selectedSessionForQR === session.name;

                                    return (
                                        <div
                                            key={session.id || session.name}
                                            onClick={() => setSelectedSessionForQR(session.name)}
                                            className={`
                                                group flex items-center justify-between p-4 cursor-pointer transition-all border rounded-xl
                                                ${isSelected
                                                    ? 'border-blue-500 bg-blue-50/30'
                                                    : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`
                                                    size-10 rounded-full flex items-center justify-center
                                                    ${session.status === 'WORKING' ? 'bg-green-100 text-green-600' :
                                                        session.status === 'SCAN_QR_CODE' ? 'bg-yellow-100 text-yellow-600' :
                                                            'bg-gray-100 text-gray-500'}
                                                `}>
                                                    <WhatsAppIcon className="size-5" />
                                                </div>

                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-sm">{session.name}</h3>
                                                    {session.me?.id && (
                                                        <p className="text-xs text-gray-500 font-medium">{formatPhoneNumber(session.me.id)}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`
                                                            inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide
                                                            transition-all duration-150
                                                            ${badge.className}
                                                            ${session.status === 'STARTING' ? 'animate-pulse' : ''}
                                                        `}>
                                                            {badge.text}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                                                        <MoreVertical className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAction('start', session.name) }}>
                                                        Inciar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAction('restart', session.name) }}>
                                                        Reiniciar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAction('stop', session.name) }}>
                                                        Parar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAction('logout', session.name) }}>
                                                        Sair (Logout)
                                                    </DropdownMenuItem>
                                                    <Separator className="my-1" />
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAction('delete', session.name) }} className="text-red-600">
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* RIGHT: QR Code (5 cols) - CLEAN CARD STYLE */}
                        <div className="lg:col-span-5 relative">
                            <div className="lg:sticky lg:top-8">
                                {selectedSessionForQR ? (
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
                                            {(() => {
                                                const session = sessions.find((s: any) => s.name === selectedSessionForQR);

                                                // Show profile if it exists (connected or was connected)
                                                if (session?.me?.id) {
                                                    const isOnline = session.status === 'WORKING';
                                                    return (
                                                        <div className="text-center">
                                                            <div className={`size-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isOnline ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                                <WhatsAppIcon className="size-8" />
                                                            </div>
                                                            <h3 className="font-semibold text-gray-900 mb-2">{isOnline ? 'Sessão Conectada' : 'Sessão Pausada'}</h3>
                                                            <p className="text-sm text-gray-600 font-medium mb-1">
                                                                {formatPhoneNumber(session.me.id)}
                                                            </p>
                                                            {session.me?.pushName && (
                                                                <p className="text-xs text-gray-500">
                                                                    {session.me.pushName}
                                                                </p>
                                                            )}
                                                            <div className={`mt-6 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                <span className={`size-1.5 rounded-full mr-2 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                                                {isOnline ? 'Online' : session.status === 'STOPPED' ? 'Pausado' : session.status}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                // Show QR if needs scanning and no profile yet
                                                else if (session?.status === 'SCAN_QR_CODE') {
                                                    return <QRCodeDisplay session={selectedSessionForQR} isVisible={true} />;
                                                }
                                                // Default
                                                else {
                                                    return (
                                                        <div className="text-center text-gray-400">
                                                            <Smartphone className="size-12 mx-auto mb-3 opacity-20" />
                                                            <p className="text-sm">Status: {session?.status || 'Desconhecido'}</p>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="hidden lg:flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-12 text-center h-[400px] text-gray-400">
                                        <Smartphone className="size-12 mb-3 opacity-20" />
                                        <p className="text-sm font-medium">Selecione uma sessão.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <SimulatorDialog isOpen={isSimulatorOpen} onOpenChange={setIsSimulatorOpen} />
        </div>
    )
}
