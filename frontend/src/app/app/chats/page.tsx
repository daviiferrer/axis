"use client"

import { useState, useEffect, useRef } from "react"
import useSWR, { useSWRConfig } from "swr"
import { parsePhoneNumber } from "libphonenumber-js"
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
    CheckCheck,
    Image as ImageIcon,
    FileText,
    Camera,
    X
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
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate, AnimatePresence } from "framer-motion"
import { SentimentDisplay, useSentimentColors } from "@/components/SentimentSlider"

import { wahaService, WahaSession, WahaChat } from "@/services/waha"
import { useAuth } from "@/context/AuthContext"

export interface WahaMessage {
    id: string;
    from: string;
    to: string;
    body: string;
    timestamp: number;
    hasMedia?: boolean;
    mediaUrl?: string;
    mediaType?: 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'file' | null;
    mimetype?: string;
    fromMe: boolean;
    ack?: number; // Added ack for ticks (1=sent, 2=delivered, 3=read)
    _data?: any;
    isAi?: boolean;
    author?: string;
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
    return null;
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
    // Fetch ALL chats regardless of session - session filter is optional now
    const { data: chats, error, isLoading, mutate: mutateChats } = useSWR(
        '/chats/all', // Always fetch
        () => wahaService.getChats(), // No session = fetch all
        {
            refreshInterval: 0, // Disable polling in favor of Socket
            revalidateOnFocus: false,
            keepPreviousData: true
        }
    )

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

                // 1. Check if we have the message already (by ID) - UPDATE IT
                // This fixes attribution flip (Lucas -> Luis) if backend updates the record
                const existingIndex = list.findIndex(m => m.id === data.message.id);
                if (existingIndex !== -1) {
                    const newList = [...list];
                    newList[existingIndex] = data.message;
                    return newList;
                }

                // 2. Check for Optimistic match (Temp ID, Same Body, Same Sender) - RESOLVE IT
                // This fixes "Double Bubble" visual bug
                const optimisticIndex = list.findIndex(m =>
                    m.id.startsWith('temp-') &&
                    m.body === data.message.body &&
                    m.fromMe === data.message.fromMe
                    // We can check timestamp too but body+fromMe is usually enough for single user
                );

                if (optimisticIndex !== -1) {
                    const newList = [...list];
                    newList[optimisticIndex] = data.message; // Replace temp with real
                    return newList;
                }

