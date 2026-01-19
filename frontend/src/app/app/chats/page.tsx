"use client"

import { useState, useEffect, useRef } from "react"
import useSWR from "swr"
import {
    Search,
    Plus,
    Send,
    MoreVertical,
    Paperclip,
    Mic,
    MessageSquare,
    Loader2,
    LogOut,
    QrCode,
    RefreshCw,
    Smartphone
} from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/forms/select"

import { wahaService, WahaSession, WahaChat, WahaMessage } from "@/services/waha"

// --- Components ---



function ChatList({
    session,
    selectedChatId,
    onSelectChat,
    statusFilter = 'ALL'
}: {
    session: string,
    selectedChatId: string | null,
    onSelectChat: (chat: WahaChat) => void,
    statusFilter?: 'ALL' | 'PROSPECTING' | 'QUALIFIED' | 'FINISHED'
}) {
    const { data: chats, error, isLoading } = useSWR(session ? `/chats/${session}` : null, () => wahaService.getChats(session), {
        refreshInterval: 5000,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false, // Trust cache on mount
        keepPreviousData: true,
        shouldRetryOnError: false // Preventing retry loops on 404s if that's the case
    })

    if (isLoading && !chats) {
        return (
            <div className="flex flex-col gap-1 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="size-11 rounded-full shrink-0" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[70%]" />
                            <Skeleton className="h-3 w-[50%]" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }
    if (!session) return <div className="p-8 text-center text-gray-400 text-sm font-inter font-light">Selecione uma sessão</div>

    // Treat 404 or empty array as "No chats"
    if (error || (chats && chats.length === 0)) {
        // You can check error.status === 404 if needed, for now assume 'Error' + 'Empty' means no data available yet
        if (error && error.status !== 404) {
            console.error("Chat load error:", error);
            // Keep distinct error for real failures
            return <div className="p-8 text-center text-sm text-gray-500 font-inter">
                <p>Nenhuma conversa encontrada</p>
                <p className="text-xs text-gray-400 mt-1">Aguardando sincronização...</p>
            </div>
        }
        return (
            <div className="flex flex-col items-center justify-center p-8 mt-10 text-center opacity-60">
                <MessageSquare className="size-10 text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-500">Nenhuma conversa</p>
            </div>
        )
    }

    // Filter chats based on status
    const filteredChats = chats?.filter(chat => {
        if (statusFilter === 'ALL') return true;
        // If chat.status is undefined, treat as PROSPECTING (default) or handle as 'ALL'?
        // For now, simple strict match if status exists. If not, it won't show in filtered tabs.
        // Or should I default undefined to 'PROSPECTING'?
        // Let's default to showing only matching status.
        return chat.status === statusFilter;
    }) || [];

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <div className="flex flex-col gap-1 p-2">
                {filteredChats.map((chat) => (
                    <button
                        key={chat.id}
                        onClick={() => onSelectChat(chat)}
                        className={`group flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-300 border border-transparent hover:bg-gray-50 relative overflow-hidden ${selectedChatId === chat.id
                            ? "bg-blue-50/50 border-blue-100 shadow-sm"
                            : "bg-white"
                            }`}
                    >
                        {selectedChatId === chat.id && (
                            <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-600 rounded-r-full" />
                        )}

                        <Avatar className="size-11 border border-gray-100 shadow-sm group-hover:scale-105 transition-transform duration-300">
                            <AvatarImage src={chat.image} alt={chat.name} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 text-xs font-bold">
                                {chat.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex items-center justify-between mb-0.5">
                                <span className={`text-sm truncate font-inter ${selectedChatId === chat.id ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                                    {chat.name}
                                </span>
                                {chat.lastMessage && (
                                    <span className="text-[10px] text-gray-400 font-mono">
                                        {new Date(chat.lastMessage.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                            <p className={`text-xs truncate font-inter ${chat.unreadCount ? "font-semibold text-gray-900" : "text-gray-500 font-light"}`}>
                                {chat.lastMessage?.body || "Inicie a conversa"}
                            </p>
                        </div>
                        {chat.unreadCount ? (
                            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
                                {chat.unreadCount}
                            </div>
                        ) : null}
                    </button>
                ))}
            </div>
        </div>
    )
}

function QRCodeDisplay({ session, isVisible }: { session: string, isVisible: boolean }) {
    // keepPreviousData: true prevents data from becoming undefined during revalidation (flicker fix)
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

    // Debug what we are actually receiving
    console.log('[QRCodeDisplay] Raw QR data:', qrData);

    // Handle case where Waha returns raw base64 string or JSON with data
    let base64 = '';
    if (typeof qrData === 'string') {
        base64 = qrData;
    } else if (qrData?.data) {
        base64 = qrData.data; // Standard Waha JSON format
    } else if (qrData?.url) {
        // Some versions might return a direct URL (though we asked for json)
        // If it's a URL, we might need a different tag or fetch it.
        // For now, assume base64 is primary.
        console.warn('[QRCodeDisplay] Received URL instead of base64:', qrData.url);
    }

    const qrSrc = base64 ? `data:image/png;base64,${base64}` : null

    return (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-xl flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-500">
            {/* --- Ambient Glows --- */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-50 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
                {/* Icon Wrapper */}


                <h1 className="font-mono text-4xl md:text-[50px] font-extrabold tracking-[-0.04em] text-gray-900 mb-6 leading-[1.1]">
                    Conectar <span className="text-blue-600">WhatsApp</span>
                </h1>

                <p className="font-inter font-light text-lg text-gray-600 mb-12 max-w-lg mx-auto">
                    Abra o app no seu celular, vá em <strong className="font-semibold text-gray-900">Aparelhos Conectados</strong> e aponte a câmera.
                </p>

                {/* QR Code Container */}
                <div className="bg-white p-5 rounded-3xl shadow-2xl ring-1 ring-gray-100 transition-all duration-300">
                    {qrSrc ? (
                        <div className="relative size-[280px] bg-white rounded-2xl overflow-hidden group/qr">
                            <img src={qrSrc} alt="QR Code" className="w-full h-full object-contain mix-blend-multiply" />
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 animate-scan pointer-events-none" />
                        </div>
                    ) : (
                        <div className="size-[280px] flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                            <Loader2 className="size-10 text-blue-600 animate-spin mb-4" />
                            <span className="text-xs text-gray-400 font-mono tracking-wide uppercase">Gerando Código...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

import { useAuth } from "@/context/AuthContext"

// ... imports remain same until component ...

export default function ChatsPage() {
    const { user } = useAuth()
    // Initialize from localStorage if available to avoid loading flicker
    const [currentSession, setCurrentSession] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('lastSession')
        }
        return null
    })
    const [selectedChat, setSelectedChat] = useState<WahaChat | null>(null)
    const { data: sessions, mutate: refreshSessions } = useSWR('/sessions', () => wahaService.getSessions(true), {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
        dedupingInterval: 5000
    })
    const { data: sessionInfo } = useSWR(currentSession ? `/session/${currentSession}` : null, () => wahaService.getSession(currentSession!))

    // Auto-select session (simplified)
    useEffect(() => {
        if (!sessions) return

        // If we have a session in state, ensure it's valid (optional, but good safety)
        // If no session is selected, select the first one
        if (sessions.length > 0 && !currentSession) {
            const defaultSession = sessions[0].name
            setCurrentSession(defaultSession)
            localStorage.setItem('lastSession', defaultSession)
        } else if (currentSession && sessions.length > 0) {
            // Verify current session actually exists in the fetched list
            const sessionExists = sessions.some(s => s.name === currentSession)
            if (!sessionExists) {
                // Session from localStorage is invalid/deleted. Switch to first valid.
                console.warn('[ChatsPage] Stored session invalid, switching to default.')
                const defaultSession = sessions[0].name
                setCurrentSession(defaultSession)
                localStorage.setItem('lastSession', defaultSession)
            } else {
                // Session is valid, just ensure it's saved
                localStorage.setItem('lastSession', currentSession)
            }
        } else if (sessions.length === 0 && currentSession) {
            // No sessions available at all, clear current
            setCurrentSession(null)
            localStorage.removeItem('lastSession')
        }
    }, [sessions, currentSession])


    const handleSendMessage = async (text: string) => {
        if (!currentSession || !selectedChat) return
        try {
            await wahaService.sendMessage(currentSession, selectedChat.id, text)
        } catch (e) {
            console.error("Failed to send", e)
        }
    }

    // Messages for selected chat
    const { data: messages } = useSWR(
        currentSession && selectedChat ? `/messages/${selectedChat.id}` : null,
        () => wahaService.getMessages(currentSession!, selectedChat!.id),
        { refreshInterval: 3000 }
    )

    // Health Check
    const [isWahaHealthy, setIsWahaHealthy] = useState(true)

    useEffect(() => {
        const check = async () => {
            const healthy = await wahaService.checkHealth()
            setIsWahaHealthy(healthy)
        }

        check() // Initial check
        const interval = setInterval(check, 5000) // Poll every 5s
        return () => clearInterval(interval)
    }, [])

    // Status tab state
    const [activeStatusTab, setActiveStatusTab] = useState<'ALL' | 'PROSPECTING' | 'QUALIFIED' | 'FINISHED'>('ALL')

    // ... (rest of render)

    return (
        <div className="h-full w-full flex flex-row bg-background overflow-hidden relative">
            {/* ... (Waha Unavailable Overlay) ... */}
            {!isWahaHealthy && (
                // ... overlay content ...
                <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                    <div className="size-24 rounded-full bg-red-50 flex items-center justify-center mb-6 shadow-[0_0_40px_-10px_rgba(239,68,68,0.3)]">
                        <div className="relative">
                            <Smartphone className="size-10 text-red-500/50" />
                            <div className="absolute -bottom-1 -right-1 size-5 bg-red-500 rounded-full flex items-center justify-center ring-4 ring-white">
                                <span className="text-white font-bold text-[10px]">!</span>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-mono font-bold text-gray-900 mb-3">Waha Indisponível</h2>
                    <p className="text-gray-500 max-w-md mb-8 leading-relaxed font-inter">
                        Não foi possível conectar ao serviço do WhatsApp. Verifique se o servidor backend está rodando corretamente.
                    </p>

                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-gray-900 text-white hover:bg-gray-800 rounded-full px-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                        <RefreshCw className="mr-2 size-4" />
                        Tentar Novamente
                    </Button>
                </div>
            )}

            {/* --- LEFT SIDEBAR (Fixed Width) --- */}
            <div className="w-[380px] min-w-[320px] bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-hidden h-full shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] z-10">

                {/* Search & Header */}
                <div className="p-4 pb-2 bg-white z-10">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4 font-inter">Conversas</h2>

                    {/* Status Tabs */}
                    <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                        {[
                            { id: 'ALL', label: 'Todas' },
                            { id: 'PROSPECTING', label: 'Prospectando' },
                            { id: 'QUALIFIED', label: 'Qualificado' },
                            { id: 'FINISHED', label: 'Finalizado' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveStatusTab(tab.id as any)}
                                className={`
                                    px-3 h-6 rounded-full text-[11px] font-medium transition-all duration-200 whitespace-nowrap
                                    ${activeStatusTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar conversa..."
                            className="pl-9 bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 h-10 transition-all duration-300 font-inter"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-hidden bg-white">
                    <ChatList
                        session={currentSession || ""}
                        selectedChatId={selectedChat?.id || null}
                        onSelectChat={setSelectedChat}
                        statusFilter={activeStatusTab}
                    />
                </div>
            </div>

            {/* --- RIGHT CONTENT --- */}
            <div className="flex-1 bg-white relative flex flex-col min-w-0">
                {(!currentSession) ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                        <div className="size-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                            <MessageSquare className="size-8 text-gray-400" />
                        </div>
                        <h3 className="font-mono text-xl font-bold text-gray-900 mb-2">Nenhuma sessão ativa</h3>
                        <p className="text-gray-500 max-w-sm mb-6">Vá para a página de Sessões para conectar seu WhatsApp.</p>
                        <Button variant="outline" asChild>
                            <a href="/app/sessions">Ir para Sessões</a>
                        </Button>
                    </div>
                ) : !selectedChat ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50/30">
                        <div className="size-20 bg-white shadow-sm ring-1 ring-black/5 rounded-2xl flex items-center justify-center mb-6">
                            <MessageSquare className="size-8 text-blue-600/50" />
                        </div>
                        <h3 className="font-mono text-xl font-bold text-gray-900 mb-2">Pronto para conversar</h3>
                        <p className="text-gray-500 max-w-sm">Selecione uma conversa da lista para iniciar o atendimento.</p>
                    </div>
                ) : (
                    <ChatWindow
                        session={currentSession!}
                        chat={selectedChat}
                        messages={messages || []}
                        onSendMessage={handleSendMessage}
                    />
                )}
            </div>
        </div>
    )
}

function ChatWindow({
    session,
    chat,
    messages,
    onSendMessage
}: {
    session: string,
    chat: WahaChat,
    messages: WahaMessage[],
    onSendMessage: (text: string) => void
}) {
    const [input, setInput] = useState("")

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-white/80 backdrop-blur sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Avatar className="size-9 ring-2 ring-white shadow-sm">
                        <AvatarImage src={chat.image} />
                        <AvatarFallback>{chat.name?.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-semibold text-sm text-gray-900">{chat.name}</h2>
                        <span className="text-xs text-green-600 flex items-center gap-1.5 font-medium">
                            <span className="size-1.5 rounded-full bg-green-500" />
                            Online via WhatsApp
                        </span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                    <MoreVertical className="size-5" />
                </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6 bg-slate-50/50">
                <div className="max-w-3xl mx-auto flex flex-col gap-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
                            <div className={`
                                max-w-[70%] rounded-2xl px-5 py-3 text-sm shadow-sm ring-1 ring-inset
                                ${msg.fromMe
                                    ? "bg-blue-600 text-white ring-blue-600 rounded-tr-none"
                                    : "bg-white text-gray-900 ring-gray-200 rounded-tl-none"
                                }
                            `}>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                                <span className={`text-[10px] block mt-1 opacity-70 ${msg.fromMe ? "text-blue-100" : "text-gray-400"}`}>
                                    {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 bg-white border-t border-border">
                <div className="max-w-3xl mx-auto relative flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="text-gray-400 hover:text-blue-600 transition-colors">
                        <Paperclip className="size-5" />
                    </Button>
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (input.trim()) {
                                    onSendMessage(input);
                                    setInput("");
                                }
                            }
                        }}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all h-11"
                    />
                    {input.trim() ? (
                        <Button
                            onClick={() => {
                                onSendMessage(input);
                                setInput("");
                            }}
                            className="size-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <Send className="size-5 ml-0.5" />
                        </Button>
                    ) : (
                        <Button size="icon" variant="ghost" className="text-gray-400 hover:text-blue-600 transition-colors">
                            <Mic className="size-5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
