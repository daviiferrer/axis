# ÁXIS - Plataforma de IA Conversacional Multi-Tenant para WhatsApp

> **Versão:** 3.0.0 | **Stack:** Node.js + Next.js + Gemini + Supabase  
> **Arquitetura:** Monólito Modular + Custom Workflow Engine + LangGraph Agents

---

## 📖 **O QUE É O ÁXIS?**

**ÁXIS** é uma plataforma completa de **automação conversacional inteligente** via WhatsApp, projetada para empresas que precisam escalar seu processo de vendas, suporte e onboarding sem perder a personalização humana.

### **Para Quem É:**
- 🏢 **Empresas B2B/B2C** que precisam qualificar leads 24/7
- 📞 **Times de Sales/SDR** que querem multiplicar alcance sem contratar
- 🤖 **Equipes de Produto** que querem automatizar onboarding/suporte
- 🎯 **Agências** que gerenciam múltiplos clientes (multi-tenant nativo)

### **Casos de Uso Reais:**
1. **Qualificação de Leads (BANT)** - Agente coleta Budget, Authority, Need, Timeline antes de escalar para humano
2. **Suporte Técnico L1** - Resolve 80% das dúvidas comuns via RAG (Knowledge Base)
3. **Onboarding Automatizado** - Guia novos clientes passo-a-passo com checklist interativo
4. **Reativação de Leads Frios** - Nurturing inteligente com timing otimizado

---

## 🎯 **DIFERENCIAL TÉCNICO**

### **Arquitetura Única: Workflow Engine + AI Agents**

Diferente de chatbots simples, o ÁXIS combina:

```
┌─────────────────────────────────────────────┐
│  CUSTOM WORKFLOW ENGINE (Graph-Based)      │
│  • Estratégias como Grafos Direcionados    │
│  • 13 tipos de nós (Agent, Logic, Delay...) │
│  • Transições baseadas em estado do lead   │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  LANGGRAPH AI AGENTS (Cognitive Layer)     │
│  • Raciocínio de estado (não apenas prompt)│
│  • Memória de longo prazo (Supabase)       │
│  • Adaptação emocional (Modelo PAD)        │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  GEMINI 2.5 FLASH (1M tokens context)      │
│  • Context Caching (90% economia)          │
│  • RAG via pgvector (Supabase)             │
│  • Prompt Engineering (6-layer Sandwich)   │
└─────────────────────────────────────────────┘
```

**Não usamos N8N/Make/Zapier** - temos um workflow engine proprietário otimizado para conversações.

---

## 📦 **STACK TÉCNICA COMPLETA**

### **Backend (Node.js Monolith)**

```javascript
// Core Technologies
{
  "runtime": "Node.js 20.x",
  "framework": "Express 4.19",
  "language": "JavaScript ES6+",
  
  // AI & LLM
  "ai": {
    "primary": "Google Generative AI (Gemini) 0.24.1",
    "orchestration": "LangGraph 1.0.7",
    "chains": "LangChain Core 1.1.8",
    "observability": "Langfuse 3.38.6"
  },
  
  // Database & Auth
  "database": {
    "postgres": "Supabase 2.89",
    "vector": "pgvector (embeddings)",
    "auth": "Supabase Auth (JWT)"
  },
  
  // Queue & Cache
  "async": {
    "queues": "BullMQ 5.66",
    "redis": "ioredis 5.8",
    "cache": "node-cache 5.1"
  },
  
  // WhatsApp
  "messaging": {
    "api": "WAHA Plus (Docker)",
    "engine": "NOWEB (no-browser)"
  },
  
  // Data Ingestion
  "scraping": {
    "provider": "Apify Cloud",
    "normalizer": "libphonenumber-js"
  },
  
  // Observability
  "logging": "Pino 10.1 (structured JSON)",
  "tracing": "Custom trace context",
  "monitoring": "Health checks + metrics"
}
```

#### **Dependências Key:**
```json
{
  "@google/generative-ai": "^0.24.1",
  "@langchain/langgraph": "^1.0.7",
  "@supabase/supabase-js": "^2.89.0",
  "bullmq": "^5.66.4",
  "ioredis": "^5.8.2",
  "langfuse": "^3.38.6",
  "express": "^4.19.2",
  "pino": "^10.1.0",
  "apify-client": "^2.21.0",
  "libphonenumber-js": "^1.12.33",
  "stripe": "^20.1.0"
}
```

---

### **Frontend (Next.js 16)**

