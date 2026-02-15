// This file is a staging area for the new scenarios.
// The content below should replace the SCENARIOS constant in conversation-showcase.tsx

// ─────────────────────────────────────────────────────────────
// 6 Rich Scenarios — 60+ steps each, showcasing backend features
// ─────────────────────────────────────────────────────────────
/*
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
        steps: [
            // --- Turn 1: AI greeting + qualification start ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Search className="size-3" />, text: "Consultando estoque atual..." },
                    { icon: <MapPin className="size-3" />, text: "Verificando unidades com vista" },
                    { icon: <UserCheck className="size-3" />, text: "Personalizando oferta" }
                ],
                duration: 2500
            },
            { type: "ai", text: "Oi! Que bom que se interessou pelo Jardins do Parque! 🌿" },
            { type: "ai", text: "Temos 3 torres e unidades de 2 e 3 quartos. Você busca qual perfil?" },
            // --- Turn 2: User gives preference ---
            { type: "typing_user", duration: 1500 },
            { type: "user", text: "Prefiro 3 quartos, andar alto, sol da manhã", delay: 0, sentiment: "positive" },
            { type: "event", text: "📛 Nome extraído: 'Ana'", eventIcon: <UserCheck className="size-3" />, eventColor: "bg-blue-50 border-blue-200 text-blue-700" },
            // --- Turn 3: AI filters + suggests ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Home className="size-3" />, text: "Filtrando: 3Q + alto + manhã" },
                    { icon: <Tag className="size-3" />, text: "2 unidades disponíveis" },
                    { icon: <Calendar className="size-3" />, text: "Sugerindo visita presencial" }
                ],
                duration: 2000
            },
            { type: "event", text: "🎯 Necessidade: 3 quartos, sol manhã, andar alto", eventIcon: <Target className="size-3" />, eventColor: "bg-purple-50 border-purple-200 text-purple-700" },
            { type: "ai", text: "Perfeito, Ana! Tenho a unidade 1504 — 15º andar, face leste, vista livre. ☀️" },
            { type: "ai", text: "São 98m² com varanda gourmet. Quer ver o tour virtual?" },
            // --- Turn 4: User asks price ---
            { type: "typing_user", duration: 1800 },
            { type: "user", text: "Sim! E qual a faixa de preço?", delay: 0, sentiment: "curiosity" },
            { type: "event", text: "📊 Sentimento: Neutro → Positivo", eventIcon: <Sparkles className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            // --- Turn 5: AI gives pricing + incentive ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Tag className="size-3" />, text: "Tabela Dez/2024: R$680k–R$750k" },
                    { icon: <Clock className="size-3" />, text: "Condição pré-lançamento ativa" },
                    { icon: <Target className="size-3" />, text: "Analisando perfil de compra" }
                ],
                duration: 2200
            },
            { type: "event", text: "🎯 Orçamento: aguardando qualificação", eventIcon: <Tag className="size-3" />, eventColor: "bg-slate-50 border-slate-200 text-slate-600" },
            { type: "ai", text: "A 1504 está por R$720k na tabela de pré-lançamento — 10% de desconto até sexta." },
            { type: "ai", text: "Aceita FGTS e financiamento Caixa. Gostaria de simular as parcelas?" },
            // --- Turn 6: User wants simulation ---
            { type: "typing_user", duration: 1200 },
            { type: "user", text: "Quero sim! Consigo entrada de 150k", delay: 0, sentiment: "positive" },
            { type: "event", text: "🎯 Orçamento: R$ 150k entrada", eventIcon: <Tag className="size-3" />, eventColor: "bg-purple-50 border-purple-200 text-purple-700" },
            // --- Turn 7: AI runs simulation ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <FileText className="size-3" />, text: "Simulação financeira gerada" },
                    { icon: <CheckCheck className="size-3" />, text: "Parcelas em 360 meses" },
                    { icon: <Target className="size-3" />, text: "Score de lead: 45 → 65" }
                ],
                duration: 2000
            },
            { type: "event", text: "⬆️ Lead Score: 45 → 65", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "ai", text: "Com R$150k de entrada, as parcelas ficam em ~R$3.800/mês (SAC, 360m)." },
            { type: "ai", text: "Posso enviar a simulação completa em PDF. Qual seu e-mail? 📧" },
            // --- Turn 8: User provides email ---
            { type: "typing_user", duration: 2000 },
            { type: "user", text: "ana.souza@email.com", delay: 0 },
            // --- Turn 9: AI sends PDF + schedules visit ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <FileText className="size-3" />, text: "PDF de simulação gerado" },
                    { icon: <Calendar className="size-3" />, text: "Verificando horários de visita" },
                    { icon: <CheckCheck className="size-3" />, text: "Disponibilidade: Sáb 10h" }
                ],
                duration: 1800
            },
            { type: "ai", text: "Simulação enviada! 📩 Veja que a taxa está em 10.49% a.a. pela Caixa." },
            { type: "ai", text: "Que tal agendar uma visita ao decorado? Sábado às 10h funciona para você?" },
            // --- Turn 10: User confirms visit ---
            { type: "typing_user", duration: 1000 },
            { type: "user", text: "Sábado às 10h tá ótimo!", delay: 0, sentiment: "positive" },
            { type: "event", text: "📅 Reunião agendada: Sábado 10h", eventIcon: <Calendar className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "event", text: "⬆️ Lead Score: 65 → 88", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            // --- Turn 11: AI confirms + closing ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Calendar className="size-3" />, text: "Agendamento confirmado no CRM" },
                    { icon: <MapPin className="size-3" />, text: "Enviando localização" },
                    { icon: <CheckCheck className="size-3" />, text: "Qualificação BANT: 3/4 slots" }
                ],
                duration: 1500
            },
            { type: "ai", text: "Agendado! ✅ Sábado 10h — Stand Jardins, Av. das Palmeiras, 350." },
            { type: "ai", text: "Vou te enviar a localização e um lembrete na sexta. Até lá, Ana! 🏡" },
            { type: "event", text: "✅ Qualificação: 3/4 slots preenchidos", eventIcon: <CheckCheck className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
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
        steps: [
            // --- Turn 1: AI triages ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <FileText className="size-3" />, text: "Identificando tratamento: Clareamento" },
                    { icon: <UserCheck className="size-3" />, text: "Protocolo de triagem iniciado" },
                    { icon: <MessageCircle className="size-3" />, text: "Formulando resposta empática" }
                ],
                duration: 2200
            },
            { type: "ai", text: "Boa tarde! 😁 O clareamento é um dos tratamentos mais procurados." },
            { type: "ai", text: "Temos 3 opções: caseiro, LED ou a laser. Você já fez clareamento antes?" },
            // --- Turn 2: User shares history ---
            { type: "typing_user", duration: 1800 },
            { type: "user", text: "Nunca fiz, mas tenho um pouco de sensibilidade nos dentes", delay: 0, sentiment: "neutral" },
            { type: "event", text: "📛 Nome extraído: paciente não identificado", eventIcon: <UserCheck className="size-3" />, eventColor: "bg-slate-50 border-slate-200 text-slate-600" },
            // --- Turn 3: AI detects sensitivity ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <AlertTriangle className="size-3" />, text: "Alerta: Sensibilidade detectada" },
                    { icon: <Stethoscope className="size-3" />, text: "Recomendação: Laser terapêutico" },
                    { icon: <Calendar className="size-3" />, text: "Verificando agenda Dr. Ricardo" }
                ],
                duration: 2000
            },
            { type: "event", text: "⚠️ Sensibilidade detectada → protocolo especial", eventIcon: <AlertTriangle className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            { type: "ai", text: "Entendi! Nesse caso, recomendo o clareamento a laser com dessensibilizante prévio. 🛡️" },
            { type: "ai", text: "É o protocolo mais seguro para quem tem sensibilidade. O resultado fica incrível!" },
            // --- Turn 4: User asks price ---
            { type: "typing_user", duration: 1200 },
            { type: "user", text: "E quanto custa?", delay: 0, sentiment: "curiosity" },
            // --- Turn 5: AI gives pricing ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Tag className="size-3" />, text: "Tabela: Laser = R$1.200" },
                    { icon: <Target className="size-3" />, text: "Condição especial: 1ª vez" },
                    { icon: <CheckCheck className="size-3" />, text: "Pré-avaliação incluída" }
                ],
                duration: 1800
            },
            { type: "ai", text: "O laser com dessensibilizante está por R$1.200 (3 sessões). Inclui avaliação grátis." },
            { type: "ai", text: "E como é sua primeira vez, vou aplicar 15% de desconto. Fica R$1.020! 🎉" },
            // --- Turn 6: User interested ---
            { type: "typing_user", duration: 1500 },
            { type: "user", text: "Opa, gostei! Tem horário essa semana?", delay: 0, sentiment: "positive" },
            { type: "event", text: "📊 Sentimento: Neutro → Positivo", eventIcon: <Sparkles className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            { type: "event", text: "⬆️ Lead Score: 30 → 55", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            // --- Turn 7: AI checks schedule ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Calendar className="size-3" />, text: "Verificando agenda da semana" },
                    { icon: <Clock className="size-3" />, text: "Quinta 14h e Sexta 10h livres" },
                    { icon: <Stethoscope className="size-3" />, text: "Dr. Ricardo disponível" }
                ],
                duration: 1500
            },
            { type: "ai", text: "Temos quinta às 14h ou sexta às 10h com o Dr. Ricardo. Qual prefere?" },
            // --- Turn 8: User picks time ---
            { type: "typing_user", duration: 800 },
            { type: "user", text: "Quinta 14h serve perfeito", delay: 0, sentiment: "positive" },
            // --- Turn 9: AI confirms + asks name ---
            { type: "event", text: "📅 Consulta agendada: Quinta 14h", eventIcon: <Calendar className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Calendar className="size-3" />, text: "Agendamento confirmado" },
                    { icon: <UserCheck className="size-3" />, text: "Solicitando dados do paciente" },
                    { icon: <FileText className="size-3" />, text: "Preparando ficha" }
                ],
                duration: 1500
            },
            { type: "ai", text: "Agendado! ✅ Quinta, 14h, com Dr. Ricardo." },
            { type: "ai", text: "Para a ficha, pode me enviar seu nome completo e data de nascimento?" },
            // --- Turn 10: User provides data ---
            { type: "typing_user", duration: 2200 },
            { type: "user", text: "Mariana Costa, 15/03/1990", delay: 0 },
            { type: "event", text: "📛 Nome salvo: 'Mariana Costa'", eventIcon: <UserCheck className="size-3" />, eventColor: "bg-blue-50 border-blue-200 text-blue-700" },
            // --- Turn 11: AI final confirmation ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <CheckCheck className="size-3" />, text: "Ficha criada no sistema" },
                    { icon: <MapPin className="size-3" />, text: "Enviando localização da clínica" },
                    { icon: <Target className="size-3" />, text: "Score: 55 → 80" }
                ],
                duration: 1500
            },
            { type: "event", text: "⬆️ Lead Score: 55 → 80", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "ai", text: "Pronto, Mariana! Enviei a localização da clínica e um lembrete será enviado na quarta. 📍" },
            { type: "ai", text: "Qualquer dúvida antes da consulta, pode mandar aqui! 😊" },
            { type: "event", text: "✅ Qualificação: 4/4 slots preenchidos", eventIcon: <CheckCheck className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
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
        steps: [
            // --- Turn 1: AI checks stock ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Search className="size-3" />, text: "Buscando SKU: Vestido Vermelho" },
                    { icon: <CheckCheck className="size-3" />, text: "Estoque M: 3 unidades" },
                    { icon: <Truck className="size-3" />, text: "Cálculo de frete preparado" }
                ],
                duration: 1800
            },
            { type: "ai", text: "Oi! Temos sim, restam apenas 3 no tamanho M! ❤️" },
            { type: "ai", text: "Ele é de viscose premium, veste super bem. Quer que eu separe um pra você?" },
            // --- Turn 2: Cross-sell trigger ---
            { type: "typing_user", duration: 1600 },
            { type: "user", text: "Que maravilha! Vocês têm bolsa que combina?", delay: 0, sentiment: "positive" },
            { type: "event", text: "📛 Nome extraído: cliente não identificada", eventIcon: <UserCheck className="size-3" />, eventColor: "bg-slate-50 border-slate-200 text-slate-600" },
            // --- Turn 3: AI cross-sells ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <ShoppingBag className="size-3" />, text: "Cross-sell: Acessórios" },
                    { icon: <Target className="size-3" />, text: "Match: Clutch Vermelha" },
                    { icon: <Tag className="size-3" />, text: "Gerando oferta combo" }
                ],
                duration: 1500
            },
            { type: "event", text: "🛒 Cross-sell ativado: acessórios complementares", eventIcon: <ShoppingBag className="size-3" />, eventColor: "bg-purple-50 border-purple-200 text-purple-700" },
            { type: "ai", text: "Temos a clutch vermelha que é a cara desse vestido! R$89,90." },
            { type: "ai", text: "E se levar os dois, frete grátis + 10% no combo! 🔥" },
            // --- Turn 4: Cart building ---
            { type: "typing_user", duration: 1200 },
            { type: "user", text: "Perfeito! Adiciona os dois", delay: 0, sentiment: "positive" },
            { type: "event", text: "📊 Sentimento: Positivo ✓", eventIcon: <Sparkles className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            // --- Turn 5: AI builds cart ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <ShoppingBag className="size-3" />, text: "Montando carrinho" },
                    { icon: <Tag className="size-3" />, text: "Desconto 10% aplicado" },
                    { icon: <Truck className="size-3" />, text: "Frete grátis ativado" }
                ],
                duration: 1500
            },
            { type: "event", text: "🛒 Carrinho: Vestido + Clutch = R$ 295,11", eventIcon: <ShoppingBag className="size-3" />, eventColor: "bg-rose-50 border-rose-200 text-rose-700" },
            { type: "ai", text: "Montei seu carrinho! 🛍️ Vestido R$229 + Clutch R$89,90 = R$295,11 com desconto." },
            { type: "ai", text: "Frete grátis! Quer pagar por Pix (mais 5% off) ou cartão?" },
            // --- Turn 6: User asks about shipping ---
            { type: "typing_user", duration: 1800 },
            { type: "user", text: "Pix! E chega em quanto tempo? Moro em SP", delay: 0, sentiment: "curiosity" },
            // --- Turn 7: AI calculates ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <MapPin className="size-3" />, text: "CEP: São Paulo/SP" },
                    { icon: <Truck className="size-3" />, text: "Sedex: 2 dias úteis" },
                    { icon: <Tag className="size-3" />, text: "Desconto Pix: -5%" }
                ],
                duration: 1200
            },
            { type: "ai", text: "SP capital chega em 2 dias úteis por Sedex!" },
            { type: "ai", text: "Com Pix fica R$280,35. Vou gerar o código? 💸" },
            // --- Turn 8: User confirms ---
            { type: "typing_user", duration: 800 },
            { type: "user", text: "Gera o Pix!", delay: 0, sentiment: "positive" },
            { type: "event", text: "⬆️ Lead Score: 60 → 92", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            // --- Turn 9: AI generates payment ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Tag className="size-3" />, text: "Gerando QR Code Pix" },
                    { icon: <CheckCheck className="size-3" />, text: "Pedido #4521 criado" },
                    { icon: <Clock className="size-3" />, text: "Validade: 30 minutos" }
                ],
                duration: 2000
            },
            { type: "event", text: "💰 Venda fechada: Pedido #4521 — R$ 280,35", eventIcon: <CheckCheck className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "ai", text: "Pix gerado! ✅ R$280,35 — validade 30 min." },
            { type: "ai", text: "Assim que confirmar, envio o rastreio. Obrigada pela compra! 💕" },
            { type: "event", text: "✅ CRM: close_sale executado", eventIcon: <CheckCheck className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
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
        steps: [
            // --- Turn 1: AI triages urgency ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Scale className="size-3" />, text: "Classificando: Direito Trabalhista" },
                    { icon: <AlertTriangle className="size-3" />, text: "Prioridade: Alta/Urgente" },
                    { icon: <Calendar className="size-3" />, text: "Checando plantão jurídico" }
                ],
                duration: 2200
            },
            { type: "event", text: "⚠️ Urgência detectada: prioridade alta", eventIcon: <AlertTriangle className="size-3" />, eventColor: "bg-red-50 border-red-200 text-red-700" },
            { type: "ai", text: "Bom dia! 👋 Entendo que é urgente." },
            { type: "ai", text: "Pode me contar brevemente o que aconteceu? Assim direciono para o especialista certo." },
            // --- Turn 2: User shares case ---
            { type: "typing_user", duration: 2500 },
            { type: "user", text: "Fui demitida sem justa causa e não recebi as verbas rescisórias. Faz 45 dias.", delay: 0, sentiment: "negative" },
            { type: "event", text: "📛 Nome extraído: 'Fernanda'", eventIcon: <UserCheck className="size-3" />, eventColor: "bg-blue-50 border-blue-200 text-blue-700" },
            { type: "event", text: "📊 Sentimento: Negativo — frustração detectada", eventIcon: <Sparkles className="size-3" />, eventColor: "bg-red-50 border-red-200 text-red-700" },
            // --- Turn 3: AI classifies + empathizes ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <FileText className="size-3" />, text: "Tema: Verbas Rescisórias" },
                    { icon: <Scale className="size-3" />, text: "Art. 477 CLT: prazo de 10 dias" },
                    { icon: <UserCheck className="size-3" />, text: "Selecionando especialista" }
                ],
                duration: 2000
            },
            { type: "event", text: "⚖️ Classificação: Verbas Rescisórias (Art. 477 CLT)", eventIcon: <Scale className="size-3" />, eventColor: "bg-purple-50 border-purple-200 text-purple-700" },
            { type: "ai", text: "Fernanda, a empresa tinha 10 dias úteis para pagar. Já passou esse prazo, então cabe multa." },
            { type: "ai", text: "A Dra. Patrícia é nossa especialista em Trabalhista. Posso agendar uma consulta?" },
            // --- Turn 4: User wants to know more ---
            { type: "typing_user", duration: 1500 },
            { type: "user", text: "Tem custo a consulta?", delay: 0, sentiment: "curiosity" },
            { type: "event", text: "📊 Sentimento: Negativo → Neutro", eventIcon: <Sparkles className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            // --- Turn 5: AI explains pricing ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Tag className="size-3" />, text: "Política: 1ª consulta cortesia" },
                    { icon: <Calendar className="size-3" />, text: "Próxima agenda: quinta 15h" },
                    { icon: <CheckCheck className="size-3" />, text: "Disponibilidade confirmada" }
                ],
                duration: 1500
            },
            { type: "ai", text: "A primeira consulta é gratuita! ✅" },
            { type: "ai", text: "A Dra. Patrícia tem horário quinta às 15h. Confirmo?" },
            // --- Turn 6: User confirms ---
            { type: "typing_user", duration: 800 },
            { type: "user", text: "Confirma! O que preciso levar?", delay: 0, sentiment: "positive" },
            { type: "event", text: "📅 Consulta agendada: Quinta 15h", eventIcon: <Calendar className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "event", text: "⬆️ Lead Score: 40 → 72", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            // --- Turn 7: AI provides checklist ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <FileText className="size-3" />, text: "Checklist documental gerado" },
                    { icon: <MapPin className="size-3" />, text: "Preparando localização" },
                    { icon: <Scale className="size-3" />, text: "Analisando direitos devidos" }
                ],
                duration: 1800
            },
            { type: "ai", text: "Traga esses documentos: 📋" },
            { type: "ai", text: "• CTPS (física ou digital)\n• Últimos 3 holerites\n• Termo de rescisão (se recebeu)\n• Extrato FGTS" },
            // --- Turn 8: User asks about rights ---
            { type: "typing_user", duration: 2000 },
            { type: "user", text: "O que tenho direito a receber nesse caso?", delay: 0, sentiment: "curiosity" },
            // --- Turn 9: AI explains rights ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Scale className="size-3" />, text: "Calculando: sem justa causa" },
                    { icon: <FileText className="size-3" />, text: "Saldo, aviso, férias, 13º, FGTS+40%" },
                    { icon: <AlertTriangle className="size-3" />, text: "Multa Art.477: 1 salário" }
                ],
                duration: 2200
            },
            { type: "ai", text: "Na demissão sem justa causa, você tem direito a:" },
            { type: "ai", text: "• Saldo de salário\n• Aviso prévio (30d + 3d/ano)\n• 13º proporcional\n• Férias + 1/3\n• Multa 40% FGTS\n• Multa Art. 477 (1 salário)" },
            // --- Turn 10: User wants handoff ---
            { type: "typing_user", duration: 1200 },
            { type: "user", text: "Obrigada! Quero falar com a Dra. Patrícia antes da consulta, é possível?", delay: 0, sentiment: "positive" },
            { type: "event", text: "📊 Sentimento: Neutro → Positivo", eventIcon: <Sparkles className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            // --- Turn 11: AI initiates handoff ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <UserCheck className="size-3" />, text: "Transferindo para Dra. Patrícia" },
                    { icon: <FileText className="size-3" />, text: "Gerando resumo do caso" },
                    { icon: <CheckCheck className="size-3" />, text: "Handoff com contexto completo" }
                ],
                duration: 1800
            },
            { type: "event", text: "🤝 Transferido para Dra. Patrícia (Trabalhista)", eventIcon: <UserCheck className="size-3" />, eventColor: "bg-indigo-50 border-indigo-200 text-indigo-700" },
            { type: "ai", text: "Vou transferir agora! A Dra. Patrícia vai receber o histórico completo da conversa." },
            { type: "ai", text: "Obrigada pela confiança, Fernanda. Tudo vai dar certo! 💜" },
            { type: "event", text: "✅ Qualificação completa: 4/4 slots", eventIcon: <CheckCheck className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
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
        steps: [
            // --- Turn 1: AI profiles student ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Search className="size-3" />, text: "Contexto: Curso Programação" },
                    { icon: <User className="size-3" />, text: "Perfil: Iniciante potencial" },
                    { icon: <Tag className="size-3" />, text: "Calculando oferta dinâmica" }
                ],
                duration: 1800
            },
            { type: "ai", text: "Oi Lucas! 🚀 Nosso curso tem 3 trilhas para diferentes níveis." },
            { type: "ai", text: "Você já programou antes ou está começando do zero?" },
            // --- Turn 2: User describes goal ---
            { type: "typing_user", duration: 1800 },
            { type: "user", text: "Começando do zero! Quero mudar de carreira pra tech", delay: 0, sentiment: "curiosity" },
            { type: "event", text: "📛 Nome extraído: 'Lucas'", eventIcon: <UserCheck className="size-3" />, eventColor: "bg-blue-50 border-blue-200 text-blue-700" },
            { type: "event", text: "🎯 Perfil: transição de carreira, iniciante", eventIcon: <Target className="size-3" />, eventColor: "bg-purple-50 border-purple-200 text-purple-700" },
            // --- Turn 3: AI matches trilha ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Target className="size-3" />, text: "Match: Trilha Full-Stack Jr" },
                    { icon: <Tag className="size-3" />, text: "Verificando bolsa disponível" },
                    { icon: <GraduationCap className="size-3" />, text: "Preparando plano de estudo" }
                ],
                duration: 1500
            },
            { type: "ai", text: "A trilha ideal para você é a Full-Stack Jr — 6 meses, do zero ao deploy! 💻" },
            { type: "ai", text: "Preço normal R$497/mês. Mas temos bolsa de 40% para transição de carreira!" },
            // --- Turn 4: User asks about scholarship ---
            { type: "typing_user", duration: 1500 },
            { type: "user", text: "Bolsa de 40%?? Sério? Como funciona?", delay: 0, sentiment: "positive" },
            { type: "event", text: "📊 Sentimento: Neutro → Positivo", eventIcon: <Sparkles className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            // --- Turn 5: AI explains scholarship ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Tag className="size-3" />, text: "Bolsa aplicada: R$297/mês" },
                    { icon: <CheckCheck className="size-3" />, text: "Condições: assiduidade 80%" },
                    { icon: <Video className="size-3" />, text: "Aula experimental disponível" }
                ],
                duration: 1500
            },
            { type: "event", text: "🎓 Bolsa aprovada: 40% → R$ 297/mês", eventIcon: <GraduationCap className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "ai", text: "Funciona assim: R$297/mês com bolsa, e a única condição é manter 80% de presença." },
            { type: "ai", text: "Inclui certificado reconhecido pelo MEC! 🎓 Quer assistir uma aula experimental grátis?" },
            // --- Turn 6: User wants free class ---
            { type: "typing_user", duration: 1000 },
            { type: "user", text: "Quero sim! E tem certificado mesmo?", delay: 0, sentiment: "positive" },
            { type: "event", text: "⬆️ Lead Score: 35 → 60", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            // --- Turn 7: AI confirms + activates trial ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <GraduationCap className="size-3" />, text: "Certificado MEC: confirmado" },
                    { icon: <Video className="size-3" />, text: "Liberando acesso experimental" },
                    { icon: <Clock className="size-3" />, text: "Aula ao vivo: hoje 20h" }
                ],
                duration: 1800
            },
            { type: "event", text: "🎬 Trial ativado: aula experimental liberada", eventIcon: <Play className="size-3" />, eventColor: "bg-blue-50 border-blue-200 text-blue-700" },
            { type: "ai", text: "Sim, certificado reconhecido pelo MEC e válido em todo Brasil! ✅" },
            { type: "ai", text: "Liberei uma aula ao vivo hoje às 20h: 'Seu primeiro site em 1 hora'. Posso te enviar o link?" },
            // --- Turn 8: User confirms ---
            { type: "typing_user", duration: 800 },
            { type: "user", text: "Manda! Tô animado!", delay: 0, sentiment: "positive" },
            // --- Turn 9: AI sends link + upsell ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <CheckCheck className="size-3" />, text: "Link da aula gerado" },
                    { icon: <Target className="size-3" />, text: "Score: 60 → 82" },
                    { icon: <Calendar className="size-3" />, text: "Matrícula: vaga reservada 48h" }
                ],
                duration: 1500
            },
            { type: "event", text: "⬆️ Lead Score: 60 → 82", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "ai", text: "Link enviado! 📩 A aula começa às 20h, entra 5 min antes." },
            { type: "ai", text: "E reservei uma vaga com bolsa por 48h para você. Depois o preço volta ao normal. 🔥" },
            // --- Turn 10: User asks about payment ---
            { type: "typing_user", duration: 1500 },
            { type: "user", text: "Se eu gostar da aula, como faço a matrícula?", delay: 0, sentiment: "curiosity" },
            // --- Turn 11: AI explains enrollment ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <FileText className="size-3" />, text: "Processo de matrícula" },
                    { icon: <Tag className="size-3" />, text: "Opções: Pix, boleto, cartão" },
                    { icon: <CheckCheck className="size-3" />, text: "Garantia de 7 dias" }
                ],
                duration: 1200
            },
            { type: "ai", text: "Super simples! Depois da aula, envio o link de matrícula aqui mesmo." },
            { type: "ai", text: "Aceita Pix, boleto ou cartão em até 12x. E tem garantia de 7 dias — sem risco! ✨" },
            { type: "event", text: "✅ Qualificação completa: 4/4 slots", eventIcon: <CheckCheck className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
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
        steps: [
            // --- Turn 1: AI detects developer ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Code className="size-3" />, text: "Detectado: Developer Persona" },
                    { icon: <Webhook className="size-3" />, text: "Intent: Integração API" },
                    { icon: <FileText className="size-3" />, text: "Separando docs técnicas" }
                ],
                duration: 2000
            },
            { type: "event", text: "🧑‍💻 Persona: Developer", eventIcon: <Code className="size-3" />, eventColor: "bg-cyan-50 border-cyan-200 text-cyan-700" },
            { type: "ai", text: "Oi Pedro! Sim, temos API REST completa com webhooks e SDK." },
            { type: "ai", text: "Qual stack vocês usam? Assim envio o SDK certo. 🔧" },
            // --- Turn 2: User shares stack ---
            { type: "typing_user", duration: 2000 },
            { type: "user", text: "Node.js com TypeScript. Preciso de webhook pra cada msg recebida", delay: 0, sentiment: "neutral" },
            { type: "event", text: "📛 Nome extraído: 'Pedro'", eventIcon: <UserCheck className="size-3" />, eventColor: "bg-blue-50 border-blue-200 text-blue-700" },
            { type: "event", text: "🎯 Stack: Node.js + TypeScript", eventIcon: <Code className="size-3" />, eventColor: "bg-purple-50 border-purple-200 text-purple-700" },
            // --- Turn 3: AI sends SDK ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Laptop className="size-3" />, text: "Match SDK: @axis/node" },
                    { icon: <Webhook className="size-3" />, text: "Config: message.received" },
                    { icon: <Key className="size-3" />, text: "Gerando API Key Sandbox" }
                ],
                duration: 1800
            },
            { type: "event", text: "🔑 API Key Sandbox gerada", eventIcon: <Key className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            { type: "ai", text: "Perfeito! Enviei o link do SDK @axis/node com TypeScript types." },
            { type: "ai", text: "O webhook `message.received` dispara em tempo real. Criei uma API Key sandbox pra você! 🔑" },
            // --- Turn 4: User asks about sending ---
            { type: "typing_user", duration: 1600 },
            { type: "user", text: "Top! E pra enviar msgs pro cliente via API?", delay: 0, sentiment: "curiosity" },
            // --- Turn 5: AI explains endpoint ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Code className="size-3" />, text: "Endpoint: POST /messages" },
                    { icon: <Webhook className="size-3" />, text: "Rate limit: 80 msg/s" },
                    { icon: <FileText className="size-3" />, text: "Docs: api.axis.ai" }
                ],
                duration: 1200
            },
            { type: "ai", text: "POST /api/v1/messages com body { to, text }. Rate limit: 80 msg/s." },
            { type: "ai", text: "Documentação completa: docs.axis.ai 📖" },
            // --- Turn 6: User asks about pricing ---
            { type: "typing_user", duration: 1800 },
            { type: "user", text: "Qual o modelo de pricing? Temos ~50k msgs/mês", delay: 0, sentiment: "curiosity" },
            { type: "event", text: "🎯 Volume: 50k msgs/mês", eventIcon: <Target className="size-3" />, eventColor: "bg-purple-50 border-purple-200 text-purple-700" },
            // --- Turn 7: AI explains pricing ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Tag className="size-3" />, text: "Calculando: plano Scale" },
                    { icon: <Target className="size-3" />, text: "50k msgs = R$490/mês" },
                    { icon: <CheckCheck className="size-3" />, text: "Trial 14 dias disponível" }
                ],
                duration: 1500
            },
            { type: "event", text: "⬆️ Lead Score: 45 → 72", eventIcon: <Target className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "ai", text: "Pra 50k msgs, o plano Scale é o ideal: R$490/mês com tudo incluso." },
            { type: "ai", text: "Primeiro mês é trial grátis + onboarding técnico com nosso time. 🚀" },
            // --- Turn 8: User interested ---
            { type: "typing_user", duration: 1200 },
            { type: "user", text: "Fechou! Como ativo o trial?", delay: 0, sentiment: "positive" },
            { type: "event", text: "📊 Sentimento: Neutro → Positivo", eventIcon: <Sparkles className="size-3" />, eventColor: "bg-amber-50 border-amber-200 text-amber-700" },
            // --- Turn 9: AI activates + schedules onboarding ---
            {
                type: "thinking",
                thinkingSteps: [
                    { icon: <Key className="size-3" />, text: "Ativando trial 14 dias" },
                    { icon: <Calendar className="size-3" />, text: "Agendando onboarding técnico" },
                    { icon: <Webhook className="size-3" />, text: "Habilitando ambiente prod" }
                ],
                duration: 2000
            },
            { type: "event", text: "🎬 Trial ativado: 14 dias (plano Scale)", eventIcon: <Play className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "event", text: "📅 Onboarding: Quarta 15h", eventIcon: <Calendar className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
            { type: "ai", text: "Trial ativado! ✅ Você já pode usar a API em produção por 14 dias." },
            { type: "ai", text: "Agendei um onboarding técnico com nosso dev Sr. quarta às 15h. Vai ser via Google Meet." },
            // --- Turn 10: User confirms ---
            { type: "typing_user", duration: 1200 },
            { type: "user", text: "Top demais! Já vou integrar o sandbox hoje. Valeu!", delay: 0, sentiment: "positive" },
            // --- Turn 11: AI closes ---
            { type: "ai", text: "Qualquer dúvida técnica, manda aqui mesmo que respondo rápido. Bom código! 🤓" },
            { type: "event", text: "✅ Qualificação completa: 4/4 slots", eventIcon: <CheckCheck className="size-3" />, eventColor: "bg-green-50 border-green-200 text-green-700" },
        ],
    },
];
*/
