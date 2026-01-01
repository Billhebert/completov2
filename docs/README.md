# 🚀 OMNI Platform

**Plataforma modular e multi-tenant para atendimento inteligente omnichannel com automação, CRM/ERP e camada cognitiva (Zettelkasten + RAG + agentes).**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-brightgreen)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📚 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#️-arquitetura)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Configuração](#️-configuração)
- [Uso](#-uso)
- [API Documentation](#-api-documentation)
- [Módulos](#-módulos)
- [Contribuindo](#-contribuindo)

---

## 🎯 Visão Geral

O **OMNI Platform** é uma solução completa que combina:

- **Omnichannel**: WhatsApp, Instagram, Facebook, Email, Chat Web
- **CRM & ERP**: Gestão completa de clientes, vendas e operações
- **IA & Automação**: Workflows inteligentes com Gatekeeper para controle de atenção
- **Zettelkasten Inteligente**: Sistema de conhecimento que auto-cria e conecta informações
- **People Growth**: Detecção automática de gaps e desenvolvimento de equipe
- **Simulações**: Treinamento com IA em cenários realistas

### Princípios

✅ **Modularidade** - Core + plugins ativáveis
✅ **Multi-tenant** - Isolamento total por empresa
✅ **Event-driven** - Tudo acontece via eventos
✅ **IA LLM-agnostic** - Suporta OpenAI, Ollama e outros
✅ **RBAC** - Controle granular de permissões
✅ **Governança** - Gatekeeper controla autonomia e atenção

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      API REST + WebSocket                    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      GATEKEEPER AGENT                        │
│  (Controla quando o sistema deve agir/sugerir/silenciar)    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌───────────────┬──────────────┬──────────────┬───────────────┐
│   CURATOR     │   WORKFLOW   │  TRUTH LAYER │ PEOPLE GROWTH │
│ (Auto-cria    │   ENGINE     │  (Conflitos  │  (Detecta     │
│  Zettels)     │  (Automações)│   & Decay)   │   Gaps)       │
└───────────────┴──────────────┴──────────────┴───────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       EVENT BUS (Redis)                      │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌────────┬────────┬────────┬────────┬────────┬────────┬───────┐
│  Auth  │  Chat  │  CRM   │  ERP   │   AI   │ Omni   │ Sync  │
└────────┴────────┴────────┴────────┴────────┴────────┴───────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL │ Redis │ Qdrant (Vector DB) │ MinIO (S3)     │
└─────────────────────────────────────────────────────────────┘
```

### Event Flow

```
1. conversation.created →
   ├─> Curator cria Zettel.CLIENT + Zettel.NEGOTIATION
   ├─> Workflows verificam triggers
   └─> Analytics registra evento

2. message.received →
   ├─> Curator detecta compromissos → cria Zettel.TASK
   ├─> IA analisa sentimento
   └─> Gatekeeper decide se notifica usuário

3. interaction.created →
   ├─> Curator atualiza Zettel.CLIENT
   ├─> People Growth detecta gaps
   └─> Atualiza métricas

4. deal.won/lost →
   ├─> Curator cria Zettel.LEARNING
   ├─> People Growth analisa performance
   └─> Analytics atualiza pipeline
```

---

## ✨ Funcionalidades

### 🛡️ 1. Gatekeeper Agent (Atenção & Autonomia)

O **Gatekeeper** é o cérebro que decide quando o sistema deve:
- ✅ **EXECUTE**: Executar ação imediatamente
- 💡 **SUGGEST**: Sugerir para usuário aprovar
- 📝 **LOG_ONLY**: Apenas logar, sem notificar
- 🚫 **BLOCK**: Bloquear ação

**Hierarquia de Políticas:**
1. Company Policy (obrigatória)
2. Team Policy (opcional)
3. User Preferences (quiet hours, canais)
4. Context (VIP list, urgência)
5. Anti-spam Score

**Exemplo de uso:**
```typescript
const decision = await gatekeeper.shouldExecute({
  userId: 'user-123',
  companyId: 'company-456',
  action: 'send_notification',
  context: { type: 'follow_up', urgency: 'medium' }
});

if (decision.decision === 'EXECUTE') {
  await sendNotification();
}
```

---

### 🧠 2. Zettelkasten Inteligente (Segundo Cérebro)

Sistema que **auto-cria conhecimento** a partir de eventos:

| Evento | Zettel Criado | Ação |
|--------|--------------|------|
| `conversation.created` | CLIENT + NEGOTIATION | Links automáticos |
| `message.received` | TASK (se compromisso detectado) | Reminder automático |
| `deal.won/lost` | LEARNING (lições aprendidas) | Análise com IA |
| `interaction.created` | Atualiza CLIENT | Histórico unificado |

**Tipos de Zettel:**
- `CLIENT` - Perfil de cliente
- `NEGOTIATION` - Negociação ativa
- `TASK` - Tarefa/compromisso
- `SOP` - Procedimento padrão
- `PLAYBOOK` - Guia de vendas
- `LEARNING` - Lição aprendida
- `DECISION` - Decisão tomada
- `RCA` - Root Cause Analysis

---

### ⚙️ 3. Workflow Engine (Automações)

Crie workflows visuais com:
- **Triggers**: eventos, cron, webhooks
- **Conditions**: if/switch
- **Actions**: create_zettel, send_notification, update_contact, etc
- **Delays**: pausas programadas

**Exemplo de Workflow:**
```json
{
  "name": "Auto-criar Zettel de Negociação",
  "trigger": { "event": "conversation.created" },
  "actions": [
    {
      "type": "create_zettel",
      "params": {
        "title": "Negociação - {{trigger.data.contactName}}",
        "nodeType": "NEGOTIATION"
      }
    }
  ]
}
```

---

### 👥 4. People Growth (Desenvolvimento de Equipe)

**Detecção automática de gaps** a partir de:
- Interações com clientes (análise com IA)
- Simulações (avaliação por rubrica)
- Avaliações de performance

**Domains:**
- `COMMERCIAL` - Vendas, negociação
- `TECHNICAL` - Conhecimento técnico
- `MANAGEMENT` - Gestão, liderança
- `SOFT_SKILLS` - Comunicação, empatia

**Dashboard:**
- Gaps por pessoa/time
- Heatmap por domínio
- Sugestões de learning paths
- Trilhas de desenvolvimento

---

### 🎭 5. Simulation Engine (Treinamento)

Treine sua equipe com **personas de IA**:

**Tipos de Simulação:**
- `NEGOTIATION` - Negociação de vendas
- `OBJECTION` - Tratamento de objeções
- `TECHNICAL` - Suporte técnico
- `CRISIS` - Gestão de crise
- `ONBOARDING` - Onboarding de cliente

**Avaliação Automática:**
- Score 0-100
- Pontos fortes
- Pontos de melhoria
- Gaps detectados automaticamente
- Zettel.LEARNING criado

---

### 🎯 6. Truth Layer (Fonte da Verdade)

Mantém conhecimento **correto e atual**:

- **Conflict Detection**: IA detecta contradições entre Zettels
- **Freshness Score**: Decaimento temporal (0-1)
- **Review Workflow**: Lembretes quando conhecimento fica desatualizado
- **Source of Truth**: Marca conhecimento oficial

**Status:**
- `DRAFT` - Rascunho
- `ACTIVE` - Ativo
- `SOURCE_OF_TRUTH` - Fonte oficial
- `OUTDATED` - Desatualizado
- `CONFLICTING` - Em conflito
- `ARCHIVED` - Arquivado

---

### 📖 7. Narrative Engine

Gera **narrativas compreensíveis** a partir de Zettels:

**Formatos:**
- `summary` - Resumo executivo
- `timeline` - Linha do tempo
- `lessons` - Lições aprendidas
- `risks` - Riscos e decisões

**Uso:**
```bash
POST /api/v1/narrative/generate
{
  "type": "client",
  "entityId": "contact-123",
  "format": "summary",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

---

## 🔧 Tecnologias

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript (strict mode)
- **Framework**: Express.js
- **ORM**: Prisma 5.22

### Database & Storage
- **Primary DB**: PostgreSQL 15
- **Cache**: Redis 7
- **Vector DB**: Qdrant (para RAG/semantic search)
- **Object Storage**: MinIO (S3-compatible)

### AI & ML
- **LLM**: OpenAI GPT-4 (ou Ollama local)
- **Vector Search**: Qdrant
- **Embeddings**: OpenAI text-embedding-ada-002

### Real-time & Workers
- **WebSockets**: Socket.IO 4.8
- **Job Queue**: BullMQ 5.21 (Redis-backed)
- **Cron Jobs**: node-cron 3.0

### Monitoring
- **Logs**: Pino (structured logging)
- **Metrics**: Prometheus (prom-client)
- **Dashboards**: Grafana

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15 (ou via Docker)
- Redis 7 (ou via Docker)

### 1. Clone o repositório

```bash
git clone https://github.com/yourusername/omni-platform.git
cd omni-platform
```

### 2. Instale dependências

```bash
npm install
```

### 3. Configure variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` e configure:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - Sua chave da OpenAI (opcional para testes)
- Outras variáveis conforme necessário

### 4. Suba os serviços com Docker

```bash
docker-compose up -d
```

Isso vai iniciar:
- PostgreSQL (porta 5432)
- Redis (porta 6379)
- Qdrant (porta 6333)
- MinIO (portas 9000, 9001)

### 5. Execute as migrations

```bash
npm run db:generate
npm run db:migrate
```

### 6. (Opcional) Popule com dados de exemplo

```bash
npx tsx prisma/seed-complete.ts
```

Isso cria:
- 1 empresa demo
- 2 usuários (admin@demo.com / agent@demo.com)
- Workflows de exemplo
- Cenários de simulação
- SOPs e Playbooks

### 7. Inicie o servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

Servidor rodando em: **http://localhost:3000**

---

## ⚙️ Configuração

### Variáveis de Ambiente Principais

```env
# App
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/omni_platform"

# JWT
JWT_SECRET="seu-secret-super-seguro-min-32-chars"
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

---

## 🎮 Uso

### Login

```bash
POST /api/v1/auth/login
{
  "email": "admin@demo.com",
  "password": "admin123"
}
```

Resposta:
```json
{
  "user": { "id": "...", "name": "Admin User", "role": "company_admin" },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Usar o token

Adicione header em todas as requisições:
```
Authorization: Bearer eyJhbGc...
```

### Exemplos de API

#### Criar Workflow

```bash
POST /api/v1/automations/workflows
{
  "name": "Meu Workflow",
  "description": "Descrição",
  "definition": {
    "nodes": [...],
    "edges": [...]
  }
}
```

#### Listar Gaps (People Growth)

```bash
GET /api/v1/people-growth/gaps?status=OPEN
```

#### Iniciar Simulação

```bash
POST /api/v1/simulation/start
{
  "scenarioId": "scenario-123"
}
```

#### Criar Reminder Manual

```bash
POST /api/v1/knowledge/reminders
{
  "nodeId": "node-456",
  "type": "FOLLOW_UP",
  "scheduledFor": "2024-12-31T10:00:00Z",
  "message": "Lembrete de follow-up"
}
```

---

## 📖 API Documentation

### Endpoints Principais

#### Auth & Users
- `POST /api/v1/auth/register` - Registrar empresa
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Usuário atual
- `POST /api/v1/auth/refresh` - Refresh token

#### Gatekeeper
- `GET /api/v1/gatekeeper/profile` - Meu perfil de atenção
- `PATCH /api/v1/gatekeeper/profile` - Atualizar perfil
- `GET /api/v1/gatekeeper/policy` - Política da empresa (admin)
- `GET /api/v1/gatekeeper/logs` - Logs de decisões

#### Automations
- `GET /api/v1/automations/workflows` - Listar workflows
- `POST /api/v1/automations/workflows` - Criar workflow
- `POST /api/v1/automations/workflows/:id/activate` - Ativar
- `GET /api/v1/automations/executions` - Histórico

#### Knowledge (Zettelkasten)
- `GET /api/v1/knowledge/nodes` - Listar zettels
- `POST /api/v1/knowledge/nodes` - Criar zettel
- `GET /api/v1/knowledge/reminders` - Meus lembretes
- `GET /api/v1/knowledge/truth/conflicts` - Ver conflitos
- `POST /api/v1/knowledge/truth/resolve` - Resolver conflito

#### People Growth
- `GET /api/v1/people-growth/gaps` - Meus gaps
- `GET /api/v1/people-growth/team/report` - Relatório do time
- `POST /api/v1/people-growth/gaps/:id/close` - Fechar gap

#### Simulation
- `GET /api/v1/simulation/scenarios` - Cenários disponíveis
- `POST /api/v1/simulation/start` - Iniciar simulação
- `POST /api/v1/simulation/:id/message` - Enviar mensagem
- `POST /api/v1/simulation/:id/end` - Finalizar e avaliar

#### Narrative
- `POST /api/v1/narrative/generate` - Gerar narrativa

#### CRM
- `GET /api/v1/crm/contacts` - Listar contatos
- `POST /api/v1/crm/contacts` - Criar contato
- `GET /api/v1/crm/deals` - Listar deals

---

## 🧩 Módulos

### Core Modules (obrigatórios)
1. **Auth** - Autenticação, 2FA, RBAC
2. **Chat** - Chat interno, real-time
3. **Omnichannel** - WhatsApp, Instagram, etc
4. **AI/RAG** - IA, semantic search
5. **Notifications** - Email, push, in-app
6. **Analytics** - Métricas, dashboards
7. **Gatekeeper** - Controle de atenção

### Plugin Modules (opcionais)
8. **CRM** - Gestão de clientes e vendas
9. **ERP** - Produtos, estoque, financeiro
10. **Automations** - Workflow engine
11. **Knowledge** - Zettelkasten inteligente
12. **People Growth** - Desenvolvimento de equipe
13. **Simulation** - Treinamento com IA
14. **Narrative** - Geração de histórias
15. **Sync** - Integrações (Salesforce, HubSpot, etc)

---

## 🧪 Testes

```bash
# Testes unitários
npm test

# Com coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 🚀 Deploy

### Docker

```bash
# Build
docker build -t omni-platform .

# Run
docker run -p 3000:3000 --env-file .env omni-platform
```

### Docker Compose (Produção)

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/amazing`)
3. Commit suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Suporte

- 📧 Email: support@omniplatform.com
- 💬 Discord: [Entrar no servidor](https://discord.gg/omni)
- 📚 Docs: [docs.omniplatform.com](https://docs.omniplatform.com)

---

**Desenvolvido com ❤️ pela equipe OMNI Platform**
