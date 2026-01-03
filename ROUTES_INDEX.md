# 📍 ÍNDICE COMPLETO DE ROTAS - Completo V2

**Referência rápida para encontrar a rota que você precisa**

---

## 🔍 Como Usar Este Índice

1. **Procure o módulo** na seção abaixo
2. **Encontre a rota** que precisa
3. **Vá para o arquivo** teste.http
4. **Execute a requisição**

---

## 🎯 Módulo por Módulo

### 1️⃣ AUTH - Autenticação (6+ rotas)
**Arquivo**: `backend/src/modules/auth/teste.http`
**Documentação**: `backend/src/modules/auth/README.md`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/auth/register` | POST | Registrar novo usuário |
| `/auth/login` | POST | Fazer login (obter token) |
| `/auth/refresh` | POST | Renovar token |
| `/auth/logout` | POST | Fazer logout |
| `/auth/verify` | GET | Verificar token válido |
| `/auth/password-reset` | POST | Resetar senha |

**Rota mais importante**: `/auth/login` (para obter token)

---

### 2️⃣ RBAC - Roles e Permissões (4 rotas)
**Arquivo**: `backend/src/modules/rbac/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/rbac/roles` | GET | Listar roles |
| `/rbac/roles` | POST | Criar role |
| `/rbac/permissions` | GET | Listar permissões |
| `/rbac/role-permissions` | GET | Permissões de um role |

---

### 3️⃣ AUDIT - Auditoria (5 rotas)
**Arquivo**: `backend/src/modules/audit/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/audit/activities` | GET | Listar atividades |
| `/audit/activities/:id` | GET | Obter atividade |
| `/audit/logs` | GET | Listar logs |
| `/audit/export` | POST | Exportar relatório |
| `/audit/compliance` | GET | Status de compliance |

---

### 4️⃣ CRM - Gerenciamento de Contatos (19 rotas)
**Arquivo**: `backend/src/modules/crm/teste.http`
**Documentação**: Veja arquivo teste.http para rotas

| Rota | Método | Descrição |
|------|--------|-----------|
| `/crm/contacts` | GET | Listar contatos |
| `/crm/contacts` | POST | Criar contato |
| `/crm/contacts/:id` | GET | Obter contato |
| `/crm/contacts/:id` | PUT | Atualizar contato |
| `/crm/contacts/:id` | DELETE | Deletar contato |
| `/crm/deals` | GET | Listar deals |
| `/crm/deals` | POST | Criar deal |
| `/crm/deals/:id/stage` | PUT | Mudar stage do deal |
| `/crm/accounts` | GET | Listar contas |
| `/crm/accounts` | POST | Criar conta |
| `/crm/opportunities` | GET | Listar oportunidades |
| `/crm/opportunities` | POST | Criar oportunidade |
| ... (mais rotas) | ... | ... |

---

### 5️⃣ SIMULATION - Treinamento com IA (4 rotas)
**Arquivo**: `backend/src/modules/simulation/teste.http`
**Documentação**: `backend/src/modules/simulation/README.md`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/simulation/scenarios` | GET | Listar cenários |
| `/simulation/scenarios` | POST | Criar cenário |
| `/simulation/session/start` | POST | Iniciar simulação |
| `/simulation/session/end` | POST | Finalizar simulação |

**Caso de uso**: Criar treinamentos com IA

---