```javascript
{
  "framework": "Next.js 16.1 (App Router)",
  "runtime": "React 19.2",
  "language": "TypeScript 5.x",
  
  // Styling
  "css": "Tailwind CSS 4.x",
  "components": "shadcn/ui (Radix UI)",
  "icons": "Lucide React + Heroicons",
  
  // Motion & Animations
  "motion": "Framer Motion 12.25",
  
  // Data Fetching
  "state": "SWR 2.3",
  "http": "Axios 1.13",
  
  // Forms & Validation
  "forms": "React Hook Form 7.70",
  "validation": "Zod 4.3",
  
  // Charts & Visualization
  "charts": "Recharts 2.15",
  "flow": "XYFlow (React Flow) 12.10"
}
```

#### **Dependências Key:**
```json
{
  "next": "16.1.1",
  "react": "19.2.3",
  "typescript": "^5",
  "tailwindcss": "^4",
  "framer-motion": "^12.25.0",
  "@radix-ui/react-*": "latest",
  "@supabase/supabase-js": "^2.90.1",
  "@xyflow/react": "^12.10.0",
  "recharts": "^2.15.4",
  "zod": "^4.3.5"
}
```

---

## 🗂️ **ESTRUTURA DO PROJETO**

```
ÁXIS/
├── backend/                    # Node.js Backend (231 arquivos)
│   ├── src/
│   │   ├── server.js          # Bootstrap (DI Manual)
│   │   ├── core/              # Lógica de Negócio
│   │   │   ├── services/      # 40+ Services
│   │   │   │   ├── ai/
│   │   │   │   │   ├── PromptService.js        # Prompt Engineering (Sandwich Pattern)
│   │   │   │   │   ├── EmotionalStateService.js # Modelo PAD
│   │   │   │   │   ├── ModelService.js         # Multi-provider (Gemini/OpenAI)
│   │   │   │   │   └── GuardrailService.js     # Validação de respostas
│   │   │   │   ├── agents/
│   │   │   │   │   └── AgentService.js         # CRUD + DNA Config
│   │   │   │   ├── automation/
│   │   │   │   │   ├── TriggerService.js       # "Sniper" (Presence-based)
│   │   │   │   │   └── PresenceService.js      # Online/Typing tracking
│   │   │   │   ├── campaign/
│   │   │   │   │   ├── CampaignService.js
│   │   │   │   │   ├── LeadService.js          # CRM interno + Lead Scoring
│   │   │   │   │   └── CampaignTemplateService.js
│   │   │   │   ├── chat/
│   │   │   │   │   ├── ChatService.js          # Gestão de conversas
│   │   │   │   │   └── HistoryService.js       # Contexto histórico
│   │   │   │   ├── marketing/
│   │   │   │   │   └── AdsReportingService.js  # Meta CAPI (Conversions API)
│   │   │   │   ├── content/
│   │   │   │   │   └── SpintaxService.js       # Anti-spam (variação de mensagens)
│   │   │   │   ├── extraction/
│   │   │   │   │   ├── LeadTransformerService.js
│   │   │   │   │   ├── ScraperOrchestrator.js
│   │   │   │   │   └── providers/ApifyProvider.js
│   │   │   │   ├── waha/
│   │   │   │   │   └── JidNormalizationService.js # Resolve 9º dígito BR
│   │   │   │   ├── billing/
│   │   │   │   │   └── BillingService.js       # Planos + Créditos
│   │   │   │   ├── queue/
│   │   │   │   │   └── QueueService.js         # BullMQ abstraction
│   │   │   │   └── system/
│   │   │   │       ├── SettingsService.js      # Feature flags
│   │   │   │       ├── CacheService.js
│   │   │   │       └── HealthService.js
│   │   │   ├── engines/
│   │   │   │   ├── workflow/
│   │   │   │   │   ├── WorkflowEngine.js       # 🧠 Grafo executor (31KB)
│   │   │   │   │   ├── NodeFactory.js          # Factory pattern
│   │   │   │   │   └── nodes/                  # 13 tipos de nós
│   │   │   │   │       ├── AgentNode.js        # IA + Human Physics
│   │   │   │   │       ├── AgenticNode.js      # Autônomo (decisões)
│   │   │   │   │       ├── BroadcastNode.js    # Massa + Rate limit
│   │   │   │   │       ├── ClosingNode.js      # CTA obrigatório
│   │   │   │   │       ├── DelayNode.js        # Delays inteligentes
│   │   │   │   │       ├── HandoffNode.js      # → Humano
│   │   │   │   │       ├── LogicNode.js        # If/else
│   │   │   │   │       ├── GotoNode.js         # Jump to node
│   │   │   │   │       ├── SplitNode.js        # A/B testing
│   │   │   │   │       └── sdr/
│   │   │   │   │           ├── QualificationNode.js  # BANT
│   │   │   │   │           ├── OutreachNode.js       # Cold contact
│   │   │   │   │           └── ObjectionNode.js      # Objeções
│   │   │   │   └── langgraph/
│   │   │   │       └── AgentGraphEngine.js     # LangGraph state machine
│   │   │   └── config/
│   │   │       ├── AgentDNA.js                 # 🧬 DNA Enums (Big5, PAD, Chronemics)
│   │   │       └── AgentRolePrompts.js         # Blueprints (SDR, Support...)
│   │   ├── api/                                # Interface HTTP
│   │   │   ├── controllers/
│   │   │   │   ├── chat/
│   │   │   │   │   ├── WebhookController.js    # 🎯 Entry point (WAHA webhooks)
│   │   │   │   │   ├── ChatController.js
│   │   │   │   │   └── OracleController.js     # IA on-demand
│   │   │   │   ├── campaign/
│   │   │   │   │   ├── CampaignController.js
│   │   │   │   │   ├── LeadController.js
│   │   │   │   │   └── ProspectController.js
│   │   │   │   ├── agents/
│   │   │   │   │   └── AgentController.js
│   │   │   │   ├── waha/                       # 8 controllers WAHA
│   │   │   │   │   ├── WahaSessionController.js
│   │   │   │   │   ├── WahaAuthController.js
│   │   │   │   │   ├── WahaProfileController.js
│   │   │   │   │   ├── WahaChattingController.js
│   │   │   │   │   ├── WahaPresenceController.js
│   │   │   │   │   ├── WahaMediaController.js
│   │   │   │   │   ├── WahaObservabilityController.js
│   │   │   │   │   └── WahaScreenshotController.js
│   │   │   │   ├── apify/
│   │   │   │   │   ├── ApifyController.js
│   │   │   │   │   └── ApifyWebhookHandler.js  # Lead ingestion
│   │   │   │   ├── analytics/
│   │   │   │   │   └── AnalyticsController.js
│   │   │   │   ├── billing/
│   │   │   │   │   └── BillingController.js
│   │   │   │   └── system/
│   │   │   │       ├── HealthController.js     # /health endpoint
│   │   │   │       ├── SettingsController.js
│   │   │   │       └── AdminController.js
│   │   │   ├── middlewares/
│   │   │   │   ├── authMiddleware.js           # Supabase JWT
│   │   │   │   ├── rbacMiddleware.js           # Permissões
│   │   │   │   ├── riskMiddleware.js           # Rate limiting
│   │   │   │   └── traceMiddleware.js          # Observability context
│   │   │   └── routes/
│   │   │       └── index.js                    # Route registration
│   │   ├── infra/                              # Adaptadores
│   │   │   ├── clients/
│   │   │   │   ├── WahaClient.js               # WhatsApp HTTP API
│   │   │   │   ├── GeminiClient.js             # Google AI
│   │   │   │   ├── RagClient.js                # Vector search
│   │   │   │   ├── LangfuseClient.js           # Observability
│   │   │   │   ├── InngestClient.js
│   │   │   │   └── RedisLockClient.js          # Distributed locks
│   │   │   └── database/
│   │   │       └── SupabaseClientFactory.js
│   │   ├── database/
│   │   │   └── migrations/                     # SQL migrations
│   │   │       ├── 001_initial_schema.sql
│   │   │       ├── 002_add_hybrid_search_support.sql  # pgvector RAG
│   │   │       ├── 003_add_waha_session_to_campaign.sql
│   │   │       ├── 004_create_usage_events.sql
│   │   │       └── 005_add_invoice_message_tracking.sql
│   │   ├── shared/
│   │   │   ├── Logger.js                       # Pino logger
│   │   │   ├── TraceContext.js                 # Trace propagation
│   │   │   └── SocketService.js                # Socket.io
│   │   ├── workers/
│   │   │   └── ScrapeWorker.js                 # Background scraping
│   │   ├── scripts/                            # Utility scripts
│   │   └── tests/
│   │       └── test-security-enhancements.js
│   ├── package.json
│   └── .env
│
├── frontend/                   # Next.js Frontend (180 arquivos)
│   ├── src/
│   │   ├── app/                                # App Router
│   │   │   ├── page.tsx                        # 🏠 Landing page
│   │   │   ├── layout.tsx                      # Root layout
│   │   │   ├── globals.css                     # Tailwind base
│   │   │   ├── auth/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── app/                            # Dashboard protegido
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx                    # Overview
│   │   │   │   ├── campaigns/
│   │   │   │   │   ├── page.tsx                # Lista campanhas
│   │   │   │   │   └── [id]/flow/page.tsx      # Flow builder (XYFlow)
│   │   │   │   ├── agents/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx           # Agent editor
│   │   │   │   ├── chats/page.tsx
│   │   │   │   ├── billing/page.tsx
│   │   │   │   └── admin/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── settings/page.tsx
│   │   │   │       └── users/page.tsx
│   │   │   └── legal/
│   │   │       ├── terms/page.tsx
│   │   │       └── privacy/page.tsx
│   │   ├── components/
│   │   │   ├── landing/                        # Landing page components
│   │   │   │   ├── sections/
│   │   │   │   │   ├── hero/
│   │   │   │   │   │   ├── hero-section.tsx    # Hero principal
│   │   │   │   │   │   ├── hero-text.tsx       # Texto animado
│   │   │   │   │   │   └── whatsapp-demo.tsx   # Demo chat interativo
│   │   │   │   │   ├── social-section.tsx
│   │   │   │   │   ├── problems-section.tsx    # Cards de dores
│   │   │   │   │   ├── testimonial-section.tsx
│   │   │   │   │   └── FAQ-section.tsx
│   │   │   │   └── header.tsx                  # Header responsivo
│   │   │   ├── motion/                         # Framer Motion components
│   │   │   │   ├── expandable-cards.tsx
│   │   │   │   ├── animated-tabs.tsx
│   │   │   │   └── reorder-list.tsx
│   │   │   └── ui/                             # shadcn/ui (50+ components)
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── dropdown-menu.tsx
│   │   │       ├── select.tsx
│   │   │       ├── table.tsx
│   │   │       ├── toast.tsx
│   │   │       └── ... (40+ more)
│   │   ├── context/
│   │   │   ├── AuthContext.tsx                 # Supabase Auth
│   │   │   └── SocketContext.tsx               # Real-time chat
│   │   ├── hooks/
│   │   │   └── use-mobile.ts                   # Responsive hook
│   │   ├── services/                           # API clients
│   │   │   ├── api.ts                          # Axios base
│   │   │   ├── agentService.ts
│   │   │   ├── campaign.ts
│   │   │   ├── waha.ts
│   │   │   ├── schedulingApi.ts
│   │   │   ├── socket.ts
│   │   │   ├── admin.ts
│   │   │   └── dev.ts
│   │   └── lib/
│   │       ├── utils.ts                        # Tailwind merge (cn)
│   │       └── supabase/
│   │           └── client.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── next.config.js
│
├── mobile/                     # React Native App (34 arquivos)
│   └── (estrutura básica)
│
├── docker/
│   └── docker-compose.yml      # Redis + WAHA Plus
│
├── .env                        # Env vars root
├── package.json                # Monorepo scripts
└── README.md                   # Este arquivo
```

