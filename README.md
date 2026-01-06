# ÁXIS: A Arquitetura Técnica Definitiva

> **Versão do Documento:** 2.0.0 (Technical Bible)
> **Escopo:** Backend, Infraestrutura, IA e Automação
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

### `/core/services`
Os "trabalhadores" do sistema. Cada serviço encapsula um domínio.
*   **`automation/TriggerService.js`**: O "Sniper". Escuta eventos de presença (Online/Typing) e decide se a IA deve intervir. Implementa *Debounce* (3000ms) para evitar disparos múltiplos.
*   **`automation/PresenceService.js`**: Mantém o estado de "Online/Offline" das instâncias do WhatsApp. Sincroniza a cada 5 minutos.
*   **`campaign/LeadService.js`**: O CRM interno. Gerencia transições de estado (`new` -> `contacted`), pontuação (Lead Scoring) e persistência de nós do grafo.
*   **`campaign/CampaignService.js`**: Gerencia configurações de campanha, horários de funcionamento e regras de envio.
*   **`ai/PromptService.js`**: O engenheiro de prompt dinâmico. Constrói o contexto do sistema injetando dados do lead, histórico recente e diretrizes da campanha antes de enviar ao LLM.
*   **`extraction/LeadTransformerService.js`**: Normalizador de dados. Recebe JSON sujo do Apify e converte para o schema canônico do sistema.

### `/core/engines`
Os "cérebros" que orquestram os serviços.
*   **`workflow/WorkflowEngine.js`**: A máquina de estados. Processa cada Lead como uma entidade que navega por um Grafo Direcionado (Nodes & Edges).
*   **`graph/AgentGraphEngine.js`**: A implementação do LangGraph. Define os estados `agent` e `supervisor` para garantir que a IA não alucine ou fuja das diretrizes (Guardrails).

## 2.2. A API (`/src/api`)
A camada de interface. Recebe requisições externas e delega para o Core.
*   **`controllers/apify/ApifyWebhookHandler.js`**: Ponto de entrada de dados.
*   **`controllers/apify/ApifyController.js`**: Gerenciamento de Tasks do Apify.
*   **`controllers/chat/WebhookController.js`**: Recebe webhooks do WAHA (mensagens, acks).
*   **`routes/`**: Definições de endpoints Express (v1).

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

**Fim do Documento Técnico.**
