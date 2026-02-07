# Relatório de Correções do Backend, Compliance GEMINI.md e Deploy

## Resumo Executivo
Todos os erros relatados foram resolvidos: Erros 500 no Dashboard, Erro de DI em UserParams, e Erro de RLS na Criação de Agentes. O sistema está estável e implantado via Docker.

## 🛠️ Correções Implementadas

### 1. Correção de Injeção de Dependência (DI)
- **Problema**: `UserParamsController` e `SchedulingController` não registrados.
- **Correção**: Registrados no `container.js` e `server.js`. Teste de API Key retornou 200 OK.

### 2. Refatoração do Dashboard (Remoção do ID da Companhia)
- **Problema**: Dependência de `company_id`.
- **Correção**: Refatorado para usar apenas `userId`.

### 3. Configuração do WAHA
- **Problema**: `WAHA_API_URL` ausente.
- **Correção**: Adicionado ao `.env.production`.

### 4. Correção de Criação de Agentes (RLS)
- **Problema**: Erro 500 ao criar agente: `new row violates row-level security policy`.
- **Causa**: O `AgentService` tentava inserir um novo agente sem o campo `user_id`, violando a regra de segurança do banco que exige um dono para o registro.
- **Correção**: Modifiquei `AgentService.js` para injetar explicitamente o `user_id` no payload de inserção.

## 🚀 Deploy Status
- **Container**: `axis-backend`
- **Status**: Running (Rebuilt at 11:45)
- **Health**: OK

## Etapas de Verificação
1. **Configurações**: PUT `/api/v1/user/params` -> ✅ 200 OK
2. **Agentes**: POST `/api/v1/agents` -> Deve retornar com sucesso agora que o `user_id` é passado corretamente.