---

## 🧬 **ARQUITETURA: DNA DO AGENTE**

### **Conceito de DNA (Immutable Identity)**

O ÁXIS implementa o conceito de **Agent DNA**, inspirado em papers recentes de 2025-2026:

```javascript
// AgentDNA.js - Canonical Enums
const AgentDNA = {
  // Psychometrics (Big Five)
  Big5: {
    Openness: { LOW, MEDIUM, HIGH },
    Conscientiousness: { LOW, MEDIUM, HIGH },
    Extraversion: { LOW, MEDIUM, HIGH },
    Agreeableness: { LOW, MEDIUM, HIGH },
    Neuroticism: { LOW, MEDIUM, HIGH }
  },
  
  // Emotional State (PAD Model)
  PAD: {
    Pleasure: { NEGATIVE, NEUTRAL, POSITIVE },
    Arousal: { LOW, MEDIUM, HIGH },
    Dominance: { SUBMISSIVE, NEUTRAL, DOMINANT }
  },
  
  // Linguistics
  Linguistics: {
    ReductionProfile: { FORMAL, NATIVE, CASUAL, SLANG },
    Formality: { VERY_FORMAL, FORMAL, NEUTRAL, CASUAL },
    UseEmoji: { NEVER, RARE, MODERATE, FREQUENT }
  },
  
  // Chronemics (Timing)
  Chronemics: {
    LatencyProfile: { INSTANT, FAST, MEDIUM, SLOW },
    BurstinessProfile: { STEADY, MODERATE, BURSTY }
  },
  
  // Identity
  Identity: {
    Role: {
      SDR: 'Sales Development Representative',
      SUPPORT: 'Customer Support Specialist',
      CONCIERGE: 'Concierge',
      CONSULTANT: 'Consultant'
    }
  }
};
```

