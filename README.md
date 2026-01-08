# ÁXIS: A Arquitetura Técnica Definitiva

> **Versão do Documento:** 2.1.0 (Technical Bible)
> **Escopo:** Backend, Infraestrutura, IA, Automação e **Frontend**
> **Público Alvo:** Engenheiros de Software, Arquitetos de Soluções, DevOps e Auditores Técnicos.

---

## 📑 Índice Mestre

1.  [Manifesto de Arquitetura](#1-manifesto-de-arquitetura)
    *   1.1. O Monólito Modular
    *   1.2. Design Patterns Utilizados
    *   1.3. Árvore de Decisão Tecnológica
2.  [Anatomia do Backend (`/backend/src`)](#2-anatomia-do-backend)
    *   2.1. O Core (`/core`)
    *   2.2. A API (`/api`)
    *   2.3. A Infraestrutura (`/infra`)
    *   2.4. O Bootstrap (`server.js`)
3.  [Engenharia de Fluxo de Trabalho (Workflow Engine)](#3-engenharia-de-fluxo-de-trabalho)
    *   3.1. O Ciclo de Vida "Pulse"
    *   3.2. Execução Baseada em Grafos
    *   3.3. Sistema de Filas Híbrido (BullMQ vs Polling)
4.  [Inteligência Artificial e Agentes](#4-inteligência-artificial-e-agentes)
    *   4.1. LangGraph e Raciocínio de Estado
    *   4.2. RAG (Retrieval-Augmented Generation)
    *   4.3. Trigger Service (O "Sniper")
5.  [Pipeline de Dados e Ingestão](#5-pipeline-de-dados-e-ingestão)
    *   5.1. Integração Apify (Webhooks)
    *   5.2. Normalização e Deduplicação
    *   5.3. Enriquecimento de Leads
6.  [Infraestrutura e Integrações Externas](#6-infraestrutura-e-integrações-externas)
    *   6.1. WAHA Plus (WhatsApp API)
    *   6.2. Supabase (Postgres & Auth)
    *   6.3. Docker & Orquestração
7.  [Segurança e Compliance (BYOK)](#7-segurança-e-compliance)
8.  [Guia de Contribuição e Extensão](#8-guia-de-contribuição-e-extensão)
9.  [Frontend: Landing Page & Motion Design](#9-frontend-landing-page--motion-design)
    *   9.1. Stack Técnica
    *   9.2. Arquitetura de Componentes
    *   9.3. Sistema Visual (Engineering Dark)
    *   9.4. Motion Design & Animações

---

# 1. Manifesto de Arquitetura

O sistema **ÁXIS** não é apenas um script de automação; é uma plataforma de orquestração de eventos distribuídos projetada para alta resiliência e personalização em escala. A arquitetura foi concebida para resolver o "Trilema da Prospecção Automatizada": **Personalização (IA)**, **Escala (Filas)** e **Segurança (BYOK)**.

### 1.1. O Monólito Modular

Optamos por uma arquitetura de **Monólito Modular** (Modular Monolith). Diferente de microserviços prematuros que adicionam latência de rede e complexidade operacional, o monólito modular nos permite:
1.  **Limites de Contexto Claros:** O código é separado em domínios (`campaign`, `chat`, `system`), não camadas técnicas.
2.  **Transações Atômicas:** Facilidade em garantir consistência de dados no Postgres.
3.  **Refatoração Simplificada:** Mover lógica entre módulos é trivial comparado a refatorar contratos gRPC entre serviços.

### 1.2. Design Patterns Utilizados
*   **Dependency Injection (DI):** Injeção manual no `server.js` (L linhas 97-201) para facilitar testes unitários e mockagem.
*   **Strategy Pattern:** Utilizado no `NodeFactory.js` para selecionar executores de nós do grafo dinamicamente.
*   **Observer Pattern:** O `WorkflowEngine` observa eventos de *Presence* do WhatsApp para disparar gatilhos em tempo real.
*   **Repository Pattern:** (Implícito) O acesso a dados é abstraído via Supabase Client, mas encapsulado nos Services.

### 1.3. Árvore de Decisão Tecnológica
*   **Node.js vs Python:** Escolzido Node.js pela superioridade em I/O assíncrono (necessário para milhares de conexões WebSocket do WhatsApp) e ecossistema rico de bibliotecas de orquestração (BullMQ).
*   **Supabase vs Mongo:** Escolzido Postgres (via Supabase) pela integridade relacional necessária entre Campanhas, Leads e Histórico de Chat. A estrutura JSONB do Postgres permite flexibilidade para metadados de leads sem perder a rigidez do schema principal.
*   **LangGraph vs Cadeias Simples:** A necessidade de *loops* de raciocínio (o agente decidir buscar mais info antes de responder) exigiu um grafo de estado, não uma cadeia linear.

---

# 2. Anatomia do Backend

O coração do sistema reside em `backend/src`. A estrutura de diretórios não é acidental; ela reflete a separação de responsabilidades.

## 2.1. O Core (`/src/core`)
Esta pasta contém a lógica de negócios pura, agnóstica de transporte (HTTP/Socket).

### `/core/services` - Os Trabalhadores

#### Domínio: Automação (`/automation`)
| Arquivo | Descrição |
|---------|-----------|
| `TriggerService.js` | **O "Sniper"**. Escuta eventos de presença (Online/Typing) e decide se a IA deve intervir. Implementa Debounce (3000ms) para evitar disparos múltiplos. |
| `PresenceService.js` | Mantém estado Online/Offline das instâncias WhatsApp. Sincroniza a cada 5 minutos (`startPeriodicSync(300000)`). |

#### Domínio: Campanhas (`/campaign`)
| Arquivo | Descrição |
|---------|-----------|
| `CampaignService.js` | Gerencia configurações de campanha, horários de funcionamento e regras de envio. |
| `LeadService.js` | O CRM interno. Gerencia transições de estado (`new` → `contacted`), Lead Scoring e persistência de nós do grafo. |
| `CampaignTemplateService.js` | Sistema de templates de campanha. Cria workflows pré-configurados para casos de uso específicos (ex: `meta_ads`). |

#### Domínio: Chat (`/chat`)
| Arquivo | Descrição |
|---------|-----------|
| `ChatService.js` | Gerenciamento de chats. Extrai `referral` de Click-to-WhatsApp Ads automaticamente. Deduz créditos antes de enviar mensagens. |
| `HistoryService.js` | Recuperação de histórico de conversas para contexto do prompt. |

#### Domínio: Inteligência Artificial (`/ai`)
| Arquivo | Descrição |
|---------|-----------|
| `PromptService.js` | **Engenheiro de prompt dinâmico**. Injeta dados do lead, histórico, diretrizes da campanha e contexto RAG antes do LLM. |
| `EmotionalStateService.js` | Implementa o **modelo PAD** (Pleasure, Arousal, Dominance) para adaptação emocional das respostas do agente. |
| `ModelService.js` | Serviço centralizado para resolução de modelo de IA. Suporta Gemini, OpenAI e Anthropic. |

#### Domínio: Agentes (`/agents`)
| Arquivo | Descrição |
|---------|-----------|
| `AgentService.js` | CRUD de agentes. Gerencia **DNA Config** (identidade, brand voice, compliance rules). Valida API keys por provider. |

#### Domínio: Extração de Dados (`/extraction`)
| Arquivo | Descrição |
|---------|-----------|
| `LeadTransformerService.js` | Normalizador. Converte JSON sujo do Apify para schema canônico. Formata telefones para E.164 via `libphonenumber-js`. |
| `ScraperOrchestrator.js` | Orquestrador de scrapers. Gerencia múltiplos providers. |
| `WebContentService.js` | Extração de conteúdo web para RAG. |
| `providers/ApifyProvider.js` | Provider para Apify Cloud. |

#### Domínio: Marketing (`/marketing`)
| Arquivo | Descrição |
|---------|-----------|
| `AdsReportingService.js` | **Meta Conversions API (CAPI)**. Envia eventos de conversão server-side. Hash SHA-256 de dados sensíveis (LGPD/GDPR). Suporta eventos: `Lead`, `Schedule`, `Purchase`, `CompleteRegistration`. |

#### Domínio: Guardrails (`/guardrails`)
| Arquivo | Descrição |
|---------|-----------|
| `GuardrailService.js` | **Validação de respostas da IA**. Injeta CTAs em nós de conversão. Sanitiza respostas (remove vazamento de prompts). Detecta toxicidade. Valida limites de comprimento. |

#### Domínio: Conteúdo (`/content`)
| Arquivo | Descrição |
|---------|-----------|
| `SpintaxService.js` | **Anti-spam engine**. Diversifica mensagens via Spintax (`{Olá|Oi}! {Como vai|Tudo bem}?`). Varia pontuação e emojis. |

#### Domínio: Billing (`/billing`)
| Arquivo | Descrição |
|---------|-----------|
| `BillingService.js` | Gerenciamento de planos e trial. Suporta upgrade para premium. Sistema de créditos (simplified mode). |

#### Domínio: Sistema (`/system`)
| Arquivo | Descrição |
|---------|-----------|
| `SettingsService.js` | Configurações dinâmicas do banco. Feature flags. Validação de API keys por provider. |
| `CacheService.js` | Cache em memória para dados frequentes. |
| `HealthService.js` | Health checks do sistema. |

#### Domínio: WhatsApp (`/waha`)
| Arquivo | Descrição |
|---------|-----------|
| `JidNormalizationService.js` | **Normalizador de JID**. Resolve problema do 9º dígito brasileiro. Extrai número real de LID. Cache em memória. Usa WAHA `check-exists` como source of truth. |

#### Domínio: Filas (`/queue`)
| Arquivo | Descrição |
|---------|-----------|
| `QueueService.js` | Abstração BullMQ/Redis. Registra workers. Gerencia shutdown gracioso. |

### `/core/engines` - Os Cérebros

| Engine | Descrição |
|--------|-----------|
| `WorkflowEngine.js` | **A máquina de estados** (31KB). Processa leads como entidades navegando por Grafo Direcionado. Modo híbrido: Queue (BullMQ) ou Polling. |
| `AgentGraphEngine.js` | Implementação LangGraph. Estados `agent` e `supervisor`. Guardrails para evitar alucinações. |
| `NodeFactory.js` | Factory pattern para instanciar executores de nós dinamicamente. |

### Tipos de Nós do Workflow (`/engines/workflow/nodes`)
| Nó | Responsabilidade |
|----|------------------|
| `AgentNode.js` | Execução de IA com "human physics" (typing delay, burstiness) |
| `AgenticNode.js` | Nó autônomo com tomada de decisão |
| `BroadcastNode.js` | Envio em massa com rate limiting |
| `ClosingNode.js` | Fechamento de conversa com CTA obrigatório |
| `DelayNode.js` | Delays inteligentes (horário comercial, timezone) |
| `HandoffNode.js` | Transferência para humano com notificação |
| `LogicNode.js` | Condicionais (if/else baseado em metadata) |
| `GotoNode.js` | Salto para outro nó do grafo |
| `SplitNode.js` | A/B Testing de respostas |
| `sdr/QualificationNode.js` | Qualificação de leads (BANT) |
| `sdr/OutreachNode.js` | Primeiro contato (cold outreach) |
| `sdr/ObjectionNode.js` | Tratamento de objeções |

## 2.2. A API (`/src/api`)
A camada de interface. Recebe requisições externas e delega para o Core.

### Controllers por Domínio

#### Domínio: Chat (`/controllers/chat`)
| Controller | Endpoints |
|------------|-----------|
| `WebhookController.js` | Recebe webhooks do WAHA (mensagens, acks, presence). Ponto de entrada principal. |
| `ChatController.js` | CRUD de chats. Envio de mensagens via API. |
| `OracleController.js` | Endpoint de geração de resposta IA ("Oracle mode"). |

#### Domínio: Campanhas (`/controllers/campaign`)
| Controller | Endpoints |
|------------|-----------|
| `CampaignController.js` | CRUD de campanhas. |
| `LeadController.js` | Gerenciamento de leads. Trigger manual de workflow. |
| `ProspectController.js` | Busca e filtro de prospects. |

#### Domínio: Apify (`/controllers/apify`)
| Controller | Endpoints |
|------------|-----------|
| `ApifyController.js` | Start/stop de actors Apify. Gerenciamento de tasks. |
| `ApifyWebhookHandler.js` | Webhook receiver. Processa datasets e insere leads. |

#### Domínio: WAHA (`/controllers/waha`)
| Controller | Endpoints |
|------------|-----------|
| `WahaSessionController.js` | Gerenciamento de sessões (start, stop, logout). |
| `WahaAuthController.js` | Autenticação (QR code, pairing code). |
| `WahaProfileController.js` | Perfil do usuário (nome, foto). |
| `WahaChattingController.js` | Operações de chat (typing, read, archive). |
| `WahaPresenceController.js` | Controle de presença (online/offline). |
| `WahaMediaController.js` | Upload/download de mídia. |
| `WahaObservabilityController.js` | Logs e métricas do WAHA. |
| `WahaScreenshotController.js` | Screenshots da sessão (debug). |

#### Domínio: Sistema (`/controllers/system`)
| Controller | Endpoints |
|------------|-----------|
| `SettingsController.js` | CRUD de configurações. |
| `AdminController.js` | Operações administrativas. |
| `HealthController.js` | Health check endpoint (`/health`). |

#### Domínio: Agentes (`/controllers/agents`)
| Controller | Endpoints |
|------------|-----------|
| `AgentController.js` | CRUD de agentes. Teste de resposta. DNA config. |

#### Domínio: Analytics (`/controllers/analytics`)
| Controller | Endpoints |
|------------|-----------|
| `AnalyticsController.js` | Dashboard stats. Top objeções. Conversion rate. |

#### Domínio: Billing (`/controllers/billing`)
| Controller | Endpoints |
|------------|-----------|
| `BillingController.js` | Status do plano. Upgrade. Webhook Stripe. |

### Middlewares (`/api/middlewares`)
| Middleware | Função |
|------------|--------|
| `authMiddleware.js` | Validação JWT via Supabase Auth. Extrai `user` e `role`. |
| `rbacMiddleware.js` | Role-Based Access Control. Verifica permissões por endpoint. |
| `riskMiddleware.js` | Análise de risco de requisições. Rate limiting inteligente. |
| `traceMiddleware.js` | Contexto de trace para observabilidade (trace_id, span_id). |

## 2.3. A Infraestrutura (`/src/infra`)
Adaptadores para o mundo externo.
*   **`clients/WahaClient.js`**: Cliente HTTP para a API do WAHA Plus. Trata autenticação, formatação de payloads e tratamento de erros de rede.
*   **`clients/GeminiClient.js`**: Wrapper para a API do Google Generative AI.
*   **`clients/RagClient.js`**: Cliente para recuperação de contexto vetorial (se implementado).

## 2.4. O Bootstrap (`server.js`)
O ponto de partida. Realiza a **Injeção de Dependências Manual**.
1.  Carrega `.env` (Local e Root).
2.  Inicializa conexões (Supabase, Redis).
3.  Instancia Serviços Base (`SettingsService`).
4.  Carrega Configurações Dinâmicas do Banco (Feature Flags).
5.  Instancia Clientes de Infra (`WahaClient`, `GeminiClient`).
6.  Instancia Services, Engines e Controllers, injetando as dependências na ordem correta.
7.  Inicia o servidor Express e os Workers de Background.

---

# 3. Engenharia de Fluxo de Trabalho (Workflow Engine)

O `WorkflowEngine` (`core/engines/workflow/WorkflowEngine.js`) é o componente mais complexo e crítico do sistema. Ele transforma diagramas estáticos em processos executáveis.

### 3.1. O Ciclo de Vida "Pulse"
O engine opera em um batimento cardíaco ("Pulse").
*   **Modo Polling (Fallback):** A cada 10s, busca leads ativos no banco e processa.
*   **Modo Queue (Produção):** Utiliza BullMQ. O "Pulse" apenas enfileira jobs. Os Workers processam assincronamente.
    *   Vantagem: Escalabilidade horizontal (adicionar mais workers processa mais leads).
    *   Resiliência: Se o processo cair, o job persiste no Redis e é retomado.

### 3.2. Execução Baseada em Grafos
Cada Campanha possui um JSON `strategy_graph`. O Engine:
1.  Carrega o Grafo.
2.  Identifica o `current_node_id` do Lead.
3.  Invoca o Executor correspondente (via `NodeFactory`).
    *   Tipos de Nódulos: `Send Message`, `Wait for Reply`, `AI Process`, `Update CRM`.
4.  Avalia o resultado e determina a próxima aresta (`Edge`) a seguir.
5.  Transiciona o Lead no Banco (`leadService.transitionToNode`).

### 3.3. Sistema de Filas Híbrido
O código detecta se o Redis está disponível (`WorkflowEngine.js` L26).
*   **Com Redis:** Registra workers `ai-generation`, `whatsapp-send`, `lead-processing`.
*   **Sem Redis:** Loga "Polling Mode" e usa `setInterval`. Isso permite que devs rodem o projeto localmente sem subir um container Redis obrigatório.

---

# 4. Inteligência Artificial e Agentes

A "mágica" acontece no `AgentGraphEngine.js`. Não usamos chamadas simples de API; usamos **Sistemas Cognitivos**.

### 4.1. LangGraph e Raciocínio de Estado
O estado da conversa não é apenas um array de strings. O `AgentGraphEngine` define um Schema de Estado:
```javascript
this.stateDefinition = {
    messages: { value: (x, y) => x.concat(y), default: () => [] },
    contextData: { value: (x, y) => ({ ...x, ...y }), default: () => ({}) },
    sentiment: { value: (x, y) => y, default: () => 0.5 },
    nextAction: { value: (x, y) => y, default: () => "agent" }
};
```
Isso permite que o Agente "lembre" do sentimento atual e decida (`nextAction`) se deve responder (`agent`) ou escalar para um humano/supervisor (`supervisor`).

### 4.2. RAG (Retrieval-Augmented Generation)
(Previsto na arquitetura via `RagClient.js`). O sistema pode buscar fragmentos de documentos (PDFs, TXT) no Supabase (pgvector) para enriquecer o prompt do Gemini antes da geração.

### 4.3. Trigger Service (O "Sniper")
O `TriggerService.js` resolve o problema de "Quando abordar?".
*   Ele escuta webhooks de **Presence Update** do WhatsApp.
*   Se o Lead fica **Online** ou está **Digitando**...
*   ...ele espera 3 segundos (Debounce)...
*   ...e dispara o Workflow.
Isso cria a ilusão de onipresença e resposta imediata, aumentando drasticamente a conversão.

---

# 5. Pipeline de Dados e Ingestão

Como os leads entram no sistema? Via `ApifyWebhookHandler.js`.

### 5.1. Integração Apify (Webhooks)
O sistema não faz scraping diretamente (o que seria lento e frágil). Ele delega para a nuvem da Apify.
1.  O Backend manda um comando `start` para um Actor do Apify (ex: Google Maps Scraper).
2.  O Apify roda na nuvem.
3.  Quando termina, o Apify chama `POST /api/api-hooks/apify`.

### 5.2. Normalização e Deduplicação
O handler recebe o Webhook:
1.  Verifica a assinatura do evento.
2.  Baixa o JSON do Dataset do Apify (`client.dataset(id).listItems()`).
3.  Chama `LeadTransformerService` para limpar dados (converter telefones para formato E.164 via `libphonenumber-js`).
4.  Verifica duplicações no banco (`getExistingPhones`). Somente novos leads são inseridos.

### 5.3. Enriquecimento de Leads
Após a inserção, se `auto_engage` estiver ativo na campanha, o `TriggerService` injeta os novos leads imediatamente na Fila de Processamento, iniciando o ciclo de contato (Hello Message).

### 5.4. Integração Meta Ads (CAPI & Click-to-WhatsApp)

O sistema possui integração bidirecional com Meta Ads:

#### A. Ingestão de Leads (Click-to-WhatsApp Ads)
Quando um usuário clica em um anúncio "Click-to-WhatsApp", o WhatsApp envia dados de referral junto com a primeira mensagem:

```javascript
// ChatService.js - Extração automática de Ad Referral
const referral = payload.referral || _data?.referral || null;
if (referral) {
    logger.info({ referral }, '🎯 Ad Context Detected');
}
```

**Dados extraídos:**
- `source_id` → ID do anúncio
- `source_type` → Tipo (ad, post, etc)
- `source_url` → URL do anúncio
- `headline` → Título do anúncio
- `body` → Corpo do anúncio

#### B. Conversions API (CAPI) - Server-Side Tracking
O `AdsReportingService` envia eventos de conversão diretamente para o Meta, bypassing bloqueadores de ads:

```javascript
// AdsReportingService.js - Eventos de Conversão
async reportConversion(leadId, eventName, value = 0) {
    // 1. Busca Lead & Dados de Campanha
    // 2. Hash SHA-256 dos dados sensíveis (LGPD/GDPR)
    const userData = {
        em: [this.hash(lead.email)],    // Email hasheado
        ph: [this.hash(lead.phone)],    // Telefone hasheado
        fn: [this.hash(lead.first_name)],
        external_id: [this.hash(lead.id)]
    };
    // 3. Envia para Graph API
    const url = `https://graph.facebook.com/v18.0/${pixelId}/events`;
}
```

**Eventos suportados:**
| Evento | Quando Disparado |
|--------|------------------|
| `Lead` | Lead cadastrado via formulário |
| `Schedule` | Reunião agendada |
| `Purchase` | Venda concluída |
| `CompleteRegistration` | Cadastro completo |

**Configuração por Campanha:**
- `campaigns.metadata.pixel_id` → Pixel ID customizado
- `campaigns.metadata.capi_token` → Token CAPI customizado
- Fallback: variáveis de ambiente `META_PIXEL_ID`, `META_CAPI_TOKEN`

---

# 6. Infraestrutura e Integrações Externas

A robustez vem da escolha de ferramentas consolidadas.

### 6.1. WAHA Plus (WhatsApp HTTP API)
Utilizamos o **WAHA Plus** (imagem `devlikeapro/waha-plus:noweb`) rodando em container Docker.
*   **Engine:** Versão `NOWEB` (sem navegador visível) para performance extrema.
*   **Sessões:** Persistidas em volume Docker (`waha-sessions`) para sobreviver a reboots.
*   **Webhooks:** Configurados para enviar eventos `message` e `session.status` para o backend local (`host.docker.internal`).

### 6.2. Supabase (Postgres & Auth)
O Supabase atua como Backend-as-a-Service para persistência.
*   **Tabelas Key:** `campaigns`, `campaign_leads`, `workflow_nodes`, `chat_history`.
*   **Auth:** Gerenciamento de usuários do painel.
*   **Realtime:** (Opcional) Usado para atualizar o Dashboard Frontend instantaneamente quando um lead responde.

### 6.3. Docker & Orquestração
O `docker-compose.yml` orquestra:
1.  **Redis:** Cache e Filas.
2.  **WAHA:** Gateway de WhatsApp.
O Backend e Frontend rodam (em desenvolvimento) no host para facilitar debugging, mas estão prontos para containerização.

---

# 7. Segurança e Compliance (BYOK)

A arquitetura Implementa estritamente o modelo **Bring Your Own Key**.

1.  **Chaves API:** `GEMINI_API_KEY` e credenciais Supabase nunca são hardcoded. Elas vivem no `.env`.
2.  **Isolamento de Dados:** Cada instância do sistema é isolada. Não há "SaaS Central" processando dados de múltiplos clientes. O banco de dados é do usuário.
3.  **Logs Sanitizados:** O logger (`pino`) é configurado para não vazar conteudos de mensagens sensíveis em produção (nível `info` ou `warn`).

---

# 8. Guia de Contribuição e Extensão

Para estender o sistema:

### Adicionar um Novo Nódulo no Workflow
1.  Crie uma classe em `backend/src/core/engines/workflow/nodes/MeuNovoNode.js`.
2.  Implemente o método `execute(lead, campaign, context)`.
3.  Registre no `NodeFactory.js`.

### Adicionar um Novo Modelo de IA
1.  Crie um cliente em `backend/src/infra/clients/NovoAiClient.js`.
2.  Injete no `server.js`.
3.  Adapte o `AgentGraphEngine` para usar o novo cliente.

---

> *"Arquitetura é sobre as decisões difíceis de mudar."* - Este documento reflete as decisões fundacionais que garantem que o sistema escale de 10 para 10.000 leads/dia sem reescrita.

---

# 9. Frontend: Landing Page & Motion Design

O frontend do ÁXIS não é apenas uma camada de apresentação; é um **manifesto visual da competência técnica** do sistema. A interface foi projetada seguindo os benchmarks de classe mundial (Linear, Vercel, Supabase) para comunicar robustez técnica em milissegundos.

## 9.1. Stack Técnica

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Next.js** | 15+ | Framework React com App Router e Server Components |
| **TypeScript** | 5.x | Type-safety e DX aprimorada |
| **Tailwind CSS** | 4.x | Utility-first styling com tokens customizados |
| **Framer Motion** | 11+ | Animações declarativas e Motion Design |
| **shadcn/ui** | Latest | Sistema de componentes baseado em Radix UI |
| **Lucide React** | Latest | Iconografia consistente (stroke-width: 1.5) |

## 9.2. Arquitetura de Componentes

```
frontend/src/
├── app/
│   ├── page.tsx              # Landing Page principal
│   ├── auth/
│   │   ├── login/page.tsx    # Autenticação (Split-screen)
│   │   └── register/page.tsx # Registro
│   └── legal/
│       ├── terms/page.tsx    # Termos de Uso
│       └── privacy/page.tsx  # Política de Privacidade
├── components/
│   ├── landing/
│   │   ├── hero-text.tsx        # Texto animado do Hero
│   │   ├── whatsapp-demo.tsx    # Demo interativo do chat
│   │   ├── dashboard-mockup.tsx # Mockup visual do painel
│   │   └── header.tsx           # Header responsivo
│   ├── motion/
│   │   ├── expandable-cards.tsx # Cards com layout animation
│   │   ├── animated-tabs.tsx    # Tabs com transições
│   │   └── reorder-list.tsx     # Listas drag-and-drop
│   └── ui/                      # Componentes shadcn/ui
└── lib/
    └── utils.ts                 # Utilitários (cn, etc)
```

### Componentes-Chave da Landing Page

**`hero-text.tsx`** - Implementa animação staggered de entrada:
```typescript
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.3
        }
    }
};
```

**`whatsapp-demo.tsx`** - Demo interativo que mostra o agente em ação:

> **Propósito:** O WhatsApp Demo na Hero Section serve para que o visitante veja imediatamente suas **dúvidas sendo sanadas** enquanto observa o agente trabalhando em tempo real. É uma demonstração visual de como o ÁXIS responde a objeções comuns, agenda reuniões e qualifica leads automaticamente.

**Características técnicas:**
- Scroll infinito de mensagens (animação vertical loop)
- Header flutuante com `backdrop-blur-xl` (glassmorphism)
- Máscara de gradiente para fade suave no topo
- Typing indicator simulado com animação pulse
- Mensagens de exemplo que abordam objeções reais:
  - "Qual o preço?"
  - "Funciona para meu segmento?"
  - "Posso testar antes?"
  - Respostas do agente com tom humanizado

## 9.3. Sistema Visual (Engineering Dark)

A paleta segue o paradigma **"Engineering Dark"** - projetada para reduzir fadiga ocular e comunicar sofisticação técnica.

### Tokens de Cores Principais

```css
/* Background System */
--background: #080A10;        /* Azul profundo quase preto */
--card-bg: #0D1017;           /* Superfícies elevadas */
--card-bg-hover: #0F1219;     /* Estado hover */

/* Borders (Linear-Style) */
--border-subtle: rgba(255,255,255,0.05);
--border-default: rgba(255,255,255,0.08);
--border-hover: rgba(255,255,255,0.15);

/* Accent Colors */
--accent-blue: #3B82F6;       /* Primary CTA */
--accent-red: #F87171;        /* Dores/Problemas */
--accent-orange: #FB923C;     /* Warning/Stats */
--accent-purple: #A855F7;     /* AI/Tech */
```

### Efeitos Visuais Implementados

1. **Radial Dot Texture (Motion.dev Style)**
   ```css
   backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)'
   backgroundSize: '20px 20px'
   maskImage: 'radial-gradient(ellipse 100% 80% at 50% 30%, black 0%, transparent 70%)'
   ```

2. **Central Glow Behind Text**
   ```css
   background: 'radial-gradient(ellipse 60% 50% at 30% 50%, rgba(59,130,246,0.35) 0%, transparent 60%)'
   filter: 'blur(80px)'
   ```

3. **Aurora Background Effect**
   ```css
   bg-blue-500/15 blur-[120px] mix-blend-screen animate-pulse
   ```

4. **Text Glow (WhatsApp Highlight)**
   ```css
   textShadow: '0 0 15px rgba(59,130,246,0.4), 0 0 30px rgba(59,130,246,0.2)'
   ```

## 9.4. Motion Design & Animações

Utilizamos **Framer Motion** para criar uma experiência de "sistema vivo".

### Coreografia de Entrada (Staggered)

| Tempo | Elemento | Animação |
|-------|----------|----------|
| T0 (0ms) | Grid Background | Renderização imediata |
| T1 (300ms) | H1 + Badge | Fade-in + Blur desvanecendo |
| T2 (500ms) | Subtítulo | Slide-up sutil |
| T3 (700ms) | CTAs | Fade-in com escala |
| T4 (900ms+) | WhatsApp Demo | Slide-in lateral |

### Animações de Scroll (whileInView)

A seção "O Problema" implementa **cascade animations**:

```typescript
<motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    whileHover={{ y: -8, transition: { duration: 0.3 } }}
    transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
/>
```

### Cards Premium da Seção "O Problema"

Cada card de dor inclui:
- **Stat Number Gigante**: Gradiente de cor (`from-red-400 to-red-600`)
- **Glow Effect on Hover**: Borda luminosa que aparece
- **Lift Animation**: Cards sobem 8px no hover
- **Watermark Icon**: Ícone grande no fundo com opacidade 0.03 → 0.08 on hover
- **Custom Easing**: `[0.22, 1, 0.36, 1]` para curvas premium

### Componentes Motion Disponíveis

| Componente | Descrição | Uso |
|------------|-----------|-----|
| `ExpandableCards` | Cards com layoutId para transições suaves | Features showcase |
| `AnimatedTabs` | Tabs com underline animado | Navegação de conteúdo |
| `ReorderList` | Lista com drag-and-drop | Configurações |

---

## Changelog (v2.1.0)

### Backend

#### Core Services
- ✅ `EmotionalStateService` - Modelo PAD para adaptação emocional de respostas
- ✅ `GuardrailService` - Validação de respostas, injeção de CTA, detecção de toxicidade
- ✅ `SpintaxService` - Diversificação de mensagens anti-spam
- ✅ `JidNormalizationService` - Resolução do 9º dígito brasileiro
- ✅ `ModelService` - Suporte multi-provider (Gemini, OpenAI, Anthropic)
- ✅ `AgentService` - DNA Config (identidade, brand voice, compliance)
- ✅ `AnalyticsService` - Dashboard stats, conversion rate, top objeções

#### Integração Meta Ads
- ✅ `AdsReportingService` - Conversions API (CAPI) server-side
- ✅ Hash SHA-256 de dados sensíveis (LGPD/GDPR compliance)
- ✅ Extração automática de `referral` em Click-to-WhatsApp Ads
- ✅ Suporte a Pixel ID e CAPI Token por campanha

#### Workflow Engine
- ✅ 13 tipos de nós implementados (Agent, Delay, Handoff, Logic, etc.)
- ✅ Nós SDR especializados (Qualification, Outreach, Objection)
- ✅ "Human Physics" - Typing delay e burstiness realistas
- ✅ Modo híbrido Queue (BullMQ) e Polling

#### API Controllers
- ✅ 8 controllers WAHA completos (Session, Auth, Profile, Chatting, etc.)
- ✅ Analytics, Billing, Agents controllers
- ✅ Trace middleware para observabilidade
- ✅ RBAC middleware com roles por endpoint

### Frontend
- ✅ Landing page com Hero Section animada
- ✅ WhatsApp Demo - mostra dúvidas sendo sanadas em tempo real pelo agente
- ✅ Seção "O Problema" com cards premium e stats
- ✅ Radial dot texture (Motion.dev style)
- ✅ Central glow e Aurora background effects
- ✅ Text glow no destaque "no WhatsApp"
- ✅ Cascade animations com Framer Motion
- ✅ Cards com hover lift e glow effects
- ✅ Páginas de autenticação (Login/Register)
- ✅ Páginas legais (Termos/Privacidade)
- ✅ Sistema de cores Engineering Dark
- ✅ Responsividade completa (Mobile/Desktop)

---

**Fim do Documento Técnico.**
