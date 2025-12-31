# Completo V2 - Visão Geral do Projeto

## 📖 Índice

- [Introdução](#introdução)
- [Escopo do Projeto](#escopo-do-projeto)
- [Objetivos e Propósito](#objetivos-e-propósito)
- [Arquitetura Geral](#arquitetura-geral)
- [Módulos e Funcionalidades](#módulos-e-funcionalidades)
- [Fluxos de Trabalho](#fluxos-de-trabalho)
- [Comportamento Esperado](#comportamento-esperado)

---

## 🎯 Introdução

**Completo V2** é uma **plataforma empresarial multi-tenant modular** que integra gestão de conhecimento, CRM, ERP, comunicação omnichannel, marketplace de vagas/serviços e uma rede colaborativa de parcerias entre empresas.

### Propósito

Criar um **ecossistema empresarial completo** onde:
1. Empresas gerenciam seus processos internos (CRM, ERP, RH)
2. Funcionários desenvolvem competências através de conhecimento estruturado (Zettels)
3. Empresas formam parcerias e compartilham recursos
4. Talentos circulam pela rede de parceiros
5. Serviços são trocados no marketplace interno

---

## 🎯 Escopo do Projeto

### O Que o Sistema FAZ

#### ✅ **Gestão de Conhecimento**
- Criar, editar e versionar "Zettels" (nós de conhecimento)
- Estabelecer links bidirecionais entre conceitos
- Buscar conhecimento via full-text search
- Sugerir conexões automáticas via AI
- Compartilhar conhecimento entre times

#### ✅ **CRM (Customer Relationship Management)**
- Gerenciar contatos e leads
- Rastrear pipeline de vendas (deals)
- Registrar interações com clientes
- Agendar atividades e tarefas
- Gerar relatórios de vendas

#### ✅ **ERP (Enterprise Resource Planning)**
- Cadastrar produtos e serviços
- Controlar estoque
- Emitir e rastrear faturas (invoices)
- Gerenciar despesas
- Controlar fornecedores
- Movimentações financeiras

#### ✅ **Omnichannel**
- Integrar WhatsApp Business API
- Gerenciar conversas unificadas
- Atribuir conversas a atendentes
- Criar respostas rápidas
- Monitorar SLA de atendimento

#### ✅ **Learning & Skills**
- Mapear competências necessárias
- Identificar gaps de conhecimento
- Criar trilhas de aprendizado
- Associar Zettels a skills
- Rastrear progresso individual

#### ✅ **Webhooks & Automations**
- Definir eventos customizados
- Criar webhooks para integrações externas
- Desenhar workflows visuais
- Automatizar processos repetitivos
- Logs e retry logic

#### ✅ **FSM (Field Service Management)**
- Gerenciar técnicos de campo
- Criar ordens de serviço
- Otimizar rotas
- Rastrear atendimentos
- Histórico de serviços

#### ✅ **CMMS + EAM (Manutenção e Ativos)**
- Cadastrar ativos da empresa
- Criar planos de manutenção
- Agendar manutenções preventivas
- Registrar manutenções corretivas
- Controlar peças de reposição
- Monitorar downtime de equipamentos

#### ✅ **MCP Servers (Model Context Protocol)**
- Registrar servidores MCP customizados
- Descobrir tools e resources
- Executar prompts contextualizados
- Integrar com AI agents

#### ✅ **Jobs & Services Marketplace**
- **Vagas (Jobs)**:
  - Criar vagas públicas (visíveis a TODOS, até sem login)
  - Criar vagas internas (apenas funcionários da empresa)
  - Criar vagas para parceiros (apenas empresas parceiras)
  - Vagas multi-tipo (combinações possíveis)
  - 2 modelos: specialized (requer comprovação) e non-specialized
  - Candidaturas e marcação de interesse
  - Sugestões AI de Zettels para desenvolvimento

- **Serviços (Services)**:
  - Empresas solicitam serviços
  - Propostas de empresas ou pessoas físicas
  - Preço fixo (sem negociação)
  - Taxa da plataforma configurável
  - Sistema de rating e avaliação
  - Controle de acesso baseado em parcerias

#### ✅ **Partnership Network (Rede de Parcerias)**
- Enviar convites de parceria entre empresas
- Aceitar/rejeitar convites
- Configurar permissões:
  - `shareJobs`: Compartilhar vagas para parceiros
  - `shareServices`: Compartilhar serviços
  - `shareResources`: Compartilhar funcionários/equipamentos
- Gerenciar parcerias ativas
- Terminar parcerias
- Filtros automáticos de acesso

---

## 🏗️ Arquitetura Geral

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                     CAMADA DE APRESENTAÇÃO                   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web UI     │  │  Mobile App  │  │   API Docs   │      │
│  │  (React +    │  │   (Future)   │  │  (Swagger)   │      │
│  │   Tailwind)  │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                         HTTPS/WSS
                            │
┌─────────────────────────────────────────────────────────────┐
│                      CAMADA DE APLICAÇÃO                     │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             API Gateway + Middleware                  │   │
│  │  • Authentication (JWT)                               │   │
│  │  • Authorization (RBAC)                               │   │
│  │  • Rate Limiting                                      │   │
│  │  • CORS                                               │   │
│  │  • Request Logging                                    │   │
│  │  • Tenant Isolation                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Module System                        │   │
│  │                                                        │   │
│  │  Core Modules:                                        │   │
│  │  • Auth        • Knowledge    • CRM        • ERP      │   │
│  │  • Chat        • Omnichannel  • Learning   • Skills   │   │
│  │  • AI          • Analytics    • Files                 │   │
│  │                                                        │   │
│  │  Extended Modules:                                    │   │
│  │  • Webhooks    • FSM          • CMMS       • MCP      │   │
│  │  • Jobs        • Services     • Partnerships          │   │
│  │  • Automations • Gatekeeper   • Narrative            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Core Services                        │   │
│  │  • Event Bus (Pub/Sub pattern)                        │   │
│  │  • Background Workers (Bull/BullMQ)                   │   │
│  │  • Cache Layer (Redis)                                │   │
│  │  • File Storage (S3/MinIO/Local)                      │   │
│  │  • Email Service (SMTP/SendGrid)                      │   │
│  │  • SMS Service (Twilio)                               │   │
│  │  • WebSocket Manager (Socket.IO)                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                      Prisma ORM
                            │
┌─────────────────────────────────────────────────────────────┐
│                      CAMADA DE DADOS                         │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 PostgreSQL Database                   │   │
│  │  • Multi-tenant (companyId isolation)                 │   │
│  │  • Row-Level Security (RLS)                           │   │
│  │  • Full-text search (tsvector)                        │   │
│  │  • JSONB for flexible schemas                         │   │
│  │  • Automated backups                                  │   │
│  │  • Read replicas (produção)                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Redis Cache                        │   │
│  │  • Session storage                                    │   │
│  │  • Rate limiting counters                             │   │
│  │  • Job queues (Bull)                                  │   │
│  │  • Real-time pub/sub                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Princípios Arquiteturais

1. **Modularidade**: Cada módulo é independente e pode ser ativado/desativado
2. **Multi-tenancy**: Isolamento total de dados por empresa (companyId)
3. **Event-Driven**: Comunicação via Event Bus para desacoplamento
4. **API-First**: Todas as funcionalidades expostas via REST API
5. **Type-Safe**: TypeScript end-to-end para segurança de tipos
6. **Scalable**: Horizontal scaling via load balancers
7. **Real-time**: WebSocket para atualizações em tempo real
8. **Resilient**: Retry logic, circuit breakers, graceful degradation

---

## 📦 Módulos e Funcionalidades

### Mapa de Módulos

```
┌──────────────────────────────────────────────────────────────┐
│                       CORE MODULES                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │  Auth   │  │  Users  │  │ Company │  │  RBAC   │         │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE & LEARNING                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Zettelkasten│  │    Skills    │  │   Learning   │       │
│  │  (Knowledge) │  │  (Mapping)   │  │    Paths     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    BUSINESS OPERATIONS                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │     CRM      │  │     ERP      │  │   Analytics  │       │
│  │ (Customers)  │  │ (Resources)  │  │  (Reports)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     COMMUNICATION                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │     Chat     │  │ Omnichannel  │  │Notifications │       │
│  │  (Internal)  │  │ (External)   │  │   (Push)     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   AUTOMATION & INTEGRATION                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Webhooks   │  │  Workflows   │  │  MCP Servers │       │
│  │   (Events)   │  │(Automation)  │  │   (AI Ctx)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   FIELD & ASSET MANAGEMENT                    │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │     FSM      │  │  CMMS + EAM  │                          │
│  │(Field Svc)   │  │(Maintenance) │                          │
│  └──────────────┘  └──────────────┘                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  MARKETPLACE & PARTNERSHIPS                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │     Jobs     │  │   Services   │  │ Partnerships │       │
│  │   (Vagas)    │  │ (Marketplace)│  │  (Network)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxos de Trabalho Principais

### 1. Fluxo de Conhecimento (Zettelkasten)

```
[Funcionário] cria Zettel
       ↓
[Sistema] sugere links com Zettels existentes (AI)
       ↓
[Funcionário] aceita/cria links
       ↓
[Sistema] atualiza grafo de conhecimento
       ↓
[Outros funcionários] descobrem via busca/navegação
```

### 2. Fluxo de Vaga (Job Posting)

```
[Admin Empresa] cria vaga
       ↓
Define tipos: [public] | [internal] | [partners]
       ↓
Define modelo: [specialized] | [non-specialized]
       ↓
[Sistema] aplica regras de acesso:
  • public → TODOS (até sem login)
  • internal → Funcionários da empresa
  • partners → Funcionários de empresas parceiras
       ↓
[Candidato] visualiza vaga
       ↓
[Sistema] analisa skills gaps (AI)
       ↓
[Sistema] sugere Zettels para estudo
       ↓
[Candidato] se candidata ou marca interesse
       ↓
[Admin Empresa] revisa candidaturas
       ↓
[Admin Empresa] aprova/rejeita
```

### 3. Fluxo de Parceria

```
[Empresa A] envia convite para [Empresa B]
       ↓
Define permissões:
  • shareJobs: true/false
  • shareServices: true/false
  • shareResources: true/false
       ↓
[Empresa B] recebe convite
       ↓
[Empresa B] aceita → [Sistema] cria Partnership
       ↓
[Sistema] aplica filtros automáticos:
  • Vagas "partners" de A visíveis para B
  • Serviços de A visíveis para B (se shareServices)
       ↓
[Funcionários] automaticamente veem conteúdo compartilhado
```

### 4. Fluxo de Serviço (Service Request)

```
[Empresa A] cria solicitação de serviço
       ↓
Define orçamento fixo
       ↓
Define quem pode propor: [companies] | [individuals]
       ↓
[Sistema] aplica acesso:
  • Empresa A vê
  • Parceiros de A com shareServices veem
       ↓
[Empresa B/Pessoa] submete proposta
       ↓
[Empresa A] aceita proposta
       ↓
[Sistema] calcula taxa da plataforma
       ↓
[Sistema] cria transação
       ↓
[Empresa B/Pessoa] entrega serviço
       ↓
[Empresa B/Pessoa] marca como completo
       ↓
[Empresa A] avalia (rating)
       ↓
[Sistema] processa pagamento
```

---

## ⚙️ Comportamento Esperado do Sistema

### 1. Autenticação e Autorização

#### Login
```
POST /api/v1/auth/login
{
  "email": "user@company.com",
  "password": "***"
}

Resposta:
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "companyId": "company-uuid",
    "role": "admin_empresa",
    "name": "João Silva"
  }
}
```

- Token JWT válido por 24h
- Token deve ser enviado em todas as requisições: `Authorization: Bearer {token}`
- Sistema invalida token ao fazer logout

#### Autorização (RBAC)

| Recurso | DEV | admin | admin_empresa | cliente |
|---------|-----|-------|---------------|---------|
| Todas empresas | ✅ | ✅ | ❌ | ❌ |
| Própria empresa | ✅ | ✅ | ✅ | ✅ |
| Criar usuários | ✅ | ✅ | ✅ | ❌ |
| Ver todos Zettels | ✅ | ✅ | ❌ | ❌ |
| Configurar taxa serviço | ✅ | ✅ | ❌ | ❌ |
| Criar vagas | ✅ | ✅ | ✅ | ❌ |
| Candidatar-se | ✅ | ✅ | ✅ | ✅ |
| Criar parcerias | ✅ | ✅ | ✅ | ❌ |

### 2. Multi-Tenancy (Isolamento por Empresa)

**Regra Fundamental**: TODOS os dados devem ser filtrados por `companyId`

```typescript
// ❌ ERRADO - Sem filtro de empresa
const jobs = await prisma.job.findMany();

// ✅ CORRETO - Com filtro de empresa
const jobs = await prisma.job.findMany({
  where: { companyId: user.companyId }
});
```

**Exceções**:
- Jobs públicos (type="public") são visíveis a todos
- Jobs para parceiros são visíveis às empresas parceiras
- DEV e admin veem tudo

### 3. Acesso a Vagas (Jobs)

#### Sem Autenticação
```
GET /api/v1/jobs
→ Retorna APENAS vagas com types contendo "public"
```

#### Com Autenticação (Usuário da Empresa A)
```
GET /api/v1/jobs
→ Retorna:
  • Vagas públicas (types = "public") de TODAS empresas
  • Vagas internas (types = "internal") da Empresa A
  • Vagas para parceiros (types = "partners") de empresas parceiras de A
```

#### Multi-Tipo
```
Job: { types: ["public", "internal"] }
→ Vaga é visível para:
  • Qualquer pessoa (public)
  • Funcionários da empresa (internal)
```

### 4. Acesso a Serviços

#### Usuário da Empresa A (sem parcerias)
```
GET /api/v1/services
→ Retorna APENAS serviços da Empresa A
```

#### Usuário da Empresa A (com parceria com B e C)
```
Parcerias:
- A ↔ B (shareServices: true)
- A ↔ C (shareServices: false)

GET /api/v1/services
→ Retorna:
  • Serviços da Empresa A
  • Serviços da Empresa B (porque shareServices = true)
  • NÃO retorna serviços de C (shareServices = false)
```

### 5. Sistema de Parcerias

#### Fluxo de Convite

```
1. Empresa A envia convite
POST /api/v1/partnerships/invites
{
  "toCompanyId": "empresa-b-id",
  "message": "Vamos formar parceria!",
  "shareJobs": true,
  "shareServices": true,
  "shareResources": false
}

2. Empresa B recebe e aceita
PATCH /api/v1/partnerships/invites/{invite-id}/accept

3. Sistema cria Partnership automaticamente
Partnership {
  companyAId: "empresa-a-id",
  companyBId: "empresa-b-id",
  shareJobs: true,
  shareServices: true,
  shareResources: false,
  status: "active"
}

4. Filtros automáticos aplicados imediatamente:
- Funcionários de A veem vagas "partners" de B
- Funcionários de B veem vagas "partners" de A
- Funcionários de A veem serviços de B
- Funcionários de B veem serviços de A
```

### 6. Sugestões AI (Zettel Suggestions)

Quando usuário visualiza uma vaga:

```
GET /api/v1/jobs/{job-id}/suggestions

Sistema:
1. Analisa skills requeridas da vaga
2. Compara com skills do usuário
3. Identifica gaps
4. Busca Zettels relacionados às skills faltantes
5. Retorna sugestões de estudo

Resposta:
{
  "skillGaps": [
    { "skill": "React", "level": "Advanced", "userLevel": "Intermediate" }
  ],
  "suggestedZettels": [
    { "zettelId": "uuid", "title": "React Hooks Avançados", "relevance": 0.95 }
  ],
  "learningPath": [...],
  "estimatedTime": 40 // horas
}
```

### 7. Transações de Serviço (Taxa da Plataforma)

```
Serviço: Budget = R$ 1.000,00
Config Sistema: serviceFeePercentage = 10%, minFee = R$ 5, maxFee = R$ 500

Cálculo:
fee = 1000 * 0.10 = R$ 100
if (fee < minFee) fee = minFee     → não se aplica
if (fee > maxFee) fee = maxFee     → não se aplica

Total = 1000 + 100 = R$ 1.100,00

ServiceTransaction {
  serviceAmount: 1000,
  serviceFee: 100,
  totalAmount: 1100,
  paymentStatus: "pending"
}
```

---

## 🎭 Casos de Uso Principais

### Caso de Uso 1: Empresa Quer Contratar Desenvolvedor React

```
1. Admin cria vaga tipo "public" + "internal"
2. Vaga aparece para:
   - TODOS na internet (public)
   - Funcionários da empresa (internal)

3. Candidato externo (sem login) vê a vaga
4. Candidato cria conta
5. Candidato se candidata
6. Sistema analisa skills → falta "React Hooks Avançados"
7. Sistema sugere Zettel "React Hooks na Prática"
8. Candidato estuda
9. Candidato é aprovado
```

### Caso de Uso 2: Empresas Formam Parceria para Compartilhar Talentos

```
1. Empresa A (tech) e Empresa B (marketing) formam parceria
2. Configuram: shareJobs = true
3. Empresa A cria vaga "React Developer" tipo "partners"
4. Funcionário de B vê a vaga
5. Funcionário de B se candidata
6. Empresa A aprova
7. Funcionário de B passa a trabalhar também para A (via parceria)
```

### Caso de Uso 3: Marketplace de Serviços

```
1. Empresa A precisa de "Design de Logo"
2. Cria serviço: budget = R$ 500, allowIndividuals = true
3. Designer freelancer vê o serviço
4. Designer propõe realizar por R$ 500
5. Empresa A aceita
6. Sistema calcula taxa: R$ 50 (10%)
7. Designer entrega logo
8. Designer marca como completo
9. Empresa A avalia: 5 estrelas
10. Sistema processa pagamento: R$ 500 - R$ 50 = R$ 450 para designer
```

---

## 📈 Métricas e KPIs

### Métricas do Sistema

- **Usuários ativos** (DAU/MAU)
- **Empresas cadastradas**
- **Parcerias ativas**
- **Vagas publicadas**
- **Candidaturas processadas**
- **Serviços concluídos**
- **Taxa de conversão** (candidatura → aprovação)
- **NPS** (Net Promoter Score)
- **Tempo médio de resposta** da API
- **Uptime** do sistema

### Dashboards

Cada empresa tem acesso a:
- **Dashboard CRM**: Pipeline, conversões, ROI
- **Dashboard ERP**: Receitas, despesas, fluxo de caixa
- **Dashboard Jobs**: Vagas abertas, candidaturas, tempo de preenchimento
- **Dashboard Partnerships**: Número de parceiros, vagas/serviços compartilhados
- **Dashboard Learning**: Skills gaps, progresso de treinamentos

---

**Próximas Seções**:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detalhes técnicos da arquitetura
- [API_DOCS.md](./API_DOCS.md) - Documentação completa da API
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Esquema completo do banco
- [MODULE_DEVELOPMENT.md](./MODULE_DEVELOPMENT.md) - Como criar novos módulos