**Physics Simulation:**
```javascript
// Human-like typing behavior
const physics = {
  typing: {
    wpm: 65,              // Words per minute
    typo_rate: 0.02,      // 2% de erros
    correction_delay: 500 // ms para corrigir
  },
  burstiness: {
    min_sentences: 1,
    max_sentences: 3,
    think_time: 2000      // ms entre bursts
  }
};
```

---

## 🔄 **WORKFLOW ENGINE: GRAFOS DIRECIONADOS**

### **Estratégia como Código**

Diferente de ferramentas no-code limitadas, o ÁXIS armazena estratégias como **grafos JSON** executáveis:

```json
{
  "campaign": {
    "strategy_graph": {
      "nodes": [
        {
          "id": "start",
          "type": "OutreachNode",
          "data": {
            "objective": "Apresentar solução e gerar curiosidade",
            "ctas": ["SCHEDULE_CALL"]
          }
        },
        {
          "id": "qualify",
          "type": "QualificationNode",
          "data": {
            "critical_slots": ["BUDGET", "AUTHORITY", "NEED", "TIMELINE"],
            "min_score": 70
          }
        },
        {
          "id": "close",
          "type": "ClosingNode",
          "data": {
            "required_cta": "SEND_PROPOSAL"
          }
        }
      ],
      "edges": [
        { "source": "start", "target": "qualify", "condition": "replied" },
        { "source": "qualify", "target": "close", "condition": "qualified" }
      ]
    }
  }
}
```