### 6️⃣ SYNC - Sincronização (6 rotas)
**Arquivo**: `backend/src/modules/sync/teste.http`
**Documentação**: `backend/src/modules/sync/README.md`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/sync/connections` | GET | Listar conexões |
| `/sync/connections` | POST | Criar conexão |
| `/sync/connections/:id` | DELETE | Remover conexão |
| `/sync/run` | POST | Iniciar sincronização |
| `/sync/runs` | GET | Listar sincronizações |
| `/sync/runs/:id` | GET | Obter status |

**Integrações**: RDStation, HubSpot, Zendesk, Chatwoot

---

### 7️⃣ CMMS - Manutenção de Ativos (14 rotas)
**Arquivo**: `backend/src/modules/cmms/teste.http`
**Documentação**: `backend/src/modules/cmms/README.md`

#### Assets (4 rotas)
| Rota | Método | Descrição |
|------|--------|-----------|
| `/cmms/assets` | GET | Listar ativos |
| `/cmms/assets` | POST | Criar ativo |
| `/cmms/assets/:id` | GET | Obter ativo |
| `/cmms/assets/:id` | PUT | Atualizar ativo |

#### Maintenance (4 rotas)
| Rota | Método | Descrição |
|------|--------|-----------|
| `/cmms/maintenance` | GET | Listar manutenções |
| `/cmms/maintenance` | POST | Criar manutenção |
| `/cmms/maintenance/:id` | GET | Obter manutenção |
| `/cmms/maintenance/schedule` | POST | Agendar manutenção |

#### Downtime (2 rotas)
| Rota | Método | Descrição |
|------|--------|-----------|
| `/cmms/downtime` | GET | Listar períodos |
| `/cmms/downtime` | POST | Registrar downtime |

#### Spare Parts (4 rotas)
| Rota | Método | Descrição |
|------|--------|-----------|
| `/cmms/spare-parts` | GET | Listar peças |
| `/cmms/spare-parts` | POST | Criar peça |
| `/cmms/spare-parts/:id` | GET | Obter peça |
| `/cmms/spare-parts/movements` | POST | Registrar movimento |

---

### 8️⃣ FSM - Field Service Management (13 rotas)
**Arquivo**: `backend/src/modules/fsm/teste.http`
**Documentação**: `backend/src/modules/fsm/README.md`

#### Technicians (3 rotas)
| Rota | Método | Descrição |
|------|--------|-----------|
| `/fsm/technicians` | GET | Listar técnicos |
| `/fsm/technicians` | POST | Criar técnico |
| `/fsm/technicians/:id` | PUT | Atualizar técnico |

#### Work Orders (5 rotas)
| Rota | Método | Descrição |
|------|--------|-----------|
| `/fsm/work-orders` | GET | Listar ordens |
| `/fsm/work-orders` | POST | Criar ordem |
| `/fsm/work-orders/:id` | GET | Obter ordem |
| `/fsm/work-orders/:id/start` | POST | Iniciar trabalho |
| `/fsm/work-orders/:id/complete` | POST | Completar trabalho |

#### Tasks (2 rotas)
| Rota | Método | Descrição |
|------|--------|-----------|
| `/fsm/tasks` | GET | Listar tarefas |
| `/fsm/tasks` | POST | Criar tarefa |

#### Checklists (1 rota)
| Rota | Método | Descrição |
|------|--------|-----------|
| `/fsm/checklists/:id` | PUT | Submeter checklist |

#### Time Tracking (2 rotas)
| Rota | Método | Descrição |
|------|--------|-----------|
| `/fsm/time-tracking` | GET | Listar tempos |
| `/fsm/time-tracking` | POST | Registrar tempo |

---

### 9️⃣ ERP - Inventário (2 rotas)
**Arquivo**: `backend/src/modules/erp/teste.http`
**Documentação**: `backend/src/modules/erp/README.md`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/erp/products` | GET | Listar produtos |
| `/erp/products` | POST | Criar produto |

---

### 1️⃣0️⃣ LEARNING - Learning Management System (10 rotas)
**Arquivo**: `backend/src/modules/learning/teste.http`
**Documentação**: `backend/src/modules/learning/README.md`

#### Learning Paths (3 rotas)
| Rota | Método | Descrição |
|------|--------|-----------|
| `/learning/paths` | GET | Listar caminhos |
| `/learning/paths` | POST | Criar caminho |
| `/learning/paths/:id` | GET | Obter caminho |

