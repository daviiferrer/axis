'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquareText, ListTree, Plus, Trash2, ShieldQuestion } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface ChatbotConfigProps {
    formData: any;
    onChange: (key: string, value: any) => void;
}

export function ChatbotConfig({ formData, onChange }: ChatbotConfigProps) {
    const messages = formData.messages || [];
    const routingRules = formData.routingRules || [];

    const addMessage = () => {
        onChange('messages', [...messages, '']);
    };

    const updateMessage = (index: number, text: string) => {
        const newMsgs = [...messages];
        newMsgs[index] = text;
        onChange('messages', newMsgs);
    };

    const removeMessage = (index: number) => {
        const newMsgs = messages.filter((_: any, i: number) => i !== index);
        onChange('messages', newMsgs);
    };

    const addRule = () => {
        onChange('routingRules', [...routingRules, { type: 'equals', value: '' }]);
    };

    const updateRule = (index: number, field: string, value: any) => {
        const newRules = [...routingRules];
        newRules[index] = { ...newRules[index], [field]: value };
        onChange('routingRules', newRules);
    };

    const removeRule = (index: number) => {
        const newRules = routingRules.filter((_: any, i: number) => i !== index);
        onChange('routingRules', newRules);
    };

    return (
        <div className="space-y-6 pt-2 pb-12">
            {/* Header / Info */}
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                <div className="p-2 bg-rose-100 rounded-lg shrink-0">
                    <MessageSquareText className="w-5 h-5 text-rose-600" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-rose-900">Chatbot Determinístico</h3>
                    <p className="text-xs text-rose-700 leading-relaxed">
                        Este nó executa um envio sequencial exato de mensagens e aguarda a resposta do usuário, roteando a conversa com base em regras exatas (sem Inteligência Artificial).
                    </p>
                </div>
            </div>

            {/* Messages Array */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <MessageSquareText className="w-4 h-4 text-gray-400" />
                        Mensagens a Enviar
                    </Label>
                    <Button variant="outline" size="sm" onClick={addMessage} className="h-7 text-xs px-2 bg-white hover:bg-rose-50 hover:text-rose-600 border-rose-200">
                        <Plus className="w-3 h-3 mr-1" /> Adicionar
                    </Button>
                </div>

                <div className="space-y-3">
                    {messages.length === 0 ? (
                        <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-center text-xs text-gray-500">
                            Nenhuma mensagem configurada. Adicione a primeira mensagem.
                        </div>
                    ) : (
                        messages.map((msg: string, i: number) => (
                            <div key={i} className="relative group flex items-start gap-2">
                                <div className="mt-2 text-[10px] font-bold text-gray-300 w-4 text-center shrink-0">{i + 1}.</div>
                                <Textarea
                                    rows={3}
                                    value={msg}
                                    onChange={(e) => updateMessage(i, e.target.value)}
                                    placeholder="Digite o texto da mensagem..."
                                    className="bg-white border-gray-200 shadow-sm text-sm resize-none rounded-xl focus-visible:ring-1 focus-visible:ring-rose-500"
                                />
                                <button
                                    onClick={() => removeMessage(i)}
                                    className="pt-2 px-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="h-px bg-gray-100 my-4" />

            {/* Routing Rules */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <ListTree className="w-4 h-4 text-gray-400" />
                        Regras de Roteamento
                    </Label>
                    <Button variant="outline" size="sm" onClick={addRule} className="h-7 text-xs px-2 bg-white hover:bg-blue-50 hover:text-blue-600 border-blue-200">
                        <Plus className="w-3 h-3 mr-1" /> Nova Regra
                    </Button>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                    <div className="flex items-start gap-2 text-blue-800">
                        <ShieldQuestion className="w-4 h-4 shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed">
                            O Chatbot vai <strong>pausar o fluxo</strong> e aguardar a resposta do Lead. Quando ele enviar, o texto será comparado com as regras abaixo na ordem definida. A primeira regra que bater será a nova rota.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {routingRules.length === 0 ? (
                        <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-center text-xs text-gray-500">
                            Sem regras específicas. Qualquer resposta irá para a saída "Padrão (Else)".
                        </div>
                    ) : (
                        routingRules.map((rule: any, i: number) => (
                            <div key={i} className="flex flex-col gap-2 p-3 bg-white border border-gray-200 rounded-xl shadow-sm relative group">
                                <span className="absolute -top-2 -left-2 bg-gray-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                                    Aresta {i}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1/3">
                                        <Select
                                            value={rule.type}
                                            onValueChange={(val) => updateRule(i, 'type', val)}
                                        >
                                            <SelectTrigger className="h-8 text-xs bg-gray-50 border-gray-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                <SelectItem value="equals">Igual a</SelectItem>
                                                <SelectItem value="contains">Contém</SelectItem>
                                                <SelectItem value="starts_with">Começa com</SelectItem>
                                                <SelectItem value="regex">Expressão (RegEx)</SelectItem>
                                                <SelectItem value="any">Qualquer coisa</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            disabled={rule.type === 'any'}
                                            placeholder={rule.type === 'any' ? "Ignorado" : "Valor esperado..."}
                                            value={rule.value || ''}
                                            onChange={(e) => updateRule(i, 'value', e.target.value)}
                                            className="h-8 text-xs border-gray-200"
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeRule(i)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
