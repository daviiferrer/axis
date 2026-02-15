"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import {
    Play, Check, CheckCheck, Send, MoreVertical, Phone, Video, Image as ImageIcon, Sparkles, Mic, Paperclip, Smile,
    BrainCircuit, X, MessageCircle, Laptop, Scale, GraduationCap, MapPin, Home, Calendar, FileText, Clock,
    ShoppingBag, Tag, Truck, AlertTriangle, User, Target, Webhook, Key, Search, UserCheck, Stethoscope, Code, MousePointer2,
    Globe, Smartphone, Megaphone, Thermometer, MessageSquare, Bot, UserCog, ChevronLeft
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/visuals/scroll-reveal";
import { TextGenerateEffect } from "@/components/ui/visuals/text-generate-effect";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface ScenarioStep {
    type: "user" | "ai" | "typing_user" | "thinking" | "event";
    text?: string;
    image?: string;
    thinkingSteps?: { icon: React.ReactNode, text: string }[];
    delay?: number;
    duration?: number;
    sentiment?: "positive" | "neutral" | "negative" | "urgency" | "curiosity";
    eventIcon?: React.ReactNode;
    eventColor?: string;
}

interface ChatScenario {
    id: string;
    name: string;
    initials: string;
    color: string;
    icon: React.ReactNode;
    label: string;
    campaignName: string;
    funnelStage: string;
    aiCost: string;
    avatar: string;
    initialMessage: string;
    steps: ScenarioStep[];
    // ── Enriched fields from DB schema ──
    source: "facebook" | "google" | "apify" | "direct" | "imported";
    sessionName: string;
    temperature: number; // 0–1
    serviceStatus: "ai_active" | "human" | "paused";
    interactionCount: number;
    tags?: string[];
}