#### Enrollments (2 rotas)
| Rota | Método | Descrição |
|------|--------|-----------|
| `/learning/enrollments` | GET | Listar enrollments |
| `/learning/enrollments` | POST | Enrollar usuário |

#### Progress (1 rota)
| Rota | Método | Descrição |
|------|--------|-----------|
| `/learning/progress/:id` | GET | Obter progresso |

#### Skills (3 rotas)
| Rota | Método | Descrição |
|------|--------|-----------|
| `/learning/skills` | GET | Listar skills |
| `/learning/skills` | POST | Criar skill |
| `/learning/skills/:id` | PUT | Atualizar skill |

#### Plans (1 rota)
| Rota | Método | Descrição |
|------|--------|-----------|
| `/learning/plans/:id` | POST | Criar plano |

---

### 1️⃣1️⃣ NARRATIVE - IA Narrative (1 rota)
**Arquivo**: `backend/src/modules/narrative/teste.http`
**Documentação**: `backend/src/modules/narrative/README.md`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/narrative/generate` | POST | Gerar narrativa |

---

### 1️⃣2️⃣ JOBS - Recrutamento (10 rotas)
**Arquivo**: `backend/src/modules/jobs/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/jobs/postings` | GET | Listar vagas |
| `/jobs/postings` | POST | Criar vaga |
| `/jobs/applications` | GET | Listar candidaturas |
| `/jobs/applications` | POST | Candidatar |
| `/jobs/interviews` | POST | Agendar entrevista |
| ... | ... | ... |

---

### 1️⃣3️⃣ AUTOMATIONS - Workflows (13 rotas)
**Arquivo**: `backend/src/modules/automations/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/automations/workflows` | GET | Listar workflows |
| `/automations/workflows` | POST | Criar workflow |
| `/automations/executions` | GET | Listar execuções |
| ... | ... | ... |

---

### 1️⃣4️⃣ OMNICHANNEL - Multi-Canal (11 rotas)
**Arquivo**: `backend/src/modules/omnichannel/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/omnichannel/conversations` | GET | Listar conversas |
| `/omnichannel/conversations` | POST | Criar conversa |
| `/omnichannel/whatsapp` | POST | Enviar WhatsApp |
| ... | ... | ... |

---

### 1️⃣5️⃣ ANALYTICS - Dashboards (6 rotas)
**Arquivo**: `backend/src/modules/analytics/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/analytics/dashboard` | GET | Obter dashboard |
| `/analytics/timeseries` | GET | Dados em série temporal |
| `/analytics/pipeline` | GET | Status do pipeline |
| `/analytics/activity` | GET | Atividades recentes |
| `/analytics/export` | POST | Exportar dados |
| `/analytics/filters` | GET | Filtros disponíveis |

---

### 1️⃣6️⃣ NOTIFICATIONS - Notificações (4 rotas)
**Arquivo**: `backend/src/modules/notifications/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/notifications` | GET | Listar notificações |
| `/notifications/summary` | GET | Resumo de notificações |
| `/notifications/:id/read` | PUT | Marcar como lido |
| `/notifications/:id` | DELETE | Deletar notificação |

---

### 1️⃣7️⃣ CHAT - Chat Interno (7 rotas)
**Arquivo**: `backend/src/modules/chat/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/chat/channels` | GET | Listar canais |
| `/chat/channels` | POST | Criar canal |
| `/chat/messages` | GET | Listar mensagens |
| `/chat/messages` | POST | Enviar mensagem |
| `/chat/sentiment` | POST | Analisar sentimento |
| ... | ... | ... |

---

### 1️⃣8️⃣ FILES - Gerenciamento de Arquivos (6 rotas)
**Arquivo**: `backend/src/modules/files/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/files/upload` | POST | Upload de arquivo |
| `/files/:id/download` | GET | Download de arquivo |
| `/files/:id` | DELETE | Deletar arquivo |
| `/files/:id/avatar` | PUT | Atualizar avatar |
| ... | ... | ... |

---

### 1️⃣9️⃣ SETTINGS - Configurações (2 rotas)
**Arquivo**: `backend/src/modules/settings/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/settings` | GET | Obter configurações |
| `/settings` | PUT | Atualizar configurações |

---

### 2️⃣0️⃣ SEARCH - Busca (4 rotas)
**Arquivo**: `backend/src/modules/search/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/search` | GET | Buscar full-text |
| `/search/advanced` | POST | Busca avançada |
| `/search/filters` | GET | Filtros disponíveis |
| `/search/suggestions` | GET | Sugestões |

---

### 2️⃣1️⃣ WEBHOOKS - Webhooks (5 rotas)
**Arquivo**: `backend/src/modules/webhooks/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/webhooks` | GET | Listar webhooks |
| `/webhooks` | POST | Criar webhook |
| `/webhooks/:id` | DELETE | Remover webhook |
| `/webhooks/:id/test` | POST | Testar webhook |
| `/webhooks/events` | GET | Listar eventos |

---

### 2️⃣2️⃣ APIKEYS - API Keys (3 rotas)
**Arquivo**: `backend/src/modules/apikeys/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/apikeys` | GET | Listar chaves |
| `/apikeys` | POST | Criar chave |
| `/apikeys/:id` | DELETE | Revogar chave |

---

### 2️⃣3️⃣ KNOWLEDGE - Base de Conhecimento
**Arquivo**: `backend/src/modules/knowledge/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/knowledge/articles` | GET | Listar artigos |
| `/knowledge/articles` | POST | Criar artigo |
| `/knowledge/categories` | GET | Listar categorias |
| ... | ... | ... |

---

### 2️⃣4️⃣ AI - Serviços de IA (5 rotas)
**Arquivo**: `backend/src/modules/ai/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/ai/chat` | POST | Chat com IA |
| `/ai/rag` | POST | RAG (Retrieval) |
| `/ai/transcribe` | POST | Transcrição de áudio |
| `/ai/summarize` | POST | Resumir texto |
| `/ai/generate` | POST | Gerar conteúdo |

---

### 2️⃣5️⃣ DEDUPLICATION - Deduplicação (7 rotas)
**Arquivo**: `backend/src/modules/deduplication/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/dedup/analysis` | POST | Analisar duplicatas |
| `/dedup/merge` | POST | Mesclar registros |
| `/dedup/status` | GET | Status de dedup |
| ... | ... | ... |

---

### 2️⃣6️⃣ DASHBOARD - Dashboards Customizáveis (2 rotas)
**Arquivo**: `backend/src/modules/dashboard/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/dashboard` | GET | Obter dashboard |
| `/dashboard` | PUT | Customizar dashboard |

---

### 2️⃣7️⃣ SSO - Single Sign-On (4 rotas)
**Arquivo**: `backend/src/modules/sso/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/sso/google` | POST | Login Google |
| `/sso/github` | POST | Login GitHub |
| `/sso/microsoft` | POST | Login Microsoft |
| `/sso/callback` | POST | SSO Callback |

---

### 2️⃣8️⃣ MCP - Model Context Protocol (9 rotas)
**Arquivo**: `backend/src/modules/mcp/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/mcp/servers` | GET | Listar servidores |
| `/mcp/resources` | GET | Listar recursos |
| `/mcp/tools` | GET | Listar ferramentas |
| ... | ... | ... |

---

### 2️⃣9️⃣ SERVICES - Catálogo de Serviços (13 rotas)
**Arquivo**: `backend/src/modules/services/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/services/catalog` | GET | Catálogo de serviços |
| `/services/marketplace` | GET | Marketplace |
| `/services/orders` | GET | Listar pedidos |
| ... | ... | ... |

---

### 3️⃣0️⃣ PEOPLE-GROWTH - Desenvolvimento Pessoal (7 rotas)
**Arquivo**: `backend/src/modules/people-growth/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/people-growth/gaps` | GET | Identificar gaps |
| `/people-growth/team-report` | GET | Relatório de equipe |
| `/people-growth/plans` | GET | Planos de desenvolvimento |
| ... | ... | ... |

---

### 3️⃣1️⃣ GATEKEEPER - Controle de Acesso (2 rotas)
**Arquivo**: `backend/src/modules/gatekeeper/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/gatekeeper/check` | POST | Verificar acesso |
| `/gatekeeper/policies` | GET | Listar políticas |

---

### 3️⃣2️⃣ EMAIL-TEMPLATES - Templates de Email (3 rotas)
**Arquivo**: `backend/src/modules/email-templates/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/email-templates` | GET | Listar templates |
| `/email-templates` | POST | Criar template |
| `/email-templates/:id` | PUT | Atualizar template |

---

### 3️⃣3️⃣ FEEDBACK - Feedback (2 rotas)
**Arquivo**: `backend/src/modules/feedback/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/feedback` | GET | Listar feedback |
| `/feedback` | POST | Enviar feedback |

---

### 3️⃣4️⃣ PARTNERSHIPS - Parcerias (5 rotas)
**Arquivo**: `backend/src/modules/partnerships/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/partnerships` | GET | Listar parcerias |
| `/partnerships` | POST | Criar parceria |
| `/partnerships/:id` | PUT | Atualizar parceria |
| ... | ... | ... |

---

### 3️⃣5️⃣ ZETTELS - Zettelkasten (Variadas)
**Arquivo**: `backend/src/modules/zettels/teste.http`

| Rota | Método | Descrição |
|------|--------|-----------|
| `/zettels` | GET | Listar notas |
| `/zettels` | POST | Criar nota |
| `/zettels/:id` | PUT | Atualizar nota |
| `/zettels/:id/links` | GET | Links da nota |
| ... | ... | ... |

---

## 🎯 Rotas Mais Usadas

### Top 5 Rotas para Começar
1. **POST `/auth/login`** - Obter token (ESSENCIAL)
2. **GET `/crm/contacts`** - Listar contatos
3. **POST `/crm/contacts`** - Criar contato
4. **GET `/analytics/dashboard`** - Ver dashboard
5. **POST `/chat/messages`** - Enviar mensagem

### Rotas por Frequência de Uso
| Frequência | Rotas |
|-----------|-------|
| Diária | AUTH, CRM, ANALYTICS |
| Semanal | FSM, CMMS, LEARNING |
| Mensal | JOBS, PARTNERSHIPS, FEEDBACK |
| Ocasional | SYNC, AUTOMATIONS, AI |

---

## 🔗 Outras Rotas

### Rotas restantes:
- **AUDIT** (5 rotas) - `backend/src/modules/audit/teste.http`
- **RBAC** (4 rotas) - `backend/src/modules/rbac/teste.http`
- **SEARCH** (4 rotas) - `backend/src/modules/search/teste.http`
- **DEDUPLICATION** (7 rotas) - `backend/src/modules/deduplication/teste.http`
- ... (veja MODULES_DOCUMENTATION.md para lista completa)

---

## 💡 Dica Rápida

**Cada módulo tem seu próprio arquivo `teste.http`**

```
Procure por:        E execute:
backend/src/modules/crm/teste.http
backend/src/modules/cmms/teste.http
backend/src/modules/fsm/teste.http
... etc
```

**Todo arquivo tem:**
- GET requests (listar)
- POST requests (criar)
- PUT requests (atualizar)
- DELETE requests (remover)
- Variáveis configuráveis

---

## 🚀 Próximo Passo

1. Escolha um módulo acima
2. Vá para seu arquivo `teste.http`
3. Abra em VS Code com extensão REST Client
4. Clique em "Send Request"
5. Veja a resposta!

---

**Total de Rotas Documentadas**: 200+  
**Total de Módulos**: 40  
**Total de Arquivos de Teste**: 36  
**Status**: ✅ COMPLETO

*Última atualização: Janeiro 3, 2026*
