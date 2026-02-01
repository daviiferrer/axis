"use client"

import { useState, useEffect, useRef } from "react"
import useSWR, { useSWRConfig } from "swr" // Fix import
import { parsePhoneNumber } from "libphonenumber-js" // Import formatting lib
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
    Smartphone,
    Check,
    CheckCheck
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
    SelectTrigger,
    SelectValue,
} from "@/components/ui/forms/select"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useSocket } from "@/context/SocketContext"
import { Trash2 } from "lucide-react"
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion"
import SentimentDisplay from "@/components/SentimentSlider/SentimentDisplay"

import { wahaService, WahaSession, WahaChat } from "@/services/waha"

export interface WahaMessage {
    id: string;
    from: string;
    to: string;
    body: string;
    timestamp: number;
    hasMedia?: boolean;
    mediaUrl?: string;
    fromMe: boolean;
    ack?: number; // Added ack for ticks (1=sent, 2=delivered, 3=read)
    _data?: any;
}

const formatPhone = (phone: string) => {
    try {
        if (!phone) return phone;
        // Waha format usually 555199... or 55519...
        // Ensure + prefix for parsing
        const raw = phone.includes('@') ? phone.split('@')[0] : phone;
        const p = parsePhoneNumber('+' + raw.replace(/\D/g, ''));
        if (p && p.isValid()) {
            return p.formatInternational(); // +55 51 9999-9999
        }
        return raw;
    } catch (e) {
        return phone;
    }
}