                return [data.message, ...list];
            }, false);
        };

        const handleMessageAck = (data: any) => {
            if (data.session !== session) return;
            console.log("Socket: Message Ack", data);
        };

        socket.on('message.received', handleMessageReceived);

        return () => {
            socket.off('message.received', handleMessageReceived);
        };
    }, [socket, session, mutateChats, mutate]);

    // Separate effect for active chat events (Ack)
    useEffect(() => {
        if (!socket || !session || !selectedChatId) return;

        const handleAck = (data: any) => {
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
                // Clear selection if deleting the active chat
                if (selectedChatId === chatId) {
                    onSelectChat(null as any); // Clear selection immediately
                }
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
    // Removed: if (!session) check - now shows all chats regardless of session

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

    const handleSelectChat = async (chat: WahaChat) => {
        onSelectChat(chat);
        // Mark as read — optimistic update + API call
        if (chat.unreadCount && chat.unreadCount > 0) {
            // Optimistic: set unreadCount to 0 locally
            mutateChats(
                chats?.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c),
                false
            );
            // Fire & forget API call (session comes from the chat's sessionName)
            if (chat.sessionName) {
                wahaService.markAsRead(chat.sessionName, chat.id).catch(err => {
                    console.warn('markAsRead failed:', err);
                });
            }
        }
    };

    const formatTokens = (tokens: number) => {
        if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
        if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
        return String(tokens);
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <div className="flex flex-col gap-1 p-2">
                {filteredChats.map((chat) => (
                    <ContextMenu key={chat.id}>
                        <ContextMenuTrigger asChild>
                            <button
                                onClick={() => handleSelectChat(chat)}
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
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {chat.lastMessage && (
                                                <span className="text-[10px] text-gray-400 font-mono">
                                                    {new Date(chat.lastMessage.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                            {chat.unreadCount ? (
                                                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
                                                    {chat.unreadCount}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                    <p className={`text-xs truncate font-inter ${chat.unreadCount ? "font-semibold text-gray-900" : "text-gray-500 font-light"}`}>
                                        {chat.lastMessage?.body || "Inicie a conversa"}
                                    </p>
                                    {/* Enrichment row: session · campaign · tokens */}
                                    {(chat.sessionName || chat.campaignName || (chat.aiTokens && chat.aiTokens > 0)) && (
                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-inter">
                                            {chat.sessionName && (
                                                <span className="flex items-center gap-0.5 truncate max-w-[90px]" title={chat.sessionName}>
                                                    📡 {chat.sessionName}
                                                </span>
                                            )}
                                            {chat.campaignName && (
                                                <>
                                                    <span className="text-gray-300">·</span>
                                                    <span className="flex items-center gap-0.5 truncate max-w-[90px]" title={chat.campaignName}>
                                                        🎯 {chat.campaignName}
                                                    </span>
                                                </>
                                            )}
                                            {chat.aiTokens && chat.aiTokens > 0 ? (
                                                <>
                                                    <span className="text-gray-300">·</span>
                                                    <span className="flex items-center gap-0.5" title={`${chat.aiTokens} tokens`}>
                                                        🤖 {formatTokens(chat.aiTokens)}
                                                    </span>
                                                </>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
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
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-xl flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-500">
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-50 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
                <h1 className="font-mono text-4xl md:text-[50px] font-extrabold tracking-[-0.04em] text-gray-900 mb-6 leading-[1.1]">
                    Conectar <span className="text-blue-600">WhatsApp</span>
                </h1>

                <p className="font-inter font-light text-lg text-gray-600 mb-12 max-w-lg mx-auto">
                    Abra o app no seu celular, vá em <strong className="font-semibold text-gray-900">Aparelhos Conectados</strong> e aponte a câmera.
                </p>

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

export default function ChatsPage() {
    const { user } = useAuth()
    const { mutate } = useSWRConfig()
    const [currentSession, setCurrentSession] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('lastSession')
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

    useEffect(() => {
        if (!sessions) return

        if (sessions.length > 0 && !currentSession) {
            const defaultSession = sessions[0].name
            setCurrentSession(defaultSession)
            localStorage.setItem('lastSession', defaultSession)
        } else if (currentSession && sessions.length > 0) {
            const sessionExists = sessions.some(s => s.name === currentSession)
            if (!sessionExists) {
                console.warn('[ChatsPage] Stored session invalid, switching to default.')
                const defaultSession = sessions[0].name
                setCurrentSession(defaultSession)
                localStorage.setItem('lastSession', defaultSession)
            } else {
                localStorage.setItem('lastSession', currentSession)
            }
        } else if (sessions.length === 0 && currentSession) {
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

        const key = `/messages/${selectedChat.id}`;
        mutate(
            key,
            (current: WahaMessage[] | undefined) => [newMessage, ...(current || [])],
            false
        );

        try {
            await wahaService.sendMessage(currentSession, selectedChat.id, text)
        } catch (e) {
            console.error("Failed to send", e)
            mutate(key); // Revert on error
        }
    }

    const { data: messages } = useSWR(
        currentSession && selectedChat ? `/messages/${selectedChat.id}` : null,
        () => wahaService.getMessages(currentSession!, selectedChat!.id),
        {
            refreshInterval: 0, // Socket handles real-time updates
            revalidateOnFocus: false,
            keepPreviousData: true
        }
    )



    const [activeStatusTab, setActiveStatusTab] = useState<'ALL' | 'PROSPECTING' | 'QUALIFIED' | 'FINISHED'>('ALL')

    return (
        <div className="h-full w-full flex flex-row bg-background overflow-hidden relative">


            <div className="w-[380px] min-w-[320px] bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-hidden h-full shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] z-10">
                <div className="p-4 pb-2 bg-white z-10">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4 font-inter">Conversas</h2>

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

                <div className="flex-1 overflow-hidden bg-white flex flex-col">
                    <ChatList
                        session={currentSession || ""}
                        selectedChatId={selectedChat?.id || null}
                        onSelectChat={setSelectedChat}
                        statusFilter={activeStatusTab}
                    />
                </div>
            </div>

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
    onSendMessage,
    user
}: {
    session: string,
    chat: WahaChat,
    messages: WahaMessage[],
    onSendMessage: (text: string) => void,
    user: any
}) {
    const [input, setInput] = useState("")
    const [isAttachOpen, setIsAttachOpen] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // AI Thinking State
    const [thinking, setThinking] = useState<{ isThinking: boolean; step?: string; intent?: string } | null>(null);

    // Dynamic User Info
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuário";
    const userRole = user?.role || "Admin";

    // --- Sentiment Logic (Real-time Integration) ---
    const { data: sentimentData } = useSWR(
        session && chat ? `/sentiment/${session}/${chat.id}` : null,
        () => wahaService.getLeadSentiment(session, chat.id),
        {
            refreshInterval: 5000, // Poll every 5s for updates
            keepPreviousData: true
        }
    );

    const aiSentiment = sentimentData?.sentimentIndex ?? 2; // Default to Neutral (2) if loading/error

    // Use our new hook for colors
    const { headerBgColor, bodyGradientStart } = useSentimentColors(aiSentiment);

    // --- Scroll Fade Logic ---
    const scrollTop = useMotionValue(0);
    const distBottom = useMotionValue(0);

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

        // Subscribe to presence updates for this chat
        wahaService.subscribePresence(session, chat.id).catch(err => {
            console.error('[ChatWindow] Failed to subscribe to presence:', err);
        });

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

        // AI Thinking listener
        const handleThinking = (data: any) => {
            // Only process thinking for the current chat
            if (data.chatId !== chat.id) return;
            setThinking(data.isThinking ? { isThinking: true, step: data.step, intent: data.intent } : null);
        };
        socket.on('ai.thinking', handleThinking);

        return () => {
            socket.off('presence.update', handlePresence);
            socket.off('chat.acting', handleActing);
            socket.off('ai.thinking', handleThinking);
        };
    }, [socket, session, chat]);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Header */}
            <motion.div
                className="h-16 w-full shrink-0 border-b border-border px-6 flex items-center justify-between sticky top-0 z-50 transition-colors backdrop-blur-md"
                style={{ backgroundColor: headerBgColor }}
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
                                {presence.lastSeen
                                    ? `Visto por último ${new Date(presence.lastSeen * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                    : "Visto por último hoje"
                                }
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
                        />
                    </div>
                </div>

                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                    <MoreVertical className="size-5" />
                </Button>
            </motion.div>

            {/* Messages */}
            <div className="flex-1 min-h-0 relative flex flex-col">
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
                                        {msg.isAi ? (
                                            <>
                                                {msg.author}, IA, Atendente
                                            </>
                                        ) : (
                                            <>
                                                {userName}, Humano, {userRole}
                                            </>
                                        )}
                                    </span>
                                ) : null}

                                {/* Bubble */}
                                <div className={`p-2.5 rounded-2xl text-left ${msg.fromMe
                                    ? 'bg-[#155dfc]/10 rounded-tr-sm text-gray-900'
                                    : 'bg-gray-100 rounded-tl-sm text-gray-800'
                                    }`}>

                                    {/* Media Rendering */}
                                    {msg.hasMedia && msg.mediaUrl && msg.mediaType === 'image' && (
                                        <img
                                            src={msg.mediaUrl}
                                            alt="Imagem"
                                            className="rounded-xl max-w-full max-h-64 object-cover mb-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(msg.mediaUrl, '_blank')}
                                        />
                                    )}
                                    {msg.hasMedia && msg.mediaUrl && msg.mediaType === 'audio' && (
                                        <audio controls className="max-w-full mb-1.5" preload="metadata">
                                            <source src={msg.mediaUrl} type={msg.mimetype || 'audio/ogg'} />
                                        </audio>
                                    )}
                                    {msg.hasMedia && msg.mediaUrl && msg.mediaType === 'document' && (
                                        <a
                                            href={msg.mediaUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 bg-white/50 rounded-lg hover:bg-white/80 transition-colors mb-1.5"
                                        >
                                            <FileText className="size-5 text-purple-600" />
                                            <span className="text-xs text-blue-600 underline">Abrir documento</span>
                                        </a>
                                    )}
                                    {msg.hasMedia && msg.mediaUrl && msg.mediaType === 'video' && (
                                        <video controls className="rounded-xl max-w-full max-h-64 mb-1.5" preload="metadata">
                                            <source src={msg.mediaUrl} type={msg.mimetype || 'video/mp4'} />
                                        </video>
                                    )}
                                    {msg.hasMedia && msg.mediaUrl && msg.mediaType === 'sticker' && (
                                        <img
                                            src={msg.mediaUrl}
                                            alt="Sticker"
                                            className="max-w-[150px] max-h-[150px] object-contain mb-1.5"
                                        />
                                    )}

                                    {/* Text body */}
                                    {msg.body && !(['[📷 Imagem recebida]', '[AUDIO_MESSAGE]'].includes(msg.body) && msg.hasMedia) && (
                                        <p className="text-[13px] font-normal leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                                    )}
                                    <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                                        <span className="text-[10px] text-gray-500">
                                            {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {msg.fromMe && <MessageTick ack={msg.ack || 1} />}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Avatar (User) - Dynamic */}
                            {msg.fromMe && (
                                <Avatar className="size-6 shrink-0 mb-1">
                                    <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} />
                                    <AvatarFallback>{userName?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}

                    {/* AI Thinking Bubble */}
                    {thinking?.isThinking && (
                        <div className="w-full max-w-3xl mx-auto flex items-end gap-2 justify-end">
                            <div className="flex flex-col items-end max-w-[70%]">
                                <span className="text-[10px] text-gray-400 mb-1 px-1">IA, Pensando...</span>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-3 rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100/50"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <motion.span
                                                className="size-1.5 bg-blue-400 rounded-full"
                                                animate={{ opacity: [0.3, 1, 0.3] }}
                                                transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                                            />
                                            <motion.span
                                                className="size-1.5 bg-blue-400 rounded-full"
                                                animate={{ opacity: [0.3, 1, 0.3] }}
                                                transition={{ repeat: Infinity, duration: 1.2, delay: 0.3 }}
                                            />
                                            <motion.span
                                                className="size-1.5 bg-blue-400 rounded-full"
                                                animate={{ opacity: [0.3, 1, 0.3] }}
                                                transition={{ repeat: Infinity, duration: 1.2, delay: 0.6 }}
                                            />
                                        </div>
                                        {thinking.step && (
                                            <p className="text-[11px] text-blue-600/80 italic max-w-[200px] truncate">
                                                {thinking.step}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    )}

                    {/* Invisible div to scroll to */}
                    <div ref={messagesEndRef} />
                </motion.div>
            </div>

            {/* --- INPUT --- */}
            <div className="absolute bottom-0 w-full p-3 sm:p-4 bg-transparent z-20 pb-safe-offset pointer-events-none">
                <form
                    onSubmit={(e) => { e.preventDefault(); if (input.trim()) { onSendMessage(input); setInput(""); } }}
                    className="max-w-3xl mx-auto relative flex items-center gap-2 pointer-events-auto"
                >
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-full h-12 px-2 flex items-center transition-all gap-1 shadow-lg shadow-black/5">

                        {/* Attachment Button (Inside) */}
                        <div className="relative">
                            <AnimatePresence>
                                {isAttachOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                        className="absolute bottom-12 left-0 bg-white rounded-xl shadow-xl border border-gray-100 p-2 flex flex-col gap-1 min-w-[160px] z-50 origin-bottom-left mb-1"
                                    >
                                        <button type="button" className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors text-left w-full">
                                            <div className="bg-purple-100 p-1.5 rounded-full text-purple-600"><FileText size={16} /></div>
                                            <span className="font-medium">Documento</span>
                                        </button>
                                        <button type="button" className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors text-left w-full">
                                            <div className="bg-pink-100 p-1.5 rounded-full text-pink-600"><ImageIcon size={16} /></div>
                                            <span className="font-medium">Galeria</span>
                                        </button>
                                        <button type="button" className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors text-left w-full">
                                            <div className="bg-blue-100 p-1.5 rounded-full text-blue-600"><Camera size={16} /></div>
                                            <span className="font-medium">Câmera</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <Button
                                type="button"
                                onClick={() => setIsAttachOpen(!isAttachOpen)}
                                variant="ghost"
                                className={`p-2 hover:bg-gray-200/50 rounded-full shrink-0 transition-colors ${isAttachOpen ? 'text-gray-800 bg-gray-100' : 'text-gray-400'}`}
                            >
                                {isAttachOpen ? <X className="size-5" /> : <Paperclip className="size-5" />}
                            </Button>
                        </div>

                        {/* Input Field */}
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400 h-full px-2"
                        />

                        {/* Send/Mic Button (Inside) */}
                        <Button
                            type="submit"
                            variant="ghost"
                            className={`p-2 rounded-full transition-colors shrink-0 ${input ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-200/50'}`}
                        >
                            {input ? <Send className="size-5 fill-current" /> : <Mic className="size-5" />}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