### **Execução (WorkflowEngine.js)**

```javascript
// 1. Busca o grafo da campanha
const graph = campaign.strategy_graph;

// 2. Identifica nó atual do lead
const currentNode = graph.nodes.find(n => n.id === lead.current_node_id);

// 3. Executa o nó (via NodeFactory)
const executor = NodeFactory.create(currentNode.type);
const result = await executor.execute(lead, campaign, currentNode.data);

// 4. Avalia a próxima aresta
const nextEdge = graph.edges.find(e => 
  e.source === currentNode.id && 
  e.condition === result.transitionCondition
);

// 5. Transiciona o lead
if (nextEdge) {
  await leadService.transitionToNode(lead.id, nextEdge.target);
}
```

---

## 🤖 **INTELIGÊNCIA ARTIFICIAL: LANGGRAPH + GEMINI**

### **Prompt Engineering (Sandwich Pattern - 6 Layers)**

```javascript
// PromptService.js
async buildStitchedPrompt(data) {
  const { agent, campaign, lead, nodeConfig, chatHistory } = data;
  
  return [
    // Layer 1: Security (Canary Token Injection)
    this.#buildSecurityLayer(canaryToken),
    
    // Layer 2: DNA (Immutable Agent Identity)
    this.#buildDnaLayer(agent),  // Big5, PAD, Role Blueprint
    
    // Layer 3: Context (Variable Business Data)
    this.#buildContextLayer({
      company: nodeConfig.business_context.company,
      product: nodeConfig.business_context.product,
      lead: lead,
      ragContext: await this.getRagContext(campaign)
    }),
    
    // Layer 4: Persona Refresh (Anti-Drift)
    this.#buildPersonaRefreshLayer(turnCount),
    
    // Layer 5: Objectives (Node-Specific Goals)
    this.#buildObjectivesLayer(nodeConfig.objective),
    
    // Layer 6: Override (Critical Directives)
    this.#buildOverrideLayer(scopePolicy)
    
  ].join('\n\n');
}
```

### **Context Caching (90% economia de tokens)**

```javascript
// Gemini 2.5 Flash com cache explícito
const cachedContent = await genAI.cacheContent({
  model: 'gemini-2.5-flash',
  contents: [{
    role: 'system',
    parts: [{ text: dnaLayer + contextLayer }]  // ~2.5k tokens
  }],
  ttlSeconds: 3600  // 1 hora
});

// Chamadas subsequentes reutilizam cache
const response = await genAI.generateContent({
  cachedContent: cachedContent.name,  // ✅ $0.03/1M vs $0.30/1M
  contents: [{ role: 'user', parts: [{ text: userMessage }] }]
});
```

**Economia Real:**
- **Antes:** 3.000 tokens/mensagem × $0.30/1M = $0.0009/msg
- **Depois (cache):** 500 tokens novos × $0.30/1M + 2.500 cached × $0.03/1M = $0.00015/msg + $0.000075 = **83% economia**

---

## 🗄️ **DATABASE: SUPABASE POSTGRES + PGVECTOR**

### **Schema Principal**

