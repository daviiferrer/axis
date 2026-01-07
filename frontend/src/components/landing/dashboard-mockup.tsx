"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home as HomeIcon, MessageSquare, Users, Settings, MoreHorizontal, Send, Phone, Video } from "lucide-react";

export function DashboardMockup() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
                duration: 0.8,
                delay: 0.4, // Delays slightly after text starts
                ease: [0.22, 1, 0.36, 1] // Custom refined easing
            }}
            className="pointer-events-auto relative md:absolute bottom-0 right-0 z-20 w-[95vw] sm:w-[85vw] md:w-[50vw] lg:w-[40vw] h-[50vh] md:h-[35vh] mx-auto md:mx-0 mt-8 md:mt-0 shadow-2xl overflow-hidden rounded-t-2xl md:rounded-tl-2xl border-l border-t border-r md:border-r-0 border-gray-800 bg-[#0F1117] flex flex-col translate-y-0"
        >
            {/* Window Header */}
            <div className="h-10 bg-[#161922] border-b border-gray-800 flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <div className="text-xs text-gray-500 font-mono">axis-dashboard.app</div>
                <div className="w-16"></div>
            </div>

            {/* App Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-12 md:w-16 bg-[#0B0E14] border-r border-gray-800 flex flex-col items-center py-4 md:py-6 gap-4 md:gap-6 shrink-0">
                    <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-500">
                        <span className="font-bold text-xs">AI</span>
                    </div>
                    <div className="flex flex-col gap-4 mt-2">
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"><HomeIcon size={18} /></Button>
                        <Button variant="ghost" size="icon" className="text-blue-500 bg-blue-500/10 rounded-lg"><MessageSquare size={18} /></Button>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"><Users size={18} /></Button>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"><Settings size={18} /></Button>
                    </div>
                </div>

                {/* Chat List Sidebar - Hidden on Mobile */}
                <div className="w-64 bg-[#0F1117] border-r border-gray-800 flex flex-col shrink-0 hidden lg:flex">
                    <div className="p-4 border-b border-gray-800">
                        <h2 className="text-sm font-semibold text-white mb-4">Chat Central</h2>
                        <Input
                            placeholder="Buscar conversa..."
                            className="bg-[#161922] border-gray-700 text-gray-300 placeholder:text-gray-600 h-9 text-sm focus-visible:ring-blue-500/20"
                        />
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="flex flex-col">
                            {/* Chat Items */}
                            <div className="p-4 border-b border-gray-800/50 bg-[#161922]/50 cursor-pointer hover:bg-[#161922] transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-sm text-white">João Silva</span>
                                    <span className="text-[10px] text-gray-500">10:30</span>
                                </div>
                                <p className="text-xs text-gray-400 line-clamp-1">Gostaria de saber mais sobre o plano...</p>
                            </div>
                            <div className="p-4 border-b border-gray-800/50 cursor-pointer hover:bg-[#161922] transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-sm text-gray-400">Maria Souza</span>
                                    <span className="text-[10px] text-gray-600">09:15</span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-1">Reunião confirmada para amanhã.</p>
                            </div>
                            <div className="p-4 border-b border-gray-800/50 cursor-pointer hover:bg-[#161922] transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-sm text-gray-400">Pedro Santos</span>
                                    <span className="text-[10px] text-gray-600">Ontem</span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-1">Obrigado pelo atendimento!</p>
                            </div>
                        </div>
                    </ScrollArea>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-white">
                    {/* Chat Header */}
                    <div className="h-14 md:h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-6 bg-white shrink-0">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 md:h-10 md:w-10 border border-gray-100">
                                <AvatarImage src="https://ui.shadcn.com/avatars/03.png" />
                                <AvatarFallback className="bg-orange-100 text-orange-600">CS</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">Carlos Silva</span>
                                    <Badge variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-100 text-[10px] px-1.5 h-5 font-normal border-red-100 flex items-center gap-1">
                                        <Users className="w-3 h-3" /> <span className="hidden sm:inline">Humano</span>
                                    </Badge>
                                </div>
                                <span className="text-xs text-gray-400">Você assumiu</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 text-gray-400">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded-full"><Phone size={16} /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded-full"><Video size={16} /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded-full"><MoreHorizontal size={16} /></Button>
                        </div>
                    </div>

                    {/* Chat Content */}
                    <div className="flex-1 p-4 md:p-6 bg-gray-50/50 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] opacity-[0.03] pointer-events-none">
                            {[...Array(100)].map((_, i) => (
                                <div key={i} className="border-[0.5px] border-gray-400"></div>
                            ))}
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-blue-600/60 font-medium mb-2">Histórico com João Silva</div>
                        </div>
                    </div>

                    {/* Chat Input */}
                    <div className="p-3 md:p-4 bg-white border-t border-gray-100 shrink-0">
                        <div className="relative">
                            <Input
                                placeholder="Digite..."
                                className="bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 pr-10 md:pr-12 h-10 md:h-11 focus-visible:ring-blue-500/20 font-light text-sm"
                            />
                            <Button
                                size="icon"
                                className="absolute right-1 top-1 h-8 w-8 md:h-9 md:w-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <Send size={14} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
