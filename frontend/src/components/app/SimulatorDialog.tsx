
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Bot, Loader2, Phone } from 'lucide-react';
import useSWR from 'swr';
import { devService } from '@/services/dev';

interface SimulatorDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SimulatorDialog({ isOpen, onOpenChange }: SimulatorDialogProps) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isConfigured, setIsConfigured] = useState(false);
    const [newItem, setNewItem] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isSending, setIsSending] = useState(false);

    // Poll messages if configured
    const { data: messages = [], mutate } = useSWR(
        isOpen && isConfigured && phoneNumber ? `/simulate/${phoneNumber}` : null,
        () => devService.getMessages(phoneNumber),
        { refreshInterval: 1000 }
    );

    const handleStart = () => {
        if (phoneNumber.length >= 8) {
            setIsConfigured(true);
        }
    };

    const handleSend = async () => {
        if (!newItem.trim() || isSending) return;

        const text = newItem;
        setNewItem('');
        setIsSending(true);

        try {
            await devService.simulateMessage(phoneNumber, text);
            await mutate(); // Refresh messages immediately
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Bot className="size-5 text-blue-600" />
                        Simulador de Chat
                        {isConfigured && (
                            <span className="text-sm font-normal text-muted-foreground ml-auto bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                                <Phone className="size-3" />
                                {phoneNumber}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {!isConfigured ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-medium">Configurar Simulação</h3>
                            <p className="text-sm text-gray-500">Digite um número de telefone para simular o cliente.</p>
                        </div>
                        <div className="flex gap-2 w-full max-w-sm">
                            <Input
                                placeholder="Ex: 5511999999999"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                            />
                            <Button onClick={handleStart}>Iniciar</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                                    <Bot className="size-12 mb-2" />
                                    <p>Nenhuma mensagem ainda.</p>
                                    <p className="text-sm">Envie uma mensagem para começar.</p>
                                </div>
                            ) : (
                                messages.map((msg: any) => {
                                    const isUser = !msg.fromMe; // In simulator, "fromMe" is true for BOT reply (Axis), false for simulated USER
                                    // Wait!
                                    // dev.routes.js: message -> fromMe: false (simulated user)
                                    // ChatService: reply -> fromMe: true (bot)
                                    // So:
                                    // msg.fromMe === false -> It's the USER (simulated) -> Right side
                                    // msg.fromMe === true -> It's the BOT (Axis) -> Left side

                                    // Correct logic for simulation:
                                    // We are pretending to be the USER.
                                    // So User messages (fromMe=false in DB) should be on RIGHT.
                                    // Bot messages (fromMe=true in DB) should be on LEFT.

                                    const isMyMessage = !msg.fromMe;

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex w-full ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`
                                                    max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm
                                                    ${isMyMessage
                                                        ? 'bg-blue-600 text-white rounded-br-none'
                                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                                    }
                                                `}
                                            >
                                                <p className="whitespace-pre-wrap">{msg.body}</p>
                                                <span className={`text-[10px] mt-1 block ${isMyMessage ? 'text-blue-100 text-right' : 'text-gray-400'}`}>
                                                    {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="p-4 bg-white border-t flex gap-2">
                            <Input
                                placeholder="Digite sua mensagem..."
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={isSending}
                                className="flex-1"
                            />
                            <Button onClick={handleSend} disabled={isSending || !newItem.trim()} size="icon">
                                {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