```sql
-- Multi-tenant isolation via RLS
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMPTZ
);

CREATE TABLE agents (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name TEXT,
  dna_config JSONB,  -- Big5, PAD, Chronemics
  CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  agent_id UUID REFERENCES agents(id),
  strategy_graph JSONB,  -- Workflow as JSON
  metadata JSONB
);

CREATE TABLE campaign_leads (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  phone TEXT,
  current_node_id TEXT,  -- Node no grafo
  state TEXT,  -- new, contacted, qualified, closed
  metadata JSONB,
  created_at TIMESTAMPTZ
);

CREATE TABLE chats (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES campaign_leads(id),
  last_message_at TIMESTAMPTZ,
  turn_count INTEGER,  -- Persona refresh threshold
  metadata JSONB
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  chat_id UUID REFERENCES chats(id),
  role TEXT,  -- user | assistant | system
  content TEXT,
  created_at TIMESTAMPTZ
);

-- RAG Support (pgvector)
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  title TEXT,
  content TEXT,
  embedding VECTOR(768),  -- Gemini embeddings
  metadata JSONB
);

CREATE INDEX idx_kb_embedding ON knowledge_base 
USING ivfflat (embedding vector_cosine_ops);

-- Usage tracking
CREATE TABLE usage_events (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  model TEXT,  -- gemini-2.5-flash
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_usd NUMERIC(10,6),
  purpose TEXT,  -- chat, embedding, summarization
  created_at TIMESTAMPTZ
);
```

### **Row Level Security (RLS)**

```sql
-- Isolamento multi-tenant
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON campaigns
FOR ALL USING (
  company_id = (
    SELECT company_id FROM auth_users WHERE id = auth.uid()
  )
);

-- Performance optimization
CREATE INDEX idx_campaigns_company_user 
ON campaigns(company_id, user_id);
```

---

## 📬 **INTEGRAÇÕES**

### **1. WhatsApp (WAHA Plus)**

```yaml
# docker-compose.yml
services:
  waha:
    image: devlikeapro/waha-plus:noweb
    environment:
      WAHA_WEBHOOK_URL: http://host.docker.internal:8000/api/webhooks/waha
      WAHA_WEBHOOK_EVENTS: message,session.status,message.ack
    ports:
      - "3000:3000"
    volumes:
      - waha-sessions:/app/.waha/sessions
```

**Capabilities:**
- ✅ Multi-device (até 100 sessões simultâneas)
- ✅ Send text, media, buttons, lists
- ✅ Read receipts, typing indicators
- ✅ Presence tracking (Online/Typing/Offline)
- ✅ Voice message transcription (Gemini Audio)

---

### **2. Meta Ads (CAPI + Click-to-WhatsApp)**

#### **A) Lead Ingestion (Referral Extraction)**

```javascript
// ChatService.js - Extração automática
const referral = payload.referral || payload._data?.referral;
if (referral) {
  await supabase.from('campaign_leads').update({
    metadata: {
      ad_source: {
        source_id: referral.source_id,      // Ad ID
        source_type: referral.source_type,  // 'ad'
        source_url: referral.source_url,    // URL do anúncio
        headline: referral.headline,
        body: referral.body
      }
    }
  }).eq('phone', normalizedPhone);
}
```

#### **B) Server-Side Conversions (CAPI)**