// ─────────────────────────────────────────────────────────────
// 6 Rich Scenarios — 60+ steps each, showcasing backend features
// ─────────────────────────────────────────────────────────────
const SCENARIOS: ChatScenario[] = [
    // ── 1. IMOBILIÁRIA ──────────────────────────────────────────
    {
        id: "imobiliaria",
        name: "Ana Souza",
        initials: "AS",
        color: "bg-emerald-100 text-emerald-600",
        icon: <Home className="size-3.5" />,
        label: "Imobiliária",
        campaignName: "Lançamento Jardins",
        funnelStage: "Visita Agendada",
        aiCost: "R$ 0,45",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&c=thumb",
        initialMessage: "Olá! Vi o anúncio do Lançamento Jardins. Ainda tem unidades disponíveis?",
        source: "facebook",
        sessionName: "iPhone-Ana",
        temperature: 0.82,
        serviceStatus: "ai_active",
        interactionCount: 14,
        tags: ["VIP"],
        steps: [
            { type: "thinking", thinkingSteps: [{ icon: <Search className="size-3" />, text: "Consultando estoque atual..." }, { icon: <MapPin className="size-3" />, text: "Verificando unidades com vista" }, { icon: <UserCheck className="size-3" />, text: "Personalizando oferta" }], duration: 2500 },
            { type: "ai", text: "Oi! Que bom que se interessou pelo Jardins do Parque! 🌿" },
            { type: "ai", text: "Temos 3 torres e unidades de 2 e 3 quartos. Você busca qual perfil?" },
            { type: "typing_user", duration: 1500 },
            { type: "user", text: "Prefiro 3 quartos, andar alto, sol da manhã", delay: 0, sentiment: "positive" },
            { type: "event", text: "Nome extraído: 'Ana'", eventIcon: <UserCheck className="size-3" />, eventColor: "bg-blue-50 border-blue-200 text-blue-700" },
            { type: "thinking", thinkingSteps: [{ icon: <Home className="size-3" />, text: "Filtrando: 3Q + alto + manhã" }, { icon: <Tag className="size-3" />, text: "2 unidades disponíveis" }, { icon: <Calendar className="size-3" />, text: "Sugerindo visita presencial" }], duration: 2000 },
            { type: "event", text: "Necessidade: 3 quartos, sol manhã, andar alto", eventIcon: <Target className="size-3" />, eventColor: "bg-purple-50 border-purple-200 text-purple-700" },
            { type: "ai", text: "Perfeito, Ana! Tenho a unidade 1504 — 15º andar, face leste, vista livre. ☀️" },
            { type: "ai", text: "São 98m² com varanda gourmet. Olha só a vista:" },
            { type: "ai", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=260&fit=crop", text: "Vista da unidade 1504 — face leste, 15º andar" },
            { type: "typing_user", duration: 1800 },
            { type: "user", text: "Sim! E qual a faixa de preço?", delay: 0, sentiment: "curiosity" },
            { type: "event", text: "Sentimento: Neutro → Positivo", eventIcon: <Sparkles className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            { type: "thinking", thinkingSteps: [{ icon: <Tag className="size-3" />, text: "Tabela Dez/2024: R$680k–R$750k" }, { icon: <Clock className="size-3" />, text: "Condição pré-lançamento ativa" }, { icon: <Target className="size-3" />, text: "Analisando perfil de compra" }], duration: 2200 },
            { type: "event", text: "Orçamento: aguardando qualificação", eventIcon: <Tag className="size-3" />, eventColor: "bg-slate-50 border-slate-200 text-slate-600" },
            { type: "ai", text: "A 1504 está por R$720k na tabela de pré-lançamento — 10% de desconto até sexta." },
            { type: "ai", text: "Aceita FGTS e financiamento Caixa. Gostaria de simular as parcelas?" },
            { type: "typing_user", duration: 1200 },
            { type: "user", text: "Quero sim! Consigo entrada de 150k", delay: 0, sentiment: "positive" },
            { type: "event", text: "Orçamento: R$ 150k entrada", eventIcon: <Tag className="size-3" />, eventColor: "bg-purple-50 border-purple-200 text-purple-700" },
            { type: "thinking", thinkingSteps: [{ icon: <FileText className="size-3" />, text: "Simulação financeira gerada" }, { icon: <CheckCheck className="size-3" />, text: "Parcelas em 360 meses" }, { icon: <Target className="size-3" />, text: "Score de lead: 45 → 65" }], duration: 2000 },
            { type: "event", text: "Lead Score: 45 → 65", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "ai", text: "Com R$150k de entrada, as parcelas ficam em ~R$3.800/mês (SAC, 360m)." },
            { type: "ai", text: "Posso enviar a simulação completa em PDF. Qual seu e-mail? 📧" },
            { type: "typing_user", duration: 2000 },
            { type: "user", text: "ana.souza@email.com", delay: 0 },
            { type: "thinking", thinkingSteps: [{ icon: <FileText className="size-3" />, text: "PDF de simulação gerado" }, { icon: <Calendar className="size-3" />, text: "Verificando horários de visita" }, { icon: <CheckCheck className="size-3" />, text: "Disponibilidade: Sáb 10h" }], duration: 1800 },
            { type: "ai", text: "Simulação enviada! 📩 Veja que a taxa está em 10.49% a.a. pela Caixa." },
            { type: "ai", text: "Que tal agendar uma visita ao decorado? Sábado às 10h funciona para você?" },
            { type: "typing_user", duration: 1000 },
            { type: "user", text: "Sábado às 10h tá ótimo!", delay: 0, sentiment: "positive" },
            { type: "event", text: "Reunião agendada: Sábado 10h", eventIcon: <Calendar className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "event", text: "Lead Score: 65 → 88", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "thinking", thinkingSteps: [{ icon: <Calendar className="size-3" />, text: "Agendamento confirmado no CRM" }, { icon: <MapPin className="size-3" />, text: "Enviando localização" }, { icon: <CheckCheck className="size-3" />, text: "Qualificação BANT: 3/4 slots" }], duration: 1500 },
            { type: "ai", text: "Agendado! ✅ Sábado 10h — Stand Jardins, Av. das Palmeiras, 350." },
            { type: "ai", text: "Vou te enviar a localização e um lembrete na sexta. Até lá, Ana! 🏡" },
            { type: "event", text: "Qualificação: 3/4 slots preenchidos", eventIcon: <CheckCheck className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
        ],
    },
    // ── 2. CLÍNICA ODONTOLÓGICA ─────────────────────────────────
    {
        id: "saude",
        name: "Dr. Ricardo",
        initials: "DR",
        color: "bg-blue-100 text-blue-600",
        icon: <Stethoscope className="size-3.5" />,
        label: "Saúde / Clínica",
        campaignName: "Clareamento",
        funnelStage: "Qualificado",
        aiCost: "R$ 0,28",
        avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&c=thumb",
        initialMessage: "Boa tarde, gostaria de saber o valor do clareamento dental.",
        source: "direct",
        sessionName: "Android-Mariana",
        temperature: 0.75,
        serviceStatus: "ai_active",
        interactionCount: 9,
        tags: ["Sensível"],
        steps: [
            { type: "thinking", thinkingSteps: [{ icon: <FileText className="size-3" />, text: "Identificando tratamento: Clareamento" }, { icon: <UserCheck className="size-3" />, text: "Protocolo de triagem iniciado" }, { icon: <MessageCircle className="size-3" />, text: "Formulando resposta empática" }], duration: 2200 },
            { type: "ai", text: "Boa tarde! 😁 O clareamento é um dos tratamentos mais procurados." },
            { type: "ai", text: "Temos 3 opções: caseiro, LED ou a laser. Você já fez clareamento antes?" },
            { type: "typing_user", duration: 1800 },
            { type: "user", text: "Nunca fiz, mas tenho um pouco de sensibilidade nos dentes", delay: 0, sentiment: "neutral" },
            { type: "event", text: "Paciente não identificado", eventIcon: <UserCheck className="size-3" />, eventColor: "bg-slate-50 border-slate-200 text-slate-600" },
            { type: "thinking", thinkingSteps: [{ icon: <AlertTriangle className="size-3" />, text: "Alerta: Sensibilidade detectada" }, { icon: <Stethoscope className="size-3" />, text: "Recomendação: Laser terapêutico" }, { icon: <Calendar className="size-3" />, text: "Verificando agenda Dr. Ricardo" }], duration: 2000 },
            { type: "event", text: "Sensibilidade detectada → protocolo especial", eventIcon: <AlertTriangle className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            { type: "ai", text: "Entendi! Nesse caso, recomendo o clareamento a laser com dessensibilizante prévio. 🛡️" },
            { type: "ai", text: "É o protocolo mais seguro para quem tem sensibilidade. O resultado fica incrível!" },
            { type: "typing_user", duration: 1200 },
            { type: "user", text: "E quanto custa?", delay: 0, sentiment: "curiosity" },
            { type: "thinking", thinkingSteps: [{ icon: <Tag className="size-3" />, text: "Tabela: Laser = R$1.200" }, { icon: <Target className="size-3" />, text: "Condição especial: 1ª vez" }, { icon: <CheckCheck className="size-3" />, text: "Pré-avaliação incluída" }], duration: 1800 },
            { type: "ai", text: "O laser com dessensibilizante está por R$1.200 (3 sessões). Inclui avaliação grátis." },
            { type: "ai", text: "E como é sua primeira vez, vou aplicar 15% de desconto. Fica R$1.020! 🎉" },
            { type: "typing_user", duration: 1500 },
            { type: "user", text: "Opa, gostei! Tem horário essa semana?", delay: 0, sentiment: "positive" },
            { type: "event", text: "Sentimento: Neutro → Positivo", eventIcon: <Sparkles className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            { type: "event", text: "Lead Score: 30 → 55", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "thinking", thinkingSteps: [{ icon: <Calendar className="size-3" />, text: "Verificando agenda da semana" }, { icon: <Clock className="size-3" />, text: "Quinta 14h e Sexta 10h livres" }, { icon: <Stethoscope className="size-3" />, text: "Dr. Ricardo disponível" }], duration: 1500 },
            { type: "ai", text: "Temos quinta às 14h ou sexta às 10h com o Dr. Ricardo. Qual prefere?" },
            { type: "typing_user", duration: 800 },
            { type: "user", text: "Quinta 14h serve perfeito", delay: 0, sentiment: "positive" },
            { type: "event", text: "Consulta agendada: Quinta 14h", eventIcon: <Calendar className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "thinking", thinkingSteps: [{ icon: <Calendar className="size-3" />, text: "Agendamento confirmado" }, { icon: <UserCheck className="size-3" />, text: "Solicitando dados do paciente" }, { icon: <FileText className="size-3" />, text: "Preparando ficha" }], duration: 1500 },
            { type: "ai", text: "Agendado! ✅ Quinta, 14h, com Dr. Ricardo." },
            { type: "ai", text: "Para a ficha, pode me enviar seu nome completo e data de nascimento?" },
            { type: "typing_user", duration: 2200 },
            { type: "user", text: "Mariana Costa, 15/03/1990", delay: 0 },
            { type: "event", text: "Nome salvo: 'Mariana Costa'", eventIcon: <UserCheck className="size-3" />, eventColor: "bg-blue-50 border-blue-200 text-blue-700" },
            { type: "thinking", thinkingSteps: [{ icon: <CheckCheck className="size-3" />, text: "Ficha criada no sistema" }, { icon: <MapPin className="size-3" />, text: "Enviando localização da clínica" }, { icon: <Target className="size-3" />, text: "Score: 55 → 80" }], duration: 1500 },
            { type: "event", text: "Lead Score: 55 → 80", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "ai", text: "Pronto, Mariana! Enviei a localização da clínica e um lembrete será enviado na quarta. 📍" },
            { type: "ai", text: "Qualquer dúvida antes da consulta, pode mandar aqui! 😊" },
            { type: "event", text: "Qualificação: 4/4 slots preenchidos", eventIcon: <CheckCheck className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
        ],
    },
    // ── 3. VAREJO / E-COMMERCE ──────────────────────────────────
    {
        id: "varejo",
        name: "Loja Estilo",
        initials: "LE",
        color: "bg-rose-100 text-rose-600",
        icon: <ShoppingBag className="size-3.5" />,
        label: "Varejo",
        campaignName: "Coleção Verão",
        funnelStage: "Carrinho Abandonado",
        aiCost: "R$ 0,15",
        avatar: "https://images.unsplash.com/photo-1554519934-e32b1629d9ee?w=150&h=150&c=thumb",
        initialMessage: "Tem esse vestido vermelho no tamanho M?",
        source: "apify",
        sessionName: "Web-Julia",
        temperature: 0.60,
        serviceStatus: "ai_active",
        interactionCount: 6,
        tags: ["Carrinho"],
        steps: [
            { type: "thinking", thinkingSteps: [{ icon: <Search className="size-3" />, text: "Buscando SKU: Vestido Vermelho" }, { icon: <CheckCheck className="size-3" />, text: "Estoque M: 3 unidades" }, { icon: <Truck className="size-3" />, text: "Cálculo de frete preparado" }], duration: 1800 },
            { type: "ai", text: "Oi! Temos sim, restam apenas 3 no tamanho M! ❤️" },
            { type: "ai", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=300&fit=crop", text: "Vestido Vermelho — Viscose Premium" },
            { type: "ai", text: "Ele veste super bem. Quer que eu separe um pra você?" },
            { type: "typing_user", duration: 1600 },
            { type: "user", text: "Que maravilha! Vocês têm bolsa que combina?", delay: 0, sentiment: "positive" },
            { type: "event", text: "Cliente não identificada", eventIcon: <UserCheck className="size-3" />, eventColor: "bg-slate-50 border-slate-200 text-slate-600" },
            { type: "thinking", thinkingSteps: [{ icon: <ShoppingBag className="size-3" />, text: "Cross-sell: Acessórios" }, { icon: <Target className="size-3" />, text: "Match: Clutch Vermelha" }, { icon: <Tag className="size-3" />, text: "Gerando oferta combo" }], duration: 1500 },
            { type: "event", text: "Cross-sell ativado: acessórios complementares", eventIcon: <ShoppingBag className="size-3" />, eventColor: "bg-purple-50 border-purple-200 text-purple-700" },
            { type: "ai", text: "Temos a clutch vermelha que é a cara desse vestido! R$89,90." },
            { type: "ai", image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&h=300&fit=crop", text: "Clutch Vermelha — combina perfeito!" },
            { type: "ai", text: "Se levar os dois, frete grátis + 10% no combo! 🔥" },
            { type: "typing_user", duration: 1200 },
            { type: "user", text: "Perfeito! Adiciona os dois", delay: 0, sentiment: "positive" },
            { type: "event", text: "Sentimento: Positivo ✓", eventIcon: <Sparkles className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            { type: "thinking", thinkingSteps: [{ icon: <ShoppingBag className="size-3" />, text: "Montando carrinho" }, { icon: <Tag className="size-3" />, text: "Desconto 10% aplicado" }, { icon: <Truck className="size-3" />, text: "Frete grátis ativado" }], duration: 1500 },
            { type: "event", text: "Carrinho: Vestido + Clutch = R$ 295,11", eventIcon: <ShoppingBag className="size-3" />, eventColor: "bg-rose-50 border-rose-200 text-rose-700" },
            { type: "ai", text: "Montei seu carrinho! 🛍️ Vestido R$229 + Clutch R$89,90 = R$295,11 com desconto." },
            { type: "ai", text: "Frete grátis! Quer pagar por Pix (mais 5% off) ou cartão?" },
            { type: "typing_user", duration: 1800 },
            { type: "user", text: "Pix! E chega em quanto tempo? Moro em SP", delay: 0, sentiment: "curiosity" },
            { type: "thinking", thinkingSteps: [{ icon: <MapPin className="size-3" />, text: "CEP: São Paulo/SP" }, { icon: <Truck className="size-3" />, text: "Sedex: 2 dias úteis" }, { icon: <Tag className="size-3" />, text: "Desconto Pix: -5%" }], duration: 1200 },
            { type: "ai", text: "SP capital chega em 2 dias úteis por Sedex!" },
            { type: "ai", text: "Com Pix fica R$280,35. Vou gerar o código? 💸" },
            { type: "typing_user", duration: 800 },
            { type: "user", text: "Gera o Pix!", delay: 0, sentiment: "positive" },
            { type: "event", text: "Lead Score: 60 → 92", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "thinking", thinkingSteps: [{ icon: <Tag className="size-3" />, text: "Gerando QR Code Pix" }, { icon: <CheckCheck className="size-3" />, text: "Pedido #4521 criado" }, { icon: <Clock className="size-3" />, text: "Validade: 30 minutos" }], duration: 2000 },
            { type: "event", text: "Venda fechada: Pedido #4521 — R$ 280,35", eventIcon: <CheckCheck className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "ai", text: "Pix gerado! ✅ R$280,35 — validade 30 min." },
            { type: "ai", text: "Assim que confirmar, envio o rastreio. Obrigada pela compra! 💕" },
            { type: "event", text: "CRM: close_sale executado", eventIcon: <CheckCheck className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
        ],
    },
    // ── 4. ADVOCACIA ────────────────────────────────────────────
    {
        id: "advocacia",
        name: "Fernanda Costa",
        initials: "FC",
        color: "bg-purple-100 text-purple-600",
        icon: <Scale className="size-3.5" />,
        label: "Advocacia",
        campaignName: "Trabalhista Google",
        funnelStage: "Triagem Concluída",
        aiCost: "R$ 0,60",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&c=thumb",
        initialMessage: "Bom dia, preciso de uma consulta sobre uma questão trabalhista urgente",
        source: "google",
        sessionName: "iPhone-Fernanda",
        temperature: 0.55,
        serviceStatus: "ai_active",
        interactionCount: 11,
        tags: ["Trabalhista"],
        steps: [
            { type: "thinking", thinkingSteps: [{ icon: <Scale className="size-3" />, text: "Classificando: Direito Trabalhista" }, { icon: <AlertTriangle className="size-3" />, text: "Prioridade: Alta/Urgente" }, { icon: <Calendar className="size-3" />, text: "Checando plantão jurídico" }], duration: 2200 },
            { type: "event", text: "Urgência detectada: prioridade alta", eventIcon: <AlertTriangle className="size-3" />, eventColor: "bg-red-50 border-red-200 text-red-700" },
            { type: "ai", text: "Bom dia! 👋 Entendo que é urgente." },
            { type: "ai", text: "Pode me contar brevemente o que aconteceu? Assim direciono para o especialista certo." },
            { type: "typing_user", duration: 2500 },
            { type: "user", text: "Fui demitida sem justa causa e não recebi as verbas rescisórias. Faz 45 dias.", delay: 0, sentiment: "negative" },
            { type: "event", text: "Nome extraído: 'Fernanda'", eventIcon: <UserCheck className="size-3" />, eventColor: "bg-blue-50 border-blue-200 text-blue-700" },
            { type: "event", text: "Sentimento: Negativo — frustração detectada", eventIcon: <Sparkles className="size-3" />, eventColor: "bg-red-50 border-red-200 text-red-700" },
            { type: "thinking", thinkingSteps: [{ icon: <FileText className="size-3" />, text: "Tema: Verbas Rescisórias" }, { icon: <Scale className="size-3" />, text: "Art. 477 CLT: prazo de 10 dias" }, { icon: <UserCheck className="size-3" />, text: "Selecionando especialista" }], duration: 2000 },
            { type: "event", text: "Classificação: Verbas Rescisórias (Art. 477 CLT)", eventIcon: <Scale className="size-3" />, eventColor: "bg-purple-50 border-purple-200 text-purple-700" },
            { type: "ai", text: "Fernanda, a empresa tinha 10 dias úteis para pagar. Já passou esse prazo, então cabe multa." },
            { type: "ai", text: "A Dra. Patrícia é nossa especialista em Trabalhista. Posso agendar uma consulta?" },
            { type: "typing_user", duration: 1500 },
            { type: "user", text: "Tem custo a consulta?", delay: 0, sentiment: "curiosity" },
            { type: "event", text: "Sentimento: Negativo → Neutro", eventIcon: <Sparkles className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            { type: "thinking", thinkingSteps: [{ icon: <Tag className="size-3" />, text: "Política: 1ª consulta cortesia" }, { icon: <Calendar className="size-3" />, text: "Próxima agenda: quinta 15h" }, { icon: <CheckCheck className="size-3" />, text: "Disponibilidade confirmada" }], duration: 1500 },
            { type: "ai", text: "A primeira consulta é gratuita! ✅" },
            { type: "ai", text: "A Dra. Patrícia tem horário quinta às 15h. Confirmo?" },
            { type: "typing_user", duration: 800 },
            { type: "user", text: "Confirma! O que preciso levar?", delay: 0, sentiment: "positive" },
            { type: "event", text: "Consulta agendada: Quinta 15h", eventIcon: <Calendar className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "event", text: "Lead Score: 40 → 72", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "thinking", thinkingSteps: [{ icon: <FileText className="size-3" />, text: "Checklist documental gerado" }, { icon: <MapPin className="size-3" />, text: "Preparando localização" }, { icon: <Scale className="size-3" />, text: "Analisando direitos devidos" }], duration: 1800 },
            { type: "ai", text: "Traga esses documentos: 📋" },
            { type: "ai", text: "CTPS, últimos 3 holerites, termo de rescisão (se recebeu) e extrato FGTS." },
            { type: "typing_user", duration: 2000 },
            { type: "user", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop", text: "Olha, essa é a minha carteira de trabalho", delay: 0 },
            { type: "event", text: "Imagem recebida: análise de documento", eventIcon: <FileText className="size-3" />, eventColor: "bg-blue-50 border-blue-200 text-blue-700" },
            { type: "user", text: "O que tenho direito a receber nesse caso?", delay: 0, sentiment: "curiosity" },
            { type: "thinking", thinkingSteps: [{ icon: <Scale className="size-3" />, text: "Calculando: sem justa causa" }, { icon: <FileText className="size-3" />, text: "Saldo, aviso, férias, 13º, FGTS+40%" }, { icon: <AlertTriangle className="size-3" />, text: "Multa Art.477: 1 salário" }], duration: 2200 },
            { type: "ai", text: "Na demissão sem justa causa, você tem direito a saldo de salário, aviso prévio, 13º e férias proporcionais, multa 40% FGTS e multa Art. 477." },
            { type: "ai", text: "A Dra. Patrícia vai calcular o valor exato na consulta. 💜" },
            { type: "typing_user", duration: 1200 },
            { type: "user", text: "Obrigada! Quero falar com a Dra. Patrícia antes da consulta, é possível?", delay: 0, sentiment: "positive" },
            { type: "event", text: "Sentimento: Neutro → Positivo", eventIcon: <Sparkles className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            { type: "thinking", thinkingSteps: [{ icon: <UserCheck className="size-3" />, text: "Transferindo para Dra. Patrícia" }, { icon: <FileText className="size-3" />, text: "Gerando resumo do caso" }, { icon: <CheckCheck className="size-3" />, text: "Handoff com contexto completo" }], duration: 1800 },
            { type: "event", text: "Transferido para Dra. Patrícia (Trabalhista)", eventIcon: <UserCheck className="size-3" />, eventColor: "bg-indigo-50 border-indigo-200 text-indigo-700" },
            { type: "ai", text: "Vou transferir agora! A Dra. Patrícia vai receber o histórico completo da conversa." },
            { type: "ai", text: "Obrigada pela confiança, Fernanda. Tudo vai dar certo! 💜" },
            { type: "event", text: "Qualificação completa: 4/4 slots", eventIcon: <CheckCheck className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
        ],
    },
    // ── 5. EDUCAÇÃO ─────────────────────────────────────────────
    {
        id: "educacao",
        name: "Lucas Oliveira",
        initials: "LO",
        color: "bg-amber-100 text-amber-600",
        icon: <GraduationCap className="size-3.5" />,
        label: "Educação",
        campaignName: "E-book Python",
        funnelStage: "Inscrito Aula",
        aiCost: "R$ 0,33",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&c=thumb",
        initialMessage: "Oi, quero saber mais sobre o curso de programação. Quanto custa?",
        source: "facebook",
        sessionName: "Android-Lucas",
        temperature: 0.78,
        serviceStatus: "ai_active",
        interactionCount: 8,
        tags: ["Bolsista"],
        steps: [
            { type: "thinking", thinkingSteps: [{ icon: <Search className="size-3" />, text: "Contexto: Curso Programação" }, { icon: <User className="size-3" />, text: "Perfil: Iniciante potencial" }, { icon: <Tag className="size-3" />, text: "Calculando oferta dinâmica" }], duration: 1800 },
            { type: "ai", text: "Oi Lucas! 🚀 Nosso curso tem 3 trilhas para diferentes níveis." },
            { type: "ai", text: "Você já programou antes ou está começando do zero?" },
            { type: "typing_user", duration: 1800 },
            { type: "user", text: "Começando do zero! Quero mudar de carreira pra tech", delay: 0, sentiment: "curiosity" },
            { type: "event", text: "Nome extraído: 'Lucas'", eventIcon: <UserCheck className="size-3" />, eventColor: "bg-blue-50 border-blue-200 text-blue-700" },
            { type: "event", text: "Perfil: transição de carreira, iniciante", eventIcon: <Target className="size-3" />, eventColor: "bg-purple-50 border-purple-200 text-purple-700" },
            { type: "thinking", thinkingSteps: [{ icon: <Target className="size-3" />, text: "Match: Trilha Full-Stack Jr" }, { icon: <Tag className="size-3" />, text: "Verificando bolsa disponível" }, { icon: <GraduationCap className="size-3" />, text: "Preparando plano de estudo" }], duration: 1500 },
            { type: "ai", text: "A trilha ideal para você é a Full-Stack Jr — 6 meses, do zero ao deploy! 💻" },
            { type: "ai", text: "Preço normal R$497/mês. Mas temos bolsa de 40% para transição de carreira!" },
            { type: "typing_user", duration: 1500 },
            { type: "user", text: "Bolsa de 40%?? Sério? Como funciona?", delay: 0, sentiment: "positive" },
            { type: "event", text: "Sentimento: Neutro → Positivo", eventIcon: <Sparkles className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            { type: "thinking", thinkingSteps: [{ icon: <Tag className="size-3" />, text: "Bolsa aplicada: R$297/mês" }, { icon: <CheckCheck className="size-3" />, text: "Condições: assiduidade 80%" }, { icon: <Video className="size-3" />, text: "Aula experimental disponível" }], duration: 1500 },
            { type: "event", text: "Bolsa aprovada: 40% → R$ 297/mês", eventIcon: <GraduationCap className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "ai", text: "Funciona assim: R$297/mês com bolsa, e a única condição é manter 80% de presença." },
            { type: "ai", text: "Inclui certificado reconhecido pelo MEC! 🎓 Quer assistir uma aula experimental grátis?" },
            { type: "typing_user", duration: 1000 },
            { type: "user", text: "Quero sim! E tem certificado mesmo?", delay: 0, sentiment: "positive" },
            { type: "event", text: "Lead Score: 35 → 60", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "thinking", thinkingSteps: [{ icon: <GraduationCap className="size-3" />, text: "Certificado MEC: confirmado" }, { icon: <Video className="size-3" />, text: "Liberando acesso experimental" }, { icon: <Clock className="size-3" />, text: "Aula ao vivo: hoje 20h" }], duration: 1800 },
            { type: "event", text: "Trial ativado: aula experimental liberada", eventIcon: <Play className="size-3" />, eventColor: "bg-blue-50 border-blue-200 text-blue-700" },
            { type: "ai", text: "Sim, certificado reconhecido pelo MEC e válido em todo Brasil! ✅" },
            { type: "ai", text: "Liberei uma aula ao vivo hoje às 20h: 'Seu primeiro site em 1 hora'. Posso te enviar o link?" },
            { type: "typing_user", duration: 800 },
            { type: "user", text: "Manda! Tô animado!", delay: 0, sentiment: "positive" },
            { type: "thinking", thinkingSteps: [{ icon: <CheckCheck className="size-3" />, text: "Link da aula gerado" }, { icon: <Target className="size-3" />, text: "Score: 60 → 82" }, { icon: <Calendar className="size-3" />, text: "Matrícula: vaga reservada 48h" }], duration: 1500 },
            { type: "event", text: "Lead Score: 60 → 82", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "ai", text: "Link enviado! 📩 A aula começa às 20h, entra 5 min antes." },
            { type: "ai", text: "E reservei uma vaga com bolsa por 48h para você. Depois o preço volta ao normal. 🔥" },
            { type: "typing_user", duration: 1500 },
            { type: "user", text: "Se eu gostar da aula, como faço a matrícula?", delay: 0, sentiment: "curiosity" },
            { type: "thinking", thinkingSteps: [{ icon: <FileText className="size-3" />, text: "Processo de matrícula" }, { icon: <Tag className="size-3" />, text: "Opções: Pix, boleto, cartão" }, { icon: <CheckCheck className="size-3" />, text: "Garantia de 7 dias" }], duration: 1200 },
            { type: "ai", text: "Super simples! Depois da aula, envio o link de matrícula aqui mesmo." },
            { type: "ai", text: "Aceita Pix, boleto ou cartão em até 12x. E tem garantia de 7 dias — sem risco! ✨" },
            { type: "event", text: "Qualificação completa: 4/4 slots", eventIcon: <CheckCheck className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
        ],
    },
    // ── 6. SAAS / TECH ──────────────────────────────────────────
    {
        id: "saas",
        name: "Pedro Santana",
        initials: "PS",
        color: "bg-cyan-100 text-cyan-600",
        icon: <Laptop className="size-3.5" />,
        label: "SaaS / Tech",
        campaignName: "API Waitlist",
        funnelStage: "Onboarding",
        aiCost: "R$ 0,12",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&c=thumb",
        initialMessage: "Vocês têm API? Preciso integrar com meu sistema",
        source: "direct",
        sessionName: "API-Pedro",
        temperature: 0.70,
        serviceStatus: "ai_active",
        interactionCount: 10,
        tags: ["Dev", "Trial"],
        steps: [
            { type: "thinking", thinkingSteps: [{ icon: <Code className="size-3" />, text: "Detectado: Developer Persona" }, { icon: <Webhook className="size-3" />, text: "Intent: Integração API" }, { icon: <FileText className="size-3" />, text: "Separando docs técnicas" }], duration: 2000 },
            { type: "event", text: "Persona: Developer", eventIcon: <Code className="size-3" />, eventColor: "bg-cyan-50 border-cyan-200 text-cyan-700" },
            { type: "ai", text: "Oi Pedro! Sim, temos API REST completa com webhooks e SDK." },
            { type: "ai", text: "Qual stack vocês usam? Assim envio o SDK certo. 🔧" },
            { type: "typing_user", duration: 2000 },
            { type: "user", text: "Node.js com TypeScript. Preciso de webhook pra cada msg recebida", delay: 0, sentiment: "neutral" },
            { type: "event", text: "Nome extraído: 'Pedro'", eventIcon: <UserCheck className="size-3" />, eventColor: "bg-blue-50 border-blue-200 text-blue-700" },
            { type: "event", text: "Stack: Node.js + TypeScript", eventIcon: <Code className="size-3" />, eventColor: "bg-purple-50 border-purple-200 text-purple-700" },
            { type: "thinking", thinkingSteps: [{ icon: <Laptop className="size-3" />, text: "Match SDK: @axis/node" }, { icon: <Webhook className="size-3" />, text: "Config: message.received" }, { icon: <Key className="size-3" />, text: "Gerando API Key Sandbox" }], duration: 1800 },
            { type: "event", text: "API Key Sandbox gerada", eventIcon: <Key className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            { type: "ai", text: "Perfeito! Enviei o link do SDK @axis/node com TypeScript types." },
            { type: "ai", text: "O webhook message.received dispara em tempo real. Criei uma API Key sandbox pra você! 🔑" },
            { type: "typing_user", duration: 1600 },
            { type: "user", text: "Top! E pra enviar msgs pro cliente via API?", delay: 0, sentiment: "curiosity" },
            { type: "thinking", thinkingSteps: [{ icon: <Code className="size-3" />, text: "Endpoint: POST /messages" }, { icon: <Webhook className="size-3" />, text: "Rate limit: 80 msg/s" }, { icon: <FileText className="size-3" />, text: "Docs: api.axis.ai" }], duration: 1200 },
            { type: "ai", text: "POST /api/v1/messages com body { to, text }. Rate limit: 80 msg/s." },
            { type: "ai", text: "Documentação completa: docs.axis.ai 📖" },
            { type: "typing_user", duration: 1800 },
            { type: "user", text: "Qual o modelo de pricing? Temos ~50k msgs/mês", delay: 0, sentiment: "curiosity" },
            { type: "event", text: "Volume: 50k msgs/mês", eventIcon: <Target className="size-3" />, eventColor: "bg-purple-50 border-purple-200 text-purple-700" },
            { type: "thinking", thinkingSteps: [{ icon: <Tag className="size-3" />, text: "Calculando: plano Scale" }, { icon: <Target className="size-3" />, text: "50k msgs = R$490/mês" }, { icon: <CheckCheck className="size-3" />, text: "Trial 14 dias disponível" }], duration: 1500 },
            { type: "event", text: "Lead Score: 45 → 72", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "ai", text: "Pra 50k msgs, o plano Scale é o ideal: R$490/mês com tudo incluso." },
            { type: "ai", text: "Primeiro mês é trial grátis + onboarding técnico com nosso time. 🚀" },
            { type: "typing_user", duration: 1200 },
            { type: "user", text: "Fechou! Como ativo o trial?", delay: 0, sentiment: "positive" },
            { type: "event", text: "Sentimento: Neutro → Positivo", eventIcon: <Sparkles className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            { type: "thinking", thinkingSteps: [{ icon: <Key className="size-3" />, text: "Ativando trial 14 dias" }, { icon: <Calendar className="size-3" />, text: "Agendando onboarding técnico" }, { icon: <Webhook className="size-3" />, text: "Habilitando ambiente prod" }], duration: 2000 },
            { type: "event", text: "Trial ativado: 14 dias (plano Scale)", eventIcon: <Play className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "event", text: "Onboarding: Quarta 15h", eventIcon: <Calendar className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "ai", text: "Trial ativado! ✅ Você já pode usar a API em produção por 14 dias." },
            { type: "ai", text: "Agendei um onboarding técnico com nosso dev Sr. quarta às 15h. Vai ser via Google Meet." },
            { type: "typing_user", duration: 1200 },
            { type: "user", text: "Top demais! Já vou integrar o sandbox hoje. Valeu!", delay: 0, sentiment: "positive" },
            { type: "ai", text: "Qualquer dúvida técnica, manda aqui mesmo que respondo rápido. Bom código! 🤓" },
            { type: "event", text: "Qualificação completa: 4/4 slots", eventIcon: <CheckCheck className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
        ],
    },
];

// ─────────────────────────────────────────────────────────────
// Message Type
// ─────────────────────────────────────────────────────────────
interface ChatMessage {
    id: string;
    body: string;
    image?: string;
    fromMe: boolean;
    isAi?: boolean;
    isEvent?: boolean;
    eventIcon?: React.ReactNode;
    eventColor?: string;
    sentiment?: string;
    timestamp: number;
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export function ConversationShowcase() {
    const [activeIdx, setActiveIdx] = useState(0);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isUserTyping, setIsUserTyping] = useState(false);
    const [thinkingSteps, setThinkingSteps] = useState<{ icon: React.ReactNode, text: string }[]>([]);
    const [currentThinkStep, setCurrentThinkStep] = useState(0);
    const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

    // Cursor Animation State
    const [cursorIdx, setCursorIdx] = useState(0);
    const [isClicking, setIsClicking] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 150, y: 40 });

    // Mobile View State: 'list' (Sidebar) or 'chat' (Showcase)
    const [mobileView, setMobileView] = useState<"list" | "chat">("chat");

    // Recalculate cursor position when cursorIdx changes
    useEffect(() => {
        const item = itemRefs.current[cursorIdx];
        const list = chatListRef.current;
        if (item && list) {
            const y = item.offsetTop + item.offsetHeight / 2;
            const x = item.offsetLeft + item.offsetWidth * 0.55;
            setCursorPos({ x, y });
        }
    }, [cursorIdx]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLDivElement>(null);
    const chatListRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const isInView = useInView(sectionRef, { once: false, margin: "0px 0px -100px 0px" });
    const cancelledRef = useRef(false);

    const scenario = SCENARIOS[activeIdx];

    // Auto-scroll on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }
    }, [messages, thinkingSteps, isUserTyping]);

    // Simulate unread badges
    useEffect(() => {
        if (!isInView) return;
        const interval = setInterval(() => {
            setUnreadCounts((prev) => {
                const next = { ...prev };
                const randomIdx = Math.floor(Math.random() * SCENARIOS.length);
                if (randomIdx !== activeIdx) {
                    next[randomIdx] = (next[randomIdx] || 0) + 1;
                }
                return next;
            });
        }, 3500 + Math.random() * 2000);
        return () => clearInterval(interval);
    }, [isInView, activeIdx]);

    // Auto-scroll sidebar to active item
    useEffect(() => {
        const el = document.getElementById(`sidebar-item-${activeIdx}`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [activeIdx]);

    // ─── Scenario Runner ───
    useEffect(() => {
        if (!isInView) return;

        cancelledRef.current = false;
        let timeouts: NodeJS.Timeout[] = [];

        const clearAll = () => timeouts.forEach(clearTimeout);

        const schedule = (fn: () => void, ms: number) => {
            const t = setTimeout(() => {
                if (!cancelledRef.current) fn();
            }, ms);
            timeouts.push(t);
            return t;
        };

        // Reset state
        setMessages([]);
        setThinkingSteps([]);
        setIsUserTyping(false);
        setCurrentThinkStep(0);

        // Clear unread for this chat
        setUnreadCounts((prev) => {
            const next = { ...prev };
            delete next[activeIdx];
            return next;
        });

        // Add initial message
        const initMsg: ChatMessage = {
            id: `init-${scenario.id}-${Date.now()}`,
            body: scenario.initialMessage,
            fromMe: false,
            timestamp: Date.now() / 1000,
        };

        schedule(() => setMessages([initMsg]), 300);

        // Run steps sequentially
        let elapsed = 800;
        const steps = scenario.steps;

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];

            if (step.type === "thinking") {
                const stepsArr = step.thinkingSteps || [];
                const stepDuration = (step.duration || 2000) / stepsArr.length;

                // Show thinking container
                const thinkStart = elapsed;
                schedule(() => {
                    setThinkingSteps(stepsArr);
                    setCurrentThinkStep(0);
                }, thinkStart);

                // Animate through each step
                for (let s = 0; s < stepsArr.length; s++) {
                    schedule(() => setCurrentThinkStep(s), thinkStart + s * stepDuration + 200);
                }

                // Clear thinking
                elapsed += (step.duration || 2000) + 200;
                schedule(() => {
                    setThinkingSteps([]);
                    setCurrentThinkStep(0);
                }, elapsed);

            } else if (step.type === "typing_user") {
                schedule(() => setIsUserTyping(true), elapsed);
                elapsed += step.duration || 1000;
                schedule(() => setIsUserTyping(false), elapsed);

            } else if (step.type === "user") {
                elapsed += step.delay || 1500;
                const userElapsed = elapsed;
                schedule(() => {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: `user-${i}-${Date.now()}`,
                            body: step.text || "",
                            image: step.image,
                            fromMe: false,
                            timestamp: Date.now() / 1000,
                        },
                    ]);
                }, userElapsed);
                elapsed += 400;

            } else if (step.type === "ai") {
                const aiElapsed = elapsed + 200;
                schedule(() => {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: `ai-${i}-${Date.now()}`,
                            body: step.text || "",
                            image: step.image,
                            fromMe: true,
                            isAi: true,
                            timestamp: Date.now() / 1000,
                        },
                    ]);
                }, aiElapsed);
                elapsed = aiElapsed + 600;

            } else if (step.type === "event") {
                const evElapsed = elapsed + 100;
                schedule(() => {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: `ev-${i}-${Date.now()}`,
                            body: step.text!,
                            fromMe: false,
                            isEvent: true,
                            eventIcon: step.eventIcon,
                            eventColor: step.eventColor,
                            timestamp: Date.now() / 1000,
                        },
                    ]);
                }, evElapsed);
                elapsed = evElapsed + 350;
            }
        }

        // Auto-advance to next scenario with cursor animation
        const nextIdx = (activeIdx + 1) % SCENARIOS.length;

        // 1. Go back to list view (Mobile)
        schedule(() => setMobileView("list"), elapsed + 1000);

        // 2. Move cursor to next item
        schedule(() => setCursorIdx(nextIdx), elapsed + 2000); // Wait a bit after chat finishes

        // 3. Click animation (down)
        schedule(() => setIsClicking(true), elapsed + 2800); // 800ms travel time

        // 4. Change chat (on click release/finish) & Reset click
        schedule(() => {
            setIsClicking(false);
            setActiveIdx(nextIdx);
            setMobileView("chat"); // Enter chat view
        }, elapsed + 3000); // 200ms click hold

        return () => {
            cancelledRef.current = true;
            clearAll();
        };
    }, [activeIdx, isInView]);

    return (
        <section
            ref={sectionRef}
            id="demo"
            className="relative w-full py-16 md:py-24 bg-gradient-to-b from-white via-slate-50/80 to-white overflow-hidden"
        >
            {/* Background decorative */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/[0.03] rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-violet-500/[0.03] rounded-full blur-3xl" />
            </div>

            {/* ─── Headline ─── */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-10 md:mb-16 relative z-10">
                <ScrollReveal width="100%">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-blue-100 bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase mb-5 rounded-full">
                            <MessageCircle className="w-3 h-3" />
                            Demonstração ao Vivo
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 md:mb-6 tracking-tight leading-[1.1]">
                            Veja a ÁXIS{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                                em Ação
                            </span>
                        </h2>
                        <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-light">
                            6 nichos diferentes, 1 inteligência. Veja como a IA conversa
                            com empatia, qualifica e fecha — em tempo real.
                        </p>
                    </div>
                </ScrollReveal>
            </div>



            {/* ─── Chat Container ─── */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
                <ScrollReveal width="100%" mode="fade-up" delay={0.15}>
                    <div className="relative pt-10 pb-10 md:py-20 px-2 bg-transparent w-full">
                        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-3/4 h-1/3 blur-[5rem] animate-image-glow"></div>

                        <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200/60 bg-white shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row"
                            style={{
                                height: "700px",
                                WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
                                maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)"
                            }}
                        >

                            {/* ─── Sidebar (Show on Mobile if "list", always on Desktop) ─── */}
                            <div className={`
                                flex-col w-full md:w-[300px] lg:w-[340px] shrink-0 border-r border-slate-100 bg-slate-50/50
                                ${mobileView === "list" ? "flex" : "hidden md:flex"}
                            `}>
                                {/* Sidebar Header */}
                                <div className="p-4 pb-3 border-b border-slate-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Conversas</h3>
                                        <div className="flex items-center gap-1">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                            </span>
                                            <span className="text-[10px] text-green-600 font-medium">6 ativos</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                                        {["Todas", "Prospectando", "Qualificado"].map((tab, i) => (
                                            <button
                                                key={tab}
                                                className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all duration-200 whitespace-nowrap ${i === 0
                                                    ? "bg-blue-600 text-white shadow-sm"
                                                    : "bg-white text-slate-500 border border-slate-200"
                                                    }`}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Chat List */}
                                <div ref={chatListRef} className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1 relative">
                                    <AnimatePresence mode="popLayout">
                                        {SCENARIOS.map((chat, idx) => {
                                            const isActive = idx === activeIdx;
                                            const unread = unreadCounts[idx] || 0;
                                            return (
                                                <motion.button
                                                    key={chat.id}
                                                    id={`sidebar-item-${idx}`}
                                                    layout
                                                    // onClick={() => setActiveIdx(idx)} // Disabled manual interaction
                                                    className={`
                                                    w-full p-2.5 rounded-xl flex gap-3 text-left transition-all duration-300 relative overflow-hidden group pointer-events-none
                                                        ${isActive
                                                            ? "bg-white border border-blue-100 shadow-sm"
                                                            : "bg-transparent border border-transparent"
                                                        }
                                                    `}
                                                    ref={(el) => { itemRefs.current[idx] = el; }}
                                                >
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="showcaseActiveIndicator"
                                                            className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full"
                                                        />
                                                    )}
                                                    <Avatar className="size-11 shrink-0 border border-slate-100">
                                                        <AvatarImage src={chat.avatar} alt={chat.name} className="object-cover" />
                                                        <AvatarFallback className={chat.color}>
                                                            {chat.initials}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        {/* Row 1: Name + time */}
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span className={`text-sm font-bold truncate ${isActive ? "text-slate-900" : "text-slate-700"}`}>
                                                                {chat.name}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                                                                {isActive ? "Agora" : `${idx + 2}min`}
                                                            </span>
                                                        </div>

                                                        {/* Row 2: Campaign + Session */}
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md truncate max-w-[110px]">
                                                                {chat.campaignName}
                                                            </span>
                                                        </div>

                                                        {/* Row 3: Funnel + Deal + Temp */}
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${chat.funnelStage.includes("Qualificado") || chat.funnelStage.includes("Agendada") || chat.funnelStage.includes("Checkout") || chat.funnelStage.includes("Confirmado") || chat.funnelStage.includes("Conclu")
                                                                ? "bg-green-50 text-green-600 border border-green-100"
                                                                : chat.funnelStage.includes("Abandonado")
                                                                    ? "bg-amber-50 text-amber-600 border border-amber-100"
                                                                    : "bg-blue-50 text-blue-600 border border-blue-100"
                                                                }`}>
                                                                {chat.funnelStage}
                                                            </span>



                                                            {unread > 0 && !isActive && (
                                                                <motion.span
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    className="shrink-0 ml-auto w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold shadow-sm shadow-blue-500/30"
                                                                >
                                                                    {unread}
                                                                </motion.span>
                                                            )}
                                                        </div>

                                                        {/* Row 4: Source + msgs + AI cost */}
                                                        <div className="flex items-center gap-2 text-[9px] text-slate-400">
                                                            <span className="flex items-center gap-0.5" title={`Fonte: ${chat.source}`}>
                                                                {(() => {
                                                                    switch (chat.source) {
                                                                        case "facebook": return <><Megaphone className="size-2.5 text-blue-500" /><span className="text-blue-500">Meta</span></>;
                                                                        case "google": return <><Search className="size-2.5 text-red-400" /><span className="text-red-400">Google</span></>;
                                                                        case "apify": return <><Globe className="size-2.5 text-purple-500" /><span className="text-purple-500">Apify</span></>;
                                                                        default: return <><MessageSquare className="size-2.5 text-slate-400" /><span>Direto</span></>;
                                                                    }
                                                                })()}
                                                            </span>
                                                            <span className="text-slate-300">·</span>
                                                            <span className="flex items-center gap-0.5">
                                                                <MessageCircle className="size-2.5" />
                                                                {chat.interactionCount}
                                                            </span>
                                                            <span className="text-slate-300">·</span>
                                                            <span className="flex items-center gap-0.5">
                                                                <BrainCircuit className="size-2.5" />
                                                                {chat.aiCost}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </AnimatePresence>

                                    {/* Fake Cursor */}
                                    <motion.div
                                        className="absolute left-0 top-0 pointer-events-none z-50 text-slate-900 drop-shadow-xl"
                                        animate={{
                                            y: cursorPos.y,
                                            x: cursorPos.x,
                                            scale: isClicking ? 0.85 : 1
                                        }}
                                        initial={{ x: cursorPos.x, y: cursorPos.y }}
                                        transition={{
                                            y: { type: "spring", stiffness: 80, damping: 18, mass: 0.8 },
                                            x: { type: "spring", stiffness: 80, damping: 18, mass: 0.8 },
                                            scale: { duration: 0.1 }
                                        }}
                                    >
                                        <MousePointer2 className="size-5 fill-slate-900 text-slate-50 relative z-50" />
                                        {isClicking && (
                                            <span className="absolute -top-2 -left-2 size-8 bg-slate-400/20 rounded-full animate-ping" />
                                        )}
                                    </motion.div>
                                </div>
                            </div>

                            {/* ─── Chat Area (Show on Mobile if "chat", always on Desktop) ─── */}
                            <div className={`
                                flex-1 min-w-0 flex-col bg-white relative
                                ${mobileView === "chat" ? "flex" : "hidden md:flex"}
                            `}>
                                {/* Chat Header */}
                                <div className="h-14 sm:h-16 w-full shrink-0 px-4 sm:px-6 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-sm z-50 sticky top-0">
                                    <div className="flex items-center gap-3">
                                        {/* Back Button (Mobile Only) */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="md:hidden -ml-2 text-slate-500"
                                            onClick={() => setMobileView("list")}
                                        >
                                            <ChevronLeft className="size-6" />
                                        </Button>

                                        <Avatar className="size-8 sm:size-9 ring-2 ring-white shadow-sm">
                                            <AvatarImage src={scenario.avatar} alt={scenario.name} className="object-cover" />
                                            <AvatarFallback className={scenario.color}>
                                                {scenario.initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <AnimatePresence mode="wait">
                                                <motion.h3
                                                    key={scenario.name}
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -4 }}
                                                    className="font-semibold text-sm text-slate-900 leading-tight truncate"
                                                >
                                                    {scenario.name}
                                                </motion.h3>
                                            </AnimatePresence>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] sm:text-xs text-green-600 font-medium">Online</span>
                                                <span className="text-[10px] text-slate-300 mx-0.5">•</span>
                                                <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 font-medium">
                                                    <Sparkles className="size-2.5 text-violet-500" />
                                                    IA Ativa
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900 hidden sm:flex">
                                        <MoreVertical className="size-5" />
                                    </Button>
                                </div>

                                {/* Messages */}
                                <div
                                    ref={scrollRef}
                                    className="flex-1 overflow-y-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-36 flex flex-col gap-3 sm:gap-4 scrollbar-hide"
                                    style={{
                                        maskImage: "linear-gradient(to bottom, transparent 0%, black 5%, black 100%)",
                                        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 5%, black 100%)",
                                    }}
                                >
                                    <AnimatePresence initial={false}>
                                        {messages.map((msg) => (
                                            msg.isEvent ? (
                                                /* ── Event Pill (centered) ── */
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                    className="w-full flex justify-center"
                                                >
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium ${msg.eventColor || "bg-slate-50 border-slate-200 text-slate-600"}`}>
                                                        {msg.eventIcon && <span className="shrink-0 [&>svg]:size-3">{msg.eventIcon}</span>}
                                                        {msg.body}
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                /* ── Normal Chat Bubble ── */
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
                                                    className={`w-full flex items-end gap-2 ${msg.fromMe ? "justify-end" : "justify-start"}`}
                                                >
                                                    {!msg.fromMe && (
                                                        <Avatar className="size-6 shrink-0 mb-1">
                                                            <AvatarImage src={scenario.avatar} alt={scenario.name} className="object-cover" />
                                                            <AvatarFallback className={`${scenario.color} text-[8px] font-bold`}>
                                                                {scenario.initials}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <div className={`flex flex-col ${msg.fromMe ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[70%]`}>
                                                        {msg.fromMe && (
                                                            <span className="text-[10px] text-slate-400 mb-1 px-1 flex items-center gap-1">
                                                                <Sparkles className="size-2.5 text-violet-500" />
                                                                ÁXIS IA
                                                            </span>
                                                        )}
                                                        <div
                                                            className={`p-3 rounded-2xl text-left ${msg.fromMe
                                                                ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm shadow-lg shadow-blue-600/10"
                                                                : "bg-slate-100 rounded-tl-sm text-slate-800"
                                                                }`}
                                                        >
                                                            {msg.image && (
                                                                <img src={msg.image} alt="" className="rounded-lg mb-1.5 max-w-full max-h-40 object-cover" />
                                                            )}
                                                            {msg.body && (
                                                                <p className="text-[13px] sm:text-sm font-normal leading-relaxed whitespace-pre-wrap break-words">
                                                                    {msg.body}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center justify-between gap-2 mt-1">
                                                                {/* Sentiment Badge for User Messages */}
                                                                {!msg.fromMe && (msg as any).sentiment && (
                                                                    <span className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded-full flex items-center gap-1 text-slate-500 font-medium" title="Análise de Sentimento">
                                                                        {(() => {
                                                                            switch ((msg as any).sentiment) {
                                                                                case "positive": return "😊 Positivo";
                                                                                case "negative": return "😠 Negativo";
                                                                                case "urgency": return "🚨 Urgente";
                                                                                case "curiosity": return "🤔 Curioso";
                                                                                case "neutral": return "😐 Neutro";
                                                                                default: return "";
                                                                            }
                                                                        })()}
                                                                    </span>
                                                                )}
                                                                <div className="flex items-center gap-1 opacity-60 ml-auto">
                                                                    <span className={`text-[10px] ${msg.fromMe ? "text-blue-200" : "text-slate-400"}`}>
                                                                        {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                                    </span>
                                                                    {msg.fromMe && (
                                                                        <CheckCheck className="size-3 text-blue-200" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {msg.fromMe && (
                                                        <Avatar className="size-6 shrink-0 mb-1">
                                                            <AvatarFallback className="bg-blue-600 text-white text-[8px] font-bold">ÁX</AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                </motion.div>
                                            )
                                        ))}
                                    </AnimatePresence>

                                    {/* Thinking Animation */}
                                    <AnimatePresence>
                                        {thinkingSteps.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                className="w-full flex items-end gap-2 justify-end"
                                            >
                                                <div className="space-y-1">
                                                    {thinkingSteps.map((step, idx) => (
                                                        <motion.div
                                                            key={`think-${idx}`}
                                                            initial={{ opacity: 0, x: 10 }}
                                                            animate={{
                                                                opacity: idx <= currentThinkStep ? 1 : 0.4,
                                                                x: 0,
                                                                scale: 1
                                                            }}
                                                            transition={{ duration: 0.3 }}
                                                            className={`flex items-center gap-2 text-[11px] sm:text-xs font-medium ${idx <= currentThinkStep
                                                                ? "text-violet-600"
                                                                : "text-slate-300"
                                                                }`}
                                                        >
                                                            <span className={idx <= currentThinkStep ? "text-violet-500" : "opacity-50"}>
                                                                {step.icon}
                                                            </span>
                                                            {step.text}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                                <Avatar className="size-6 shrink-0 mb-1 opacity-80">
                                                    <AvatarFallback className="bg-violet-100 text-violet-600 text-[8px] font-bold">🧠</AvatarFallback>
                                                </Avatar>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* User Typing Indicator (Left Side, Minimalist) */}
                                    <AnimatePresence>
                                        {isUserTyping && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="w-full flex items-center justify-start gap-2 pl-1"
                                            >
                                                <Avatar className="size-6 shrink-0 opacity-60">
                                                    <AvatarImage src={scenario.avatar} className="object-cover grayscale" />
                                                    <AvatarFallback className="bg-slate-100 text-[8px] text-slate-400">
                                                        {scenario.initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex items-center gap-1">
                                                    <motion.span
                                                        animate={{ y: [0, -3, 0] }}
                                                        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                                                        className="w-1.5 h-1.5 bg-slate-300 rounded-full"
                                                    />
                                                    <motion.span
                                                        animate={{ y: [0, -3, 0] }}
                                                        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                                                        className="w-1.5 h-1.5 bg-slate-300 rounded-full"
                                                    />
                                                    <motion.span
                                                        animate={{ y: [0, -3, 0] }}
                                                        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                                                        className="w-1.5 h-1.5 bg-slate-300 rounded-full"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </AnimatePresence>


                                </div>

                                {/* Input Area (Visual) */}
                                <div className="absolute bottom-0 w-full p-3 sm:p-4 bg-gradient-to-t from-white via-white/95 to-transparent z-20 pointer-events-none">
                                    <div className="max-w-3xl mx-auto relative flex items-center gap-2">
                                        <div className="flex-1 bg-white border border-slate-200 rounded-full h-11 sm:h-12 px-2 flex items-center gap-1 shadow-lg shadow-black/5 backdrop-blur-sm">
                                            <Button variant="ghost" className="p-2 hover:bg-slate-100 rounded-full shrink-0 text-slate-400" type="button">
                                                <Paperclip className="size-4 sm:size-5" />
                                            </Button>
                                            <span className="flex-1 text-xs sm:text-sm text-slate-400 px-2">Digite sua mensagem...</span>
                                            <Button variant="ghost" className="p-2 rounded-full shrink-0 text-slate-400 hover:bg-slate-100" type="button">
                                                <Mic className="size-4 sm:size-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Fade Overlays - Inside Container for proper masking */}
                            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-50"></div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}