function MessageTick({ ack }: { ack?: number }) {
    if (!ack || ack < 0) return null; // Pending or error
    if (ack === 1) return <Check className="size-3 text-gray-400" />; // Sent (Server)
    if (ack === 2) return <CheckCheck className="size-3 text-gray-400" />; // Delivered
    if (ack >= 3) return <CheckCheck className="size-3 text-blue-500" />; // Read/Played
    return null; // Clock?
}



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
    const { data: chats, error, isLoading, mutate: mutateChats } = useSWR(session ? `/chats/${session}` : null, () => wahaService.getChats(session), {
        refreshInterval: 0, // Disable polling in favor of Socket
        revalidateOnFocus: false,
        keepPreviousData: true
    })

    const { mutate } = useSWRConfig(); // Global mutate for other keys

    const { socket } = useSocket();

    useEffect(() => {
        if (!socket || !session) return;

        const handleMessageReceived = (data: any) => {
            if (data.session !== session) return;
            // Optimistic update or just revalidate
            console.log("Socket: Message Received", data);
            mutateChats(); // Re-fetch chats to update last message/unread
            // Global mutation for messages list
            const key = `/messages/${data.chatId}`;
            mutate(key, (current: WahaMessage[] | undefined) => {
                const list = current || [];
                // Deduplicate by ID
                if (list.some(m => m.id === data.message.id)) {
                    return list;
                }
                return [data.message, ...list];
            }, false);
        };

        const handleMessageAck = (data: any) => {
            if (data.session !== session) return;
            console.log("Socket: Message Ack", data);
            // Update specific message in cache
            // We need to find which chat this belongs to, but usually we only care if it's the open chat
            // We can optimistically update ALL cached message lists? No, too expensive.
            // Usually we only update the active one.
            // But we don't have selectedChatId inside this effect unless we include it in deps, which causes reconnects.
            // Better: mutate all `/messages/*` keys? No.
            // Strategy: The ack has messageId. We can't easily find the chat key without chatId.
            // Backend event should send chatId!
            // Let's blindly mutate the chats list to show status on sidebar if shown? Sidebar usually doesn't show ticks.
            // The chat window needs it.
            // Let's add a global listener that iterates matching keys? Hard with SWR.
            // Let's rely on `mutateChats` for now, but for instant tick update we need the active chat.
        };

        // Actually, let's put the ack listener INSIDE the ChatWindow component or passing current chat to this one.
        // Or simply revalidate `mutateChats()`? No, that's just the sidebar.
        // We need to revalidate `/messages/{activeChatId}`.
        // If we don't have activeChatId here, we can't key it.
        // Solution: Move socket listeners that depend on active chat to a separate effect that depends on selectedChatId?
        // Or just `mutate((key) => key.startsWith('/messages/'), ...)`? (Not supported natively like that easily without cache provider access).

        socket.on('message.received', handleMessageReceived);
        // socket.on('message.ack', handleMessageAck); // TODO: Implement robustly

        return () => {
            socket.off('message.received', handleMessageReceived);
            // socket.off('message.ack', handleMessageAck);
        };
    }, [socket, session, mutateChats, mutate]);

    // Separate effect for active chat events (Ack)
    useEffect(() => {
        if (!socket || !session || !selectedChatId) return;

        const handleAck = (data: any) => {
            // data: { session, messageId, status, ack, ... } - wait, backend might not send chatId in ack payload?
            // Checking WebhookController: emits { session, messageId, messageSuffix, status, ack }
            // It does NOT emit chatId. This is a limitation.
            // BUT, we can just revalidate the current open chat messages! 
            // We assume the ack *might* be for this chat.
            console.log("Socket: Ack received, revalidating current chat");
            mutate(`/messages/${selectedChatId}`);
        };

        socket.on('message.ack', handleAck);
        return () => {
            socket.off('message.ack', handleAck);
        };
    }, [socket, session, selectedChatId, mutate]);

    const handleDeleteChat = async (chatId: string) => {
        if (confirm("Tem certeza que deseja excluir esta conversa?")) {
            try {
                // Optimistic delete
                mutateChats(chats?.filter(c => c.id !== chatId), false);
                await wahaService.deleteChat(session, chatId);
                mutateChats(); // Revalidate to be sure
            } catch (e) {
                console.error("Failed to delete chat", e);
                mutateChats(); // Revert on error
            }
        }
    }

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
        if (error && error.status !== 404) {
            console.error("Chat load error:", error);
            // Keep distinct error for real failures
            return <div className="p-8 text-center text-sm text-gray-500 font-inter">
                <p>Nenhuma conversa encontrada</p>
                <p className="text-xs text-gray-400 mt-1">Aguardando...</p>
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
        return chat.status === statusFilter;
    }) || [];

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <div className="flex flex-col gap-1 p-2">
                {filteredChats.map((chat) => (
                    <ContextMenu key={chat.id}>
                        <ContextMenuTrigger asChild>
                            <button
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
                                            {formatPhone(chat.name)}
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
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => handleDeleteChat(chat.id)}>
                                <Trash2 className="size-4 mr-2" />
                                Excluir Conversa
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
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
            const saved = localStorage.getItem('lastSession')
            // FIX: Force clear 'Teste_2' if found (invalid session causing issues)
            if (saved === 'Teste_2') return null
            return saved
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

        const tempId = 'temp-' + Date.now();
        const newMessage: WahaMessage = {
            id: tempId,
            from: 'me',
            to: selectedChat.id,
            body: text,
            timestamp: Date.now() / 1000,
            fromMe: true
        };

        // Optimistic UI: Update messages list immediately
        const key = `/messages/${selectedChat.id}`;
        mutate(
            key,
            (current: WahaMessage[] | undefined) => [newMessage, ...(current || [])],
            false
        );

        try {
            await wahaService.sendMessage(currentSession, selectedChat.id, text)
            // Socket will handle the confirmation/real update
        } catch (e) {
            console.error("Failed to send", e)
            mutate(key); // Revert on error
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
                        user={user}
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
    onSendMessage: (text: string) => void,
    user: any
}) {
    const [input, setInput] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Dynamic User Info
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuário";
    const userRole = user?.role || "Admin"; // Provided by AuthContext custom enrichment

    // --- Sentiment Logic (Visual Integration) ---
    const [aiSentiment, setAiSentiment] = useState(2);
    const motionValue = useMotionValue(aiSentiment);
    useEffect(() => { motionValue.set(aiSentiment); }, [aiSentiment, motionValue]);

    const smoothValue = useSpring(motionValue, { stiffness: 300, damping: 30, mass: 0.8 });

    // Map 0-4 to background colors
    const headerBgColor = useTransform(
        smoothValue,
        [0, 1, 2, 3, 4],
        ['#FEF2F2', '#FFFBEB', '#ffffff', '#F0FDF4', '#ECFDF5']
    );

    // Gradient bleed definition
    const bodyGradientStart = useTransform(
        smoothValue,
        [0, 1, 2, 3, 4],
        ['rgba(254, 242, 242, 1)', 'rgba(255, 251, 235, 1)', 'rgba(255, 255, 255, 0)', 'rgba(240, 253, 244, 1)', 'rgba(236, 253, 245, 1)']
    );

    // --- Scroll Fade Logic ---
    const scrollTop = useMotionValue(0);
    const distBottom = useMotionValue(0);

    // Smooth opacity mapping
    const maskTopColor = useTransform(scrollTop, [0, 60], ["black", "transparent"]);
    const maskBottomColor = useTransform(distBottom, [0, 60], ["black", "transparent"]);

    const maskImage = useMotionTemplate`linear-gradient(to bottom, ${maskTopColor} 0px, black 100px, black calc(100% - 100px), ${maskBottomColor} 100%)`;

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages])

    const [presence, setPresence] = useState<{ status: 'online' | 'offline', lastSeen?: number }>({ status: 'offline' })
    const [acting, setActing] = useState<'typing' | 'recording' | null>(null)
    const { socket } = useSocket()

    useEffect(() => {
        if (!socket || !session || !chat) return;

        // Reset state on chat change
        setPresence({ status: 'offline' });
        setActing(null);

        const handlePresence = (data: any) => {
            if (data.session !== session || data.chatId !== chat.id) return;
            console.log("Presence:", data);
            setPresence({ status: data.status, lastSeen: data.lastSeen });
        };

        const handleActing = (data: any) => {
            if (data.session !== session || data.chatId !== chat.id) return;
            console.log("Acting:", data);
            setActing(data.action === 'stop' ? null : data.action);
        };

        socket.on('presence.update', handlePresence);
        socket.on('chat.acting', handleActing);

        return () => {
            socket.off('presence.update', handlePresence);
            socket.off('chat.acting', handleActing);
        };
    }, [socket, session, chat]);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Header */}
            <motion.div
                className="h-16 shrink-0 border-b border-border px-6 flex items-center justify-between sticky top-0 z-50 transition-colors bg-white/80 backdrop-blur-md"
            >
                <div className="flex items-center gap-3">
                    <Avatar className="size-9 ring-2 ring-white/50 shadow-sm">
                        <AvatarImage src={chat.image} />
                        <AvatarFallback>{chat.name?.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-semibold text-sm text-gray-900">{formatPhone(chat.name)}</h2>

                        {acting ? (
                            <span className="text-xs text-green-600 flex items-center gap-1.5 font-medium animate-pulse">
                                {acting === 'recording' ? (
                                    <>
                                        <Mic className="size-3" /> Gravando áudio...
                                    </>
                                ) : (
                                    "Digitando..."
                                )}
                            </span>
                        ) : presence.status === 'online' ? (
                            <span className="text-xs text-green-600 font-medium">
                                Online
                            </span>
                        ) : (
                            <span className="text-[10px] text-gray-400 font-light">
                                Visto por último hoje
                            </span>
                        )}
                    </div>
                </div>

                {/* CENTER: Sentiment Display Integration */}
                <div className="flex-1 flex justify-center mx-4 z-10">
                    <div className="relative h-10 w-full max-w-[280px] flex items-center justify-center">
                        <SentimentDisplay
                            value={aiSentiment}
                            variant="header"
                            onManualSelect={setAiSentiment} // Allow tests/demos?
                        />
                    </div>
                </div>

                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                    <MoreVertical className="size-5" />
                </Button>
            </motion.div>

            {/* Messages */}
            <div className="flex-1 min-h-0 relative">
                {/* Gradient Bleed Overlay */}
                <motion.div
                    className="absolute top-0 left-0 w-full h-32 pointer-events-none z-10"
                    style={{
                        background: useTransform(
                            bodyGradientStart,
                            color => `linear-gradient(to bottom, ${color} 0%, rgba(255,255,255,0) 100%)`
                        )
                    }}
                />
                {/* --- Messages Container (with fluid fade) --- */}
                <motion.div
                    className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 pb-20 z-10 scrollbar-hide flex flex-col gap-4"
                    onScroll={(e) => {
                        const { scrollTop: st, scrollHeight, clientHeight } = e.currentTarget;
                        scrollTop.set(st);
                        distBottom.set(scrollHeight - st - clientHeight);
                    }}
                    style={{
                        maskImage,
                        WebkitMaskImage: maskImage
                    }}
                >
                    <div className="mt-auto" />
                    {messages.map((msg) => (
                        <div key={msg.id} className={`w-full max-w-3xl mx-auto flex items-end gap-2 ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>

                            <div className={`flex flex-col ${msg.fromMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
                                {/* Label */}
                                {msg.fromMe ? (
                                    <span className="text-[10px] text-gray-400 mb-1 px-1">
                                        {userName}, Humano, {userRole}
                                    </span>
                                ) : null}

                                {/* Bubble */}
                                <div className={`p-2.5 rounded-2xl text-left shadow-sm ${msg.fromMe
                                    ? 'bg-[#155dfc]/10 rounded-tr-sm text-gray-900 border border-[#155dfc]/20'
                                    : 'bg-white rounded-tl-sm text-gray-800 border border-gray-100'
                                    }`}>
                                    <p className="text-[13px] font-normal leading-relaxed break-all">{msg.body}</p>
                                    <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                                        <span className="text-[10px] text-gray-500">
                                            {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {msg.fromMe && <MessageTick ack={msg.ack || 1} />}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Avatar (User) */}
                            {msg.fromMe && (
                                <Avatar className="size-6 shrink-0 mb-1">
                                    <AvatarImage src="https://github.com/shadcn.png" />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                    {/* Invisible div to scroll to */}
                    <div ref={messagesEndRef} />
                </motion.div>
            </div>

            {/* Input */}
            <div className="shrink-0 p-4 bg-white border-t border-border z-20">
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