```javascript
// AdsReportingService.js
async reportConversion(leadId, eventName, value = 0) {
  const lead = await this.getLeadData(leadId);
  
  // Hash PII (LGPD/GDPR)
  const userData = {
    em: [this.hashSHA256(lead.email)],
    ph: [this.hashSHA256(lead.phone)],
    fn: [this.hashSHA256(lead.first_name)],
    external_id: [this.hashSHA256(lead.id)]
  };
  
  // Send to Graph API
  await axios.post(
    `https://graph.facebook.com/v18.0/${pixelId}/events`,
    {
      data: [{
        event_name: eventName,  // 'Lead', 'Schedule', 'Purchase'
        event_time: Math.floor(Date.now() / 1000),
        user_data: userData,
        custom_data: { value, currency: 'BRL' },
        action_source: 'chat'
      }],
      access_token: capiToken
    }
  );
}
```

**Eventos Implementados:**
| Evento | Trigger |
|--------|---------|
| `Lead` | Lead cadastrado via formulário/scraping |
| `Schedule` | Reunião agendada pelo agente |
| `Purchase` | Venda concluída (node `ClosingNode`) |
| `CompleteRegistration` | Onboarding finalizado |

---

### **3. Apify (Web Scraping)**

```javascript
// ApifyWebhookHandler.js
async handleWebhook(req, res) {
  const { resource } = req.body;
  
  // 1. Download dataset from Apify
  const dataset = await apifyClient.dataset(resource.defaultDatasetId).listItems();
  
  // 2. Transform raw data
  const normalized = await leadTransformer.transform(dataset.items, {
    phoneFormat: 'E.164',  // +55 11 99999-9999 → +5511999999999
    deduplication: true
  });
  
  // 3. Insert into Supabase
  const { data, error } = await supabase
    .from('campaign_leads')
    .upsert(normalized, { onConflict: 'phone' });
  
  // 4. Auto-engage if enabled
  if (campaign.auto_engage) {
    await workflowEngine.enqueue(data.map(lead => lead.id));
  }
}
```

---

## 🎨 **FRONTEND: LANDING PAGE PREMIUM**

### **Design System (Engineering Dark)**

```css
/* Paleta de Cores */
:root {
  /* Background System */
  --background: #080A10;        /* Azul profundo quase preto */
  --card-bg: #0D1017;           /* Cards elevados */
  --card-hover: #0F1219;        /* Hover state */
  
  /* Borders (Linear-style) */
  --border-subtle: rgba(255,255,255,0.05);
  --border-default: rgba(255,255,255,0.08);
  --border-hover: rgba(255,255,255,0.15);
  
  /* Accent Colors */
  --accent-blue: #3B82F6;       /* Primary CTA */
  --accent-red: #F87171;        /* Problemas/Dores */
  --accent-orange: #FB923C;     /* Warnings/Stats */
  --accent-purple: #A855F7;     /* AI/Tech */
  
  /* Text */
  --text-primary: rgba(255,255,255,0.95);
  --text-secondary: rgba(255,255,255,0.65);
  --text-muted: rgba(255,255,255,0.40);
}
```

### **Efeitos Visuais (Motion.dev Inspired)**

```tsx
// 1. Radial Dot Texture
<div className="absolute inset-0"
  style={{
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    maskImage: 'radial-gradient(ellipse 100% 80% at 50% 30%, black 0%, transparent 70%)'
  }}
/>

// 2. Central Glow
<div className="absolute top-1/2 left-1/3 w-96 h-96 
  bg-blue-500/30 blur-[120px] rounded-full" />

// 3. Text Glow (WhatsApp highlight)
<span style={{
  textShadow: '0 0 15px rgba(59,130,246,0.4), 0 0 30px rgba(59,130,246,0.2)'
}}>no WhatsApp</span>

// 4. Aurora Background
<div className="absolute -top-40 -right-40 w-96 h-96 
  bg-purple-500/20 blur-[100px] rounded-full animate-pulse" />
```

### **Animações (Framer Motion)**

```tsx
// Staggered Children (Hero Section)
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,      // 200ms entre elementos
      delayChildren: 0.3         // Delay inicial
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { 
      duration: 0.7, 
      ease: [0.22, 1, 0.36, 1]  // Custom easing (premium)
    }
  }
};

// WhileInView (Scroll Animations)
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  whileHover={{ y: -8 }}  // Lift on hover
  transition={{ duration: 0.7, delay: 0.1 }}
/>
```

---

## 🚀 **QUICKSTART**

### **Prerequisites**

```bash
node >= 20.x
npm >= 10.x
docker
docker-compose
```

### **1. Clone & Install**

```bash
git clone https://github.com/seu-usuario/axis.git
cd axis

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### **2. Setup Environment**

```bash
# Root .env
cp .env.example .env

# Preencher:
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza...
```

### **3. Start Infrastructure**

```bash
# Start Redis + WAHA
docker-compose up -d

# Check containers
docker ps
# Deve mostrar: redis, waha-plus
```

### **4. Run Backend**

```bash
cd backend
npm run dev

# Logs esperados:
# ✓ Supabase connected
# ✓ Redis connected (BullMQ ready)
# ✓ WAHA client initialized
# 🚀 Server running on http://localhost:8000
```

### **5. Run Frontend**

```bash
cd frontend
npm run dev

# Acesse: http://localhost:5000
```

---

## 📚 **GUIAS DE USO**

### **1. Criar Primeira Campanha**

```bash
# Via UI: http://localhost:5000/app/campaigns
# Ou via script:
cd backend
node src/scripts/create_test_campaign.js
```

**Template SDR (B2B):**
```json
{
  "name": "Outreach Tech Startups",
  "agent_id": "agent-uuid",
  "strategy_graph": {
    "nodes": [
      { "id": "start", "type": "OutreachNode", "data": { "objective": "Apresentar solução" } },
      { "id": "qualify", "type": "QualificationNode", "data": { "critical_slots": ["BUDGET", "AUTHORITY"] } },
      { "id": "schedule", "type": "ClosingNode", "data": { "required_cta": "SCHEDULE_CALL" } }
    ],
    "edges": [
      { "source": "start", "target": "qualify", "condition": "replied" },
      { "source": "qualify", "target": "schedule", "condition": "qualified" }
    ]
  }
}
```

---

### **2. Configurar Agente (DNA)**

```javascript
// Via UI: /app/agents/new
{
  "name": "Maria - SDR Friendly",
  "dna_config": {
    "psychometrics": {
      "big5": {
        "openness": "HIGH",
        "conscientiousness": "HIGH",
        "extraversion": "MEDIUM",
        "agreeableness": "HIGH",
        "neuroticism": "LOW"
      }
    },
    "linguistics": {
      "reduction_profile": "NATIVE",
      "formality": "CASUAL",
      "use_emoji": "MODERATE"
    },
    "chronemics": {
      "latency_profile": "FAST",
      "burstiness_profile": "MODERATE"
    },
    "identity": {
      "role": "SDR"
    }
  }
}
```

---

### **3. Ingestão de Leads (Apify)**

```javascript
// 1. Configure webhook no Apify Actor
// Webhook URL: https://seu-backend.com/api/api-hooks/apify

// 2. Via UI: Start scraping job
POST /api/apify/start-scraper
{
  "actorId": "google-maps-scraper",
  "input": {
    "searchQuery": "restaurantes em são paulo",
    "maxResults": 100
  }
}

// 3. Leads aparecem automaticamente em /app/campaigns/{id}
```

---

## 🔐 **SEGURANÇA & COMPLIANCE**

### **BYOK (Bring Your Own Key)**

✅ **Zero hardcoded secrets**  
✅ **Cada empresa usa suas próprias API keys**  
✅ **Supabase RLS garante isolamento de dados**  
✅ **Logs sanitizados (sem PII em produção)**

### **LGPD/GDPR**

```javascript
// Hash de dados sensíveis antes de enviar para Meta
const hashedEmail = crypto
  .createHash('sha256')
  .update(email.toLowerCase().trim())
  .digest('hex');

// Logs redacted
logger.info({ phone: maskPhone(phone) }, 'Lead contacted');
// Output: { phone: "+5511****9999" }
```

---

## 📊 **MONITORAMENTO**

### **Health Check**

```bash
curl http://localhost:8000/health

# Response:
{
  "status": "healthy",
  "timestamp": "2026-01-28T21:00:00Z",
  "services": {
    "supabase": "connected",
    "redis": "connected",
    "waha": "ready",
    "queue_workers": 3
  }
}
```

### **Usage Tracking**

```sql
-- Custo por campanha (últimos 30 dias)
SELECT 
  c.name,
  SUM(ue.tokens_input + ue.tokens_output) as total_tokens,
  SUM(ue.cost_usd) as total_cost_usd
FROM usage_events ue
JOIN campaigns c ON ue.company_id = c.company_id
WHERE ue.created_at >= NOW() - INTERVAL '30 days'
GROUP BY c.name
ORDER BY total_cost_usd DESC;
```

---

## 🛠️ **TROUBLESHOOTING**

### **WAHA não conecta**

```bash
# Verificar logs
docker logs axis-waha

# Reiniciar container
docker-compose restart waha
```

### **Queue não processa jobs**

```bash
# Verificar workers ativos
redis-cli
> KEYS bull:*

# Limpar queue (dev only)
> FLUSHDB
```

### **Gemini Rate Limit**

```javascript
// Aumentar retry backoff
// GeminiClient.js
const retryConfig = {
  retries: 5,
  factor: 3,  // 3s, 9s, 27s...
  minTimeout: 3000,
  maxTimeout: 60000
};
```

---

## 📈 **ROADMAP**

### **Q1 2026**
- [x] Context Caching (Gemini 2.5)
- [x] Multi-tenant RLS completo
- [ ] Voice messages (transcrição + resposta)
- [ ] A/B Testing de prompts (SplitNode)

### **Q2 2026**
- [ ] Multi-language support (i18n)
- [ ] Integração Telegram/Instagram
- [ ] Analytics dashboard avançado
- [ ] Self-service onboarding

---

## 🤝 **CONTRIBUINDO**

```bash
# 1. Fork o projeto
# 2. Crie feature branch
git checkout -b feature/amazing-feature

# 3. Commit com conventional commits
git commit -m "feat(workflow): add new SentimentAnalysisNode"

# 4. Push e abra PR
git push origin feature/amazing-feature
```

---

## 📄 **LICENSE**

MIT License - veja [LICENSE](LICENSE)

---

## 📞 **SUPORTE**

- 📧 Email: suporte@axis.com
- 💬 Discord: discord.gg/axis
- 📖 Docs: docs.axis.com

---

**Desenvolvido com ❤️ e ☕ por [Seu Time]**

> *"Automação que parece humana, escala que parece impossível."*
