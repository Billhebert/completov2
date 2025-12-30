# 🎯 PLANO DE IMPLEMENTAÇÃO COMPLETO
## OMNI Platform - Completar Funcionalidades Faltantes

**Data**: 2025-12-30
**Status do Projeto**: Backend 95% completo
**Objetivo**: Implementar 100% das funcionalidades da especificação

---

## 📊 RESUMO EXECUTIVO

### O que já existe (✅):
- Auth & Multi-tenant (JWT, 2FA, RBAC)
- Chat Interno (WebSocket, real-time)
- Omnichannel (WhatsApp, conversas)
- AI/RAG (Qdrant, OpenAI, Ollama)
- CRM completo (contacts, deals, interactions)
- ERP completo (products, invoices, expenses)
- Integrações (Salesforce, HubSpot, RD Station, Pipefy)
- Analytics & Métricas
- Files & Storage (MinIO)
- Audit & Logs

### O que falta implementar (❌):
1. **Automations/Workflow Engine** - 0%
2. **Zettelkasten Inteligente (auto-criação)** - 50%
3. **Gatekeeper Agent** - 0%
4. **Cognitive OS (Truth Layer, People Growth)** - 0%
5. **Configurações de Atenção** - 0%
6. **Narrative Engine** - 0%
7. **Simulation Engine** - 0%
8. **Event Bus completo** - 50%

---

# 🚀 MÓDULOS DE IMPLEMENTAÇÃO

---

## MÓDULO 1: AUTOMATIONS & WORKFLOW ENGINE

### Objetivo:
Criar um sistema de automações visual (tipo n8n/Zapier) que execute workflows baseados em triggers, conditions e actions.

### Escopo:

#### 1.1 Database Schema (Prisma)
Criar modelos:
```prisma
model Workflow {
  id          String   @id @default(cuid())
  companyId   String
  name        String
  description String?
  version     Int      @default(1)
  status      WorkflowStatus @default(DRAFT)
  definition  Json     // nodes + edges
  createdBy   String
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())

  company     Company  @relation(fields: [companyId], references: [id])
  executions  WorkflowExecution[]

  @@index([companyId, status])
}

model WorkflowExecution {
  id          String   @id @default(cuid())
  workflowId  String
  status      ExecutionStatus
  startedAt   DateTime
  finishedAt  DateTime?
  context     Json
  logs        Json[]
  error       String?

  workflow    Workflow @relation(fields: [workflowId], references: [id])

  @@index([workflowId, status])
}

enum WorkflowStatus {
  DRAFT
  ACTIVE
  PAUSED
  ARCHIVED
}

enum ExecutionStatus {
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}
```

#### 1.2 Workflow Nodes (tipos de nós)
Implementar:
- **Triggers**:
  - `event` (conversation.created, message.received, deal.stage_changed)
  - `time.cron` (agendamento)
  - `webhook` (HTTP trigger)

- **Conditions**:
  - `if` (comparações)
  - `switch` (múltiplos casos)
  - `filter` (arrays)

- **Actions**:
  - `create_zettel`
  - `send_notification`
  - `update_contact`
  - `create_task`
  - `call_webhook`
  - `delay`
  - `loop`

#### 1.3 Workflow Engine (executor)
Arquivos a criar:
- `/src/modules/automations/engine/executor.ts`
- `/src/modules/automations/engine/node-runners/`
- `/src/modules/automations/engine/context.ts`

Lógica:
- Recebe workflow + contexto
- Executa nós em ordem (graph traversal)
- Passa pelo Gatekeeper antes de ações externas
- Logs detalhados por nó
- Retry em caso de falha
- Timeout por execução

#### 1.4 API Endpoints
```typescript
POST   /api/v1/automations/workflows          // Criar workflow
GET    /api/v1/automations/workflows          // Listar
GET    /api/v1/automations/workflows/:id      // Detalhes
PATCH  /api/v1/automations/workflows/:id      // Atualizar
DELETE /api/v1/automations/workflows/:id      // Deletar
POST   /api/v1/automations/workflows/:id/activate   // Ativar
POST   /api/v1/automations/workflows/:id/pause      // Pausar
POST   /api/v1/automations/workflows/:id/test       // Testar
GET    /api/v1/automations/executions         // Histórico de execuções
GET    /api/v1/automations/executions/:id/logs // Logs detalhados
```

#### 1.5 Integração com Event Bus
- Registrar listeners para todos os eventos do sistema
- Disparar workflows quando trigger match
- Queue execution via BullMQ

#### 1.6 Permissões (RBAC)
- `automations:create` - Criar workflows
- `automations:edit` - Editar
- `automations:activate` - Ativar/pausar
- `automations:delete` - Deletar
- `automations:view_logs` - Ver logs

---

## MÓDULO 2: ZETTELKASTEN INTELIGENTE (Auto-criação)

### Objetivo:
Transformar o Knowledge Graph existente em um sistema vivo que auto-cria e auto-conecta zettels a partir de eventos.

### Escopo:

#### 2.1 Extender Schema (tipos de Zettel)
Adicionar tipos específicos ao `KnowledgeNode.type`:
```typescript
enum KnowledgeNodeType {
  // Existentes
  ZETTEL
  DOCUMENTATION
  PROCEDURE
  REFERENCE
  INSIGHT

  // NOVOS
  NEGOTIATION      // Negociação com cliente
  CLIENT           // Perfil de cliente
  PROJECT          // Projeto/OS
  DECISION         // Decisão tomada
  TASK             // Tarefa/NextAction
  SOP              // Standard Operating Procedure
  PLAYBOOK         // Playbook de vendas/atendimento
  LEARNING         // Aprendizado/lição
  GAP              // Gap de conhecimento
  RCA              // Root Cause Analysis
  CAUSE            // Causa
  EFFECT           // Efeito
  DOCUMENT         // Documento externo
}
```

Adicionar campos:
```prisma
model KnowledgeNode {
  // ... campos existentes

  // NOVOS
  sourceType      String?         // "conversation", "message", "deal", "file"
  sourceId        String?         // ID da fonte
  assigneeId      String?         // Responsável
  dueDate         DateTime?       // Para TASK
  priority        Priority?       // Para TASK
  truthStatus     TruthStatus?    // Para Truth Layer
  freshnessScore  Float?          // Score de atualidade (0-1)
  reviewedAt      DateTime?       // Última revisão

  assignee        User?           @relation(fields: [assigneeId], references: [id])
  reminders       Reminder[]
}

model Reminder {
  id              String   @id @default(cuid())
  companyId       String
  nodeId          String
  userId          String
  type            ReminderType
  scheduledFor    DateTime
  status          ReminderStatus @default(PENDING)
  message         String
  createdAt       DateTime @default(now())

  company         Company  @relation(fields: [companyId], references: [id])
  node            KnowledgeNode @relation(fields: [nodeId], references: [id])
  user            User     @relation(fields: [userId], references: [id])

  @@index([scheduledFor, status])
  @@index([userId, status])
}

enum TruthStatus {
  DRAFT           // Rascunho
  ACTIVE          // Ativo
  SOURCE_OF_TRUTH // Fonte da verdade
  OUTDATED        // Desatualizado
  CONFLICTING     // Conflitante
  ARCHIVED        // Arquivado
}

enum ReminderType {
  FOLLOW_UP       // Follow-up com cliente
  TASK_DUE        // Tarefa vencendo
  REVIEW_REQUIRED // Revisão necessária
  COMMITMENT      // Compromisso assumido
}

enum ReminderStatus {
  PENDING
  SENT
  SNOOZED
  DISMISSED
  COMPLETED
}
```

#### 2.2 Auto-criação de Zettels (Curator Service)
Criar serviço: `/src/modules/knowledge/curator.service.ts`

Regras de auto-criação:

**1. conversation.created**
```typescript
// Cria/atualiza Zettel.CLIENT
{
  type: "CLIENT",
  title: contact.name,
  content: "Perfil do cliente...",
  sourceType: "conversation",
  sourceId: conversation.id,
  entities: { contactId: conversation.contactId }
}

// Cria Zettel.NEGOTIATION
{
  type: "NEGOTIATION",
  title: `Negociação ${contact.name} - ${date}`,
  content: "Resumo da negociação...",
  links: [zettel_client_id]
}
```

**2. message.received (AI analisa)**
```typescript
// Detecta compromissos/tarefas
if (messageHasCommitment) {
  createZettel({
    type: "TASK",
    title: "Follow-up com {cliente}",
    assigneeId: conversation.assignedToId,
    dueDate: detectedDate,
    priority: "MEDIUM"
  })

  createReminder({
    type: "FOLLOW_UP",
    scheduledFor: dueDate - 1day,
    userId: assigneeId,
    message: "Lembrete: follow-up com {cliente}"
  })
}

// Detecta objeções
if (messageHasObjection) {
  linkToZettel(negotiationId, objectionPlaybookId, type: "RELATES")
}
```

**3. deal.stage_changed**
```typescript
// Atualiza Zettel.NEGOTIATION
updateZettel(negotiationId, {
  content: appendContent(`Mudou para stage ${newStage}`)
})

// Se fechou (won/lost)
if (stage === "WON" || stage === "LOST") {
  createZettel({
    type: "LEARNING",
    title: `Lições - ${deal.title}`,
    content: aiSummarize(deal + interactions),
    links: [negotiationId]
  })
}
```

**4. os.created (Confirm8 webhook)**
```typescript
createZettel({
  type: "PROJECT",
  title: `OS #${os.number} - ${os.title}`,
  sourceType: "os",
  sourceId: os.id,
  assigneeId: os.technicianId
})
```

#### 2.3 Auto-linking Inteligente
Criar serviço: `/src/modules/knowledge/linking.service.ts`

Estratégias:
- **Semantic Similarity** (via embeddings + Qdrant)
- **Entity-based** (mesmo contactId, dealId, projectId)
- **Keyword matching** (tags, termos)
- **Temporal proximity** (criados próximos no tempo)

#### 2.4 Cron Job - Lembretes Automáticos
Criar worker: `/src/cron/reminders.cron.ts`

```typescript
// A cada 5 minutos
cron.schedule('*/5 * * * *', async () => {
  const dueReminders = await findDueReminders()

  for (const reminder of dueReminders) {
    // Passa pelo Gatekeeper
    const decision = await gatekeeper.shouldNotify({
      userId: reminder.userId,
      type: reminder.type,
      context: { nodeId: reminder.nodeId }
    })

    if (decision === "EXECUTE" || decision === "SUGGEST") {
      await notificationService.send({
        userId: reminder.userId,
        title: reminder.message,
        type: reminder.type,
        link: `/zettels/${reminder.nodeId}`
      })

      await markReminderAsSent(reminder.id)
    }
  }
})
```

#### 2.5 API Endpoints (novos)
```typescript
POST   /api/v1/knowledge/nodes/:id/remind      // Criar lembrete manual
GET    /api/v1/knowledge/reminders             // Listar lembretes
PATCH  /api/v1/knowledge/reminders/:id/snooze  // Adiar lembrete
PATCH  /api/v1/knowledge/reminders/:id/dismiss // Dispensar
GET    /api/v1/knowledge/auto-suggestions      // Sugestões de links
POST   /api/v1/knowledge/nodes/:id/set-truth   // Marcar como fonte da verdade
```

---

## MÓDULO 3: GATEKEEPER AGENT

### Objetivo:
Criar um agente que filtra e orquestra atenção e autonomia, respeitando hierarquia de políticas.

### Escopo:

#### 3.1 Database Schema
```prisma
model AttentionProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  level       AttentionLevel @default(BALANCED)
  quietHours  Json     // [{start: "22:00", end: "08:00", days: [0,6]}]
  channels    Json     // {email: true, push: true, inapp: true, whatsapp: false}
  vipList     Json     // {contacts: [], projects: [], deals: []}
  autonomy    Json     // {create_zettel: "EXECUTE", send_message: "SUGGEST", ...}
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])
}

model CompanyPolicy {
  id          String   @id @default(cuid())
  companyId   String   @unique
  maxAutonomy Json     // {agent: {...}, supervisor: {...}, admin: {...}}
  forbidden   Json     // ["send_external_message_auto", "delete_contact"]
  auditRules  Json     // {retention_days: 365, ...}
  rateLimits  Json     // {ai_calls_per_day: 1000, ...}
  updatedAt   DateTime @updatedAt

  company     Company  @relation(fields: [companyId], references: [id])
}

model GatekeeperLog {
  id          String   @id @default(cuid())
  companyId   String
  userId      String?
  action      String   // "send_notification", "create_zettel", etc
  decision    GatekeeperDecision
  reason      String
  context     Json
  timestamp   DateTime @default(now())

  @@index([companyId, timestamp])
  @@index([userId, timestamp])
}

enum AttentionLevel {
  SILENT      // Mínimo de interrupções
  BALANCED    // Equilibrado
  ACTIVE      // Todas as notificações
}

enum GatekeeperDecision {
  EXECUTE     // Executar ação imediatamente
  SUGGEST     // Sugerir para usuário aprovar
  LOG_ONLY    // Apenas logar, não notificar
  BLOCK       // Bloquear ação
}
```

#### 3.2 Gatekeeper Service
Criar: `/src/modules/gatekeeper/index.ts`

```typescript
class GatekeeperService {
  async shouldExecute(params: {
    userId: string
    action: string
    context: any
  }): Promise<GatekeeperDecision> {

    // 1. Carregar hierarquia de políticas
    const companyPolicy = await getCompanyPolicy(companyId)
    const teamPolicy = await getTeamPolicy(teamId) // se existir
    const userProfile = await getAttentionProfile(userId)

    // 2. Verificar ações proibidas (nível empresa)
    if (companyPolicy.forbidden.includes(action)) {
      return { decision: "BLOCK", reason: "Forbidden by company policy" }
    }

    // 3. Verificar autonomia máxima (por role)
    const userRole = await getUserRole(userId)
    const maxAutonomy = companyPolicy.maxAutonomy[userRole][action]

    if (maxAutonomy === "BLOCK") {
      return { decision: "BLOCK", reason: "Not allowed for role" }
    }

    if (maxAutonomy === "SUGGEST") {
      return { decision: "SUGGEST", reason: "Requires approval" }
    }

    // 4. Verificar preferências do usuário
    const userAutonomy = userProfile.autonomy[action]

    if (userAutonomy === "LOG_ONLY") {
      return { decision: "LOG_ONLY", reason: "User prefers silence" }
    }

    // 5. Verificar quiet hours
    if (isInQuietHours(userProfile.quietHours)) {
      return { decision: "LOG_ONLY", reason: "Quiet hours" }
    }

    // 6. Verificar VIP list (urgência)
    const isVIP = checkIfVIP(context, userProfile.vipList)
    if (isVIP) {
      return { decision: "EXECUTE", reason: "VIP context" }
    }

    // 7. Score de atenção (anti-spam)
    const attentionScore = await calculateAttentionScore(userId, action)

    if (attentionScore < 0.3) {
      return { decision: "LOG_ONLY", reason: "Low attention score / spam prevention" }
    }

    // 8. Decisão padrão
    return { decision: "EXECUTE", reason: "All checks passed" }
  }

  async calculateAttentionScore(userId: string, action: string): Promise<number> {
    // Fatores:
    // - Frequência de notificações (última hora, último dia)
    // - Taxa de dismissal (usuário ignora?)
    // - Urgência do contexto
    // - Horário do dia
    // - Deduplicação (mesma ação repetida?)

    const recentNotifications = await countRecentNotifications(userId, "1h")
    const dismissRate = await getDismissRate(userId, "24h")

    let score = 1.0

    // Penaliza se muitas notificações recentes
    if (recentNotifications > 10) score -= 0.5

    // Penaliza se usuário ignora muito
    if (dismissRate > 0.7) score -= 0.3

    return Math.max(0, score)
  }
}
```

#### 3.3 Integração com outros módulos
Modificar:
- `/src/modules/notifications/index.ts` - Passar pelo Gatekeeper antes de enviar
- `/src/modules/knowledge/curator.service.ts` - Passar pelo Gatekeeper antes de criar lembretes
- `/src/modules/automations/engine/executor.ts` - Passar pelo Gatekeeper antes de ações

Padrão:
```typescript
// Antes de qualquer ação sensível
const decision = await gatekeeper.shouldExecute({
  userId,
  action: "send_notification",
  context: { type: "follow_up", contactId, urgency: "medium" }
})

if (decision.decision === "EXECUTE") {
  await notificationService.send(...)
  await gatekeeperLog.create({ decision: "EXECUTE", reason: decision.reason })
}

if (decision.decision === "SUGGEST") {
  await createPendingAction({ userId, action, context })
  await notificationService.send({ title: "Aprovação necessária", ... })
}

if (decision.decision === "LOG_ONLY") {
  await gatekeeperLog.create({ decision: "LOG_ONLY", reason: decision.reason })
  // Não faz nada além de logar
}
```

#### 3.4 API Endpoints
```typescript
GET    /api/v1/gatekeeper/profile          // Meu perfil de atenção
PATCH  /api/v1/gatekeeper/profile          // Atualizar perfil
GET    /api/v1/gatekeeper/logs             // Meus logs (por que fui/não fui notificado)
GET    /api/v1/gatekeeper/policy           // Política da empresa (admin)
PATCH  /api/v1/gatekeeper/policy           // Atualizar política (admin)
GET    /api/v1/gatekeeper/pending-actions  // Ações pendentes de aprovação
POST   /api/v1/gatekeeper/approve/:id      // Aprovar ação
POST   /api/v1/gatekeeper/reject/:id       // Rejeitar ação
```

---

## MÓDULO 4: COGNITIVE OS (Truth Layer + People Growth)

### Objetivo:
Implementar camadas cognitivas avançadas: fonte da verdade, desenvolvimento de pessoas, causalidade.

### Escopo:

#### 4.1 Truth Layer (já parcialmente no Módulo 2)
Adicionar lógica:

**Conflict Detection**:
```typescript
// Ao criar/atualizar KnowledgeNode
async function detectConflicts(nodeId: string) {
  const node = await getNode(nodeId)

  // Buscar nodes similares (mesmo tópico/entidade)
  const similar = await findSimilarNodes(node.content, node.entities)

  for (const other of similar) {
    // Usar LLM para detectar contradição
    const hasConflict = await aiDetectConflict(node.content, other.content)

    if (hasConflict) {
      // Marcar ambos como CONFLICTING
      await updateNode(node.id, { truthStatus: "CONFLICTING" })
      await updateNode(other.id, { truthStatus: "CONFLICTING" })

      // Notificar owner para resolver
      await createReminder({
        nodeId: node.id,
        userId: node.ownerId,
        type: "REVIEW_REQUIRED",
        message: "Conflito detectado - revisão necessária"
      })
    }
  }
}
```

**Freshness Score (decay ao longo do tempo)**:
```typescript
// Cron diário
cron.schedule('0 2 * * *', async () => {
  const allNodes = await getAllActiveNodes()

  for (const node of allNodes) {
    const daysSinceUpdate = daysBetween(node.updatedAt, now())

    // Decay exponencial
    const freshness = Math.exp(-daysSinceUpdate / 30) // half-life 30 dias

    await updateNode(node.id, { freshnessScore: freshness })

    // Se muito antigo, marcar para revisão
    if (freshness < 0.2 && node.truthStatus === "SOURCE_OF_TRUTH") {
      await createReminder({
        userId: node.ownerId,
        type: "REVIEW_REQUIRED",
        message: "Conhecimento desatualizado - revisar"
      })
    }
  }
})
```

#### 4.2 People Growth (Skills + Gaps)
Já existe módulo `learning`, mas precisa integração com Gaps.

Adicionar schema:
```prisma
model EmployeeGap {
  id          String   @id @default(cuid())
  companyId   String
  employeeId  String
  skillId     String
  domain      SkillDomain
  gap         String   // Descrição do gap
  evidence    Json[]   // [{nodeId, conversationId, dealId}]
  severity    GapSeverity
  status      GapStatus @default(OPEN)
  closedAt    DateTime?
  createdAt   DateTime @default(now())

  company     Company  @relation(fields: [companyId], references: [id])
  employee    User     @relation(fields: [employeeId], references: [id])
  skill       Skill    @relation(fields: [skillId], references: [id])

  @@index([employeeId, status])
  @@index([companyId, domain])
}

enum SkillDomain {
  COMMERCIAL  // Vendas, negociação
  TECHNICAL   // Técnico, produto
  MANAGEMENT  // Gestão, liderança
  SOFT_SKILLS // Comunicação, empatia
}

enum GapSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum GapStatus {
  OPEN
  IN_PROGRESS
  CLOSED
}
```

**Auto-detecção de Gaps**:
```typescript
// Ao analisar interações/conversas
async function detectGaps(interactionId: string) {
  const interaction = await getInteraction(interactionId)
  const employee = await getUser(interaction.userId)

  // Usar LLM para analisar qualidade da interação
  const analysis = await aiAnalyzeInteraction({
    transcript: interaction.notes,
    outcome: interaction.outcome,
    rubrics: await getCompanyRubrics(employee.companyId)
  })

  if (analysis.gaps.length > 0) {
    for (const gap of analysis.gaps) {
      await createGap({
        employeeId: employee.id,
        skillId: gap.skillId,
        domain: gap.domain,
        gap: gap.description,
        evidence: [{ interactionId }],
        severity: gap.severity
      })

      // Sugerir trilha de aprendizado
      const path = await suggestLearningPath(gap.skillId)
      await notifyEmployee(employee.id, {
        title: "Nova oportunidade de desenvolvimento",
        message: `Identificamos uma oportunidade na área de ${gap.domain}`,
        link: `/learning/paths/${path.id}`
      })
    }
  }
}
```

#### 4.3 Causalidade (RCA - Root Cause Analysis)
Adicionar ao schema (links com tipo):
```prisma
model KnowledgeLink {
  // ... campos existentes

  linkType    LinkType @default(RELATES)
}

enum LinkType {
  RELATES         // Genérico
  DEPENDS_ON      // Dependência
  SUPPORTS        // Suporta/evidencia
  CONFLICTS       // Conflita
  CAUSES          // Causa (para RCA)
  CAUSED_BY       // Causado por
  LEADS_TO        // Leva a (efeito)
}
```

Criar template de Zettel.RCA:
```typescript
// Ao criar RCA
async function createRCA(params: {
  problem: string
  context: any
}) {
  const rcaNode = await createZettel({
    type: "RCA",
    title: `RCA: ${params.problem}`,
    content: `
# Problema
${params.problem}

# 5 Whys
1. Por quê? ...
2. Por quê? ...
3. Por quê? ...
4. Por quê? ...
5. Por quê? ...

# Causa Raiz
...

# Ações Corretivas
...
    `
  })

  // Link para causas
  for (const causeId of detectedCauses) {
    await createLink(rcaNode.id, causeId, "CAUSED_BY")
  }

  // Criar tasks para ações
  for (const action of correctiveActions) {
    const taskNode = await createZettel({
      type: "TASK",
      title: action.title,
      assigneeId: action.assignee,
      dueDate: action.dueDate
    })

    await createLink(rcaNode.id, taskNode.id, "LEADS_TO")
  }
}
```

#### 4.4 API Endpoints
```typescript
// Truth Layer
GET    /api/v1/knowledge/truth/conflicts      // Listar conflitos
POST   /api/v1/knowledge/truth/resolve        // Resolver conflito
GET    /api/v1/knowledge/truth/stale          // Conhecimento desatualizado

// People Growth
GET    /api/v1/learning/gaps                  // Meus gaps
GET    /api/v1/learning/gaps/team             // Gaps do time (supervisor)
POST   /api/v1/learning/gaps/:id/close        // Fechar gap
GET    /api/v1/learning/rubrics               // Rubrics da empresa

// Causalidade
POST   /api/v1/knowledge/rca                  // Criar RCA
GET    /api/v1/knowledge/rca/:id/causes       // Causas de um RCA
```

---

## MÓDULO 5: CONFIGURAÇÕES DE ATENÇÃO

### Objetivo:
Interface para usuários e admins controlarem atenção e autonomia.

### Escopo:

#### 5.1 Presets de Atenção (Usuário)
```typescript
const ATTENTION_PRESETS = {
  SILENT: {
    level: "SILENT",
    channels: { email: false, push: false, inapp: true, whatsapp: false },
    autonomy: {
      create_zettel: "EXECUTE",
      create_reminder: "LOG_ONLY",
      send_notification: "LOG_ONLY",
      send_external_message: "SUGGEST"
    }
  },

  BALANCED: {
    level: "BALANCED",
    channels: { email: true, push: true, inapp: true, whatsapp: false },
    autonomy: {
      create_zettel: "EXECUTE",
      create_reminder: "EXECUTE",
      send_notification: "EXECUTE",
      send_external_message: "SUGGEST"
    }
  },

  ACTIVE: {
    level: "ACTIVE",
    channels: { email: true, push: true, inapp: true, whatsapp: true },
    autonomy: {
      create_zettel: "EXECUTE",
      create_reminder: "EXECUTE",
      send_notification: "EXECUTE",
      send_external_message: "SUGGEST"
    }
  }
}
```

#### 5.2 Quiet Hours (Usuário)
```typescript
interface QuietHour {
  start: string    // "22:00"
  end: string      // "08:00"
  days: number[]   // [0,6] = Domingo e Sábado
  timezone: string // "America/Sao_Paulo"
}

// Validação
function isInQuietHours(quietHours: QuietHour[]): boolean {
  const now = DateTime.now()

  for (const qh of quietHours) {
    const start = DateTime.fromFormat(qh.start, "HH:mm", { zone: qh.timezone })
    const end = DateTime.fromFormat(qh.end, "HH:mm", { zone: qh.timezone })

    if (now >= start && now <= end && qh.days.includes(now.weekday)) {
      return true
    }
  }

  return false
}
```

#### 5.3 Company Policy (Admin)
```typescript
interface CompanyPolicyConfig {
  maxAutonomy: {
    viewer: {
      create_zettel: "SUGGEST",
      send_notification: "BLOCK",
      send_external_message: "BLOCK"
    },
    agent: {
      create_zettel: "EXECUTE",
      send_notification: "SUGGEST",
      send_external_message: "SUGGEST"
    },
    supervisor: {
      create_zettel: "EXECUTE",
      send_notification: "EXECUTE",
      send_external_message: "EXECUTE"
    },
    company_admin: {
      create_zettel: "EXECUTE",
      send_notification: "EXECUTE",
      send_external_message: "EXECUTE"
    }
  },

  forbidden: [
    "send_external_message_auto",  // Nunca enviar mensagem externa sem aprovação
    "delete_contact_auto",         // Nunca deletar contato sem aprovação
    "modify_invoice_auto"          // Nunca modificar fatura sem aprovação
  ],

  auditRules: {
    retention_days: 365,
    immutable: true,
    export_allowed: false  // Não permitir export de audit logs
  },

  rateLimits: {
    ai_calls_per_user_per_day: 100,
    ai_calls_per_company_per_day: 1000,
    automations_per_hour: 50
  }
}
```

#### 5.4 API Endpoints (já definidos no Módulo 3)
Apenas implementar lógica.

---

## MÓDULO 6: NARRATIVE ENGINE & SIMULATION

### Objetivo:
Criar narrativas compreensíveis e simulações de treinamento.

### Escopo:

#### 6.1 Narrative Engine
Criar serviço: `/src/modules/narrative/index.ts`

```typescript
class NarrativeService {
  async generateNarrative(params: {
    type: "client" | "project" | "period"
    entityId?: string
    startDate?: Date
    endDate?: Date
    format: "summary" | "timeline" | "lessons" | "risks"
  }): Promise<Narrative> {

    // 1. Coletar evidências (zettels relacionados)
    const evidences = await collectEvidences(params)

    // 2. Ordenar cronologicamente
    const timeline = sortByTimestamp(evidences)

    // 3. Gerar narrativa com LLM
    const prompt = buildNarrativePrompt(params.format, timeline)
    const narrative = await llm.complete(prompt)

    // 4. Adicionar referências (links para fontes)
    const withReferences = addSourceReferences(narrative, evidences)

    return {
      title: `Narrativa: ${params.type}`,
      content: withReferences,
      sources: evidences.map(e => ({ nodeId: e.id, title: e.title })),
      generatedAt: new Date()
    }
  }

  async collectEvidences(params): Promise<KnowledgeNode[]> {
    // Buscar todos os zettels relacionados
    const nodes = await prisma.knowledgeNode.findMany({
      where: {
        companyId: params.companyId,
        entities: params.entityId ? { contains: params.entityId } : undefined,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate
        },
        truthStatus: { not: "OUTDATED" }
      },
      include: { links: true, evidences: true }
    })

    return nodes
  }
}
```

**Formatos de Narrativa**:

1. **Summary** (Resumo Executivo):
```markdown
# Resumo Executivo - Cliente XYZ

## Contexto
Iniciamos o relacionamento em [data] via [canal].

## Principais Interações
- [data]: Primeira reunião - identificadas necessidades A, B, C
- [data]: Proposta enviada - valor R$ X
- [data]: Negociação - objeção sobre preço resolvida com Y

## Status Atual
Deal em stage [X], probabilidade [Y]%.

## Próximos Passos
1. Follow-up em [data]
2. Enviar documentação complementar
3. Agendar reunião com decisor

## Fontes
- Zettel #123: Perfil Cliente XYZ
- Zettel #456: Negociação 2024-12-20
- Conversation #789
```

2. **Timeline**:
```markdown
# Timeline - Projeto ABC

2024-01-15: Projeto iniciado
2024-01-20: Kick-off meeting
2024-02-10: Milestone 1 concluído
...
```

3. **Lessons Learned**:
```markdown
# Lições Aprendidas - Cliente XYZ

## O que funcionou
- Abordagem consultiva
- Demo personalizado

## O que não funcionou
- Prazo muito apertado gerou stress

## Recomendações
- Para próximos clientes similares, alocar +20% de tempo
```

#### 6.2 Simulation Engine
Criar módulo: `/src/modules/simulation/index.ts`

```prisma
model SimulationScenario {
  id          String   @id @default(cuid())
  companyId   String
  title       String
  description String
  type        SimulationType
  persona     Json     // Definição da persona (cliente simulado)
  rubric      Json     // Critérios de avaliação
  difficulty  Int      // 1-5
  estimatedDuration Int // minutos
  createdAt   DateTime @default(now())

  company     Company  @relation(fields: [companyId], references: [id])
  sessions    SimulationSession[]
}

model SimulationSession {
  id          String   @id @default(cuid())
  scenarioId  String
  userId      String
  startedAt   DateTime
  finishedAt  DateTime?
  transcript  Json[]   // Mensagens trocadas
  evaluation  Json?    // Resultado da avaliação
  score       Float?
  feedback    String?

  scenario    SimulationScenario @relation(fields: [scenarioId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
}

enum SimulationType {
  NEGOTIATION     // Negociação de vendas
  OBJECTION       // Tratamento de objeção
  TECHNICAL       // Suporte técnico
  CRISIS          // Gestão de crise
  ONBOARDING      // Onboarding de cliente
}
```

Lógica:
```typescript
class SimulationService {
  async startSession(scenarioId: string, userId: string): Promise<SimulationSession> {
    const scenario = await getScenario(scenarioId)

    const session = await prisma.simulationSession.create({
      data: {
        scenarioId,
        userId,
        startedAt: new Date(),
        transcript: []
      }
    })

    // Primeira mensagem da persona
    const initialMessage = await this.generatePersonaResponse(scenario.persona, null)

    await this.addMessage(session.id, "persona", initialMessage)

    return session
  }

  async sendMessage(sessionId: string, message: string): Promise<string> {
    const session = await getSession(sessionId)
    const scenario = session.scenario

    // Adicionar mensagem do usuário
    await this.addMessage(sessionId, "user", message)

    // Gerar resposta da persona (LLM com persona prompt)
    const response = await llm.complete({
      systemPrompt: this.buildPersonaPrompt(scenario.persona),
      messages: session.transcript
    })

    // Adicionar resposta
    await this.addMessage(sessionId, "persona", response)

    return response
  }

  async endSession(sessionId: string): Promise<Evaluation> {
    const session = await getSession(sessionId)
    const scenario = session.scenario

    // Avaliar com LLM (usando rubric)
    const evaluation = await llm.complete({
      prompt: `
Avalie a seguinte simulação de ${scenario.type}.

Critérios (rubric):
${JSON.stringify(scenario.rubric, null, 2)}

Transcrição:
${JSON.stringify(session.transcript, null, 2)}

Retorne:
- Score (0-100)
- Pontos fortes
- Pontos de melhoria
- Gaps identificados (se houver)
      `
    })

    await prisma.simulationSession.update({
      where: { id: sessionId },
      data: {
        finishedAt: new Date(),
        evaluation: evaluation,
        score: evaluation.score,
        feedback: evaluation.feedback
      }
    })

    // Criar zettels automaticamente
    await this.createLearningZettels(session, evaluation)

    // Criar gaps se identificados
    if (evaluation.gaps.length > 0) {
      await this.createGaps(session.userId, evaluation.gaps)
    }

    return evaluation
  }

  async createLearningZettels(session, evaluation) {
    // Criar Zettel.LEARNING
    await createZettel({
      type: "LEARNING",
      title: `Simulação - ${session.scenario.title}`,
      content: `
# Simulação
Tipo: ${session.scenario.type}
Data: ${session.finishedAt}
Score: ${evaluation.score}/100

## Pontos Fortes
${evaluation.strengths}

## Pontos de Melhoria
${evaluation.improvements}

## Próximos Passos
${evaluation.nextSteps}
      `,
      ownerId: session.userId,
      visibility: "PRIVATE"
    })
  }
}
```

#### 6.3 API Endpoints
```typescript
// Narrative
POST   /api/v1/narrative/generate          // Gerar narrativa
GET    /api/v1/narrative/:id               // Buscar narrativa
POST   /api/v1/narrative/:id/export        // Export PDF/MD

// Simulation
GET    /api/v1/simulation/scenarios        // Listar cenários
POST   /api/v1/simulation/scenarios        // Criar cenário (admin)
POST   /api/v1/simulation/start            // Iniciar simulação
POST   /api/v1/simulation/:id/message      // Enviar mensagem
POST   /api/v1/simulation/:id/end          // Finalizar simulação
GET    /api/v1/simulation/history          // Histórico de simulações
```

---

## MÓDULO 7: EVENT BUS & INTEGRAÇÕES AVANÇADAS

### Objetivo:
Completar Event Bus e garantir que todos os módulos emitam/escutem eventos corretamente.

### Escopo:

#### 7.1 Event Bus (já existe parcialmente)
Expandir: `/src/core/event-bus/index.ts`

**Eventos Core a Garantir**:
```typescript
// Auth
"user.created"
"user.logged_in"
"user.logged_out"

// CRM
"contact.created"
"contact.updated"
"deal.created"
"deal.stage_changed"
"deal.won"
"deal.lost"
"interaction.created"

// Omnichannel
"conversation.created"
"conversation.assigned"
"conversation.status_changed"
"message.received"
"message.sent"

// Knowledge
"zettel.created"
"zettel.updated"
"zettel.linked"
"zettel.conflict_detected"
"reminder.created"
"reminder.due"

// Automations
"workflow.triggered"
"workflow.executed"
"workflow.failed"

// Learning
"gap.detected"
"gap.closed"
"learning_path.completed"

// Gatekeeper
"gatekeeper.decision"
"gatekeeper.action_blocked"

// Sync
"sync.started"
"sync.completed"
"sync.failed"
```

#### 7.2 Event Handlers (subscribers)
Criar: `/src/modules/knowledge/event-handlers.ts`

```typescript
// Ao registrar módulo Knowledge
eventBus.subscribe("conversation.created", async (event) => {
  await curatorService.onConversationCreated(event.data)
})

eventBus.subscribe("message.received", async (event) => {
  await curatorService.onMessageReceived(event.data)
})

eventBus.subscribe("deal.stage_changed", async (event) => {
  await curatorService.onDealStageChanged(event.data)
})

eventBus.subscribe("deal.won", async (event) => {
  await curatorService.createLearningZettel(event.data)
})

eventBus.subscribe("deal.lost", async (event) => {
  await curatorService.createLearningZettel(event.data)
})
```

Criar: `/src/modules/automations/event-handlers.ts`

```typescript
eventBus.subscribe("*", async (event) => {
  // Buscar workflows com trigger = event.type
  const workflows = await findWorkflowsByTrigger(event.type, event.companyId)

  for (const workflow of workflows) {
    // Enqueue execution
    await workflowQueue.add("execute", {
      workflowId: workflow.id,
      context: event.data
    })
  }
})
```

#### 7.3 Event Sourcing (opcional, se necessário)
Se quiser histórico completo de eventos:

```prisma
model Event {
  id          String   @id @default(cuid())
  companyId   String
  type        String
  payload     Json
  metadata    Json
  timestamp   DateTime @default(now())

  @@index([companyId, type, timestamp])
  @@index([timestamp])
}
```

---

## MÓDULO 8: TESTES, VALIDAÇÃO E DOCUMENTAÇÃO FINAL

### Objetivo:
Garantir qualidade, criar testes e documentação completa.

### Escopo:

#### 8.1 Testes Unitários
Criar testes para cada módulo novo:

```typescript
// tests/modules/automations/workflow.test.ts
describe("Workflow Engine", () => {
  it("should execute workflow with trigger", async () => {
    const workflow = await createWorkflow({...})
    const result = await workflowEngine.execute(workflow, context)
    expect(result.status).toBe("COMPLETED")
  })

  it("should respect gatekeeper decision", async () => {
    // Mock gatekeeper to return "BLOCK"
    const result = await workflowEngine.execute(workflow, context)
    expect(result.status).toBe("BLOCKED")
  })
})

// tests/modules/knowledge/curator.test.ts
describe("Curator Service", () => {
  it("should auto-create zettel from conversation", async () => {
    await eventBus.emit("conversation.created", {...})
    const zettel = await findZettelBySource("conversation", conversationId)
    expect(zettel).toBeDefined()
    expect(zettel.type).toBe("NEGOTIATION")
  })
})

// tests/modules/gatekeeper/gatekeeper.test.ts
describe("Gatekeeper", () => {
  it("should block action during quiet hours", async () => {
    const decision = await gatekeeper.shouldExecute({...})
    expect(decision.decision).toBe("LOG_ONLY")
    expect(decision.reason).toContain("Quiet hours")
  })
})
```

**Coverage target**: 80%+

#### 8.2 Testes de Integração
```typescript
// tests/integration/end-to-end.test.ts
describe("End-to-end flow", () => {
  it("should complete full workflow: message -> zettel -> reminder -> notification", async () => {
    // 1. Criar mensagem
    const message = await createMessage({...})

    // 2. Verificar se zettel foi criado
    await waitFor(() => findZettelBySource("message", message.id))

    // 3. Verificar se reminder foi criado
    const reminder = await findReminderByNode(zettel.id)
    expect(reminder).toBeDefined()

    // 4. Simular cron (reminder due)
    await reminderCron.run()

    // 5. Verificar se notificação foi enviada
    const notification = await findNotificationByUser(userId)
    expect(notification).toBeDefined()
  })
})
```

#### 8.3 Documentação
Criar arquivos:

1. **API Documentation** (atualizar Swagger):
```yaml
# swagger.yaml
/api/v1/automations/workflows:
  get:
    summary: List workflows
    tags: [Automations]
    parameters: [...]
    responses: [...]
  post:
    summary: Create workflow
    tags: [Automations]
    requestBody: [...]
```

2. **Architecture Documentation**:
```markdown
# docs/ARCHITECTURE.md

## Event Flow
conversation.created ->
  -> Curator -> create Zettel.CLIENT + Zettel.NEGOTIATION ->
    -> RAG indexer -> index embeddings ->
      -> Link suggester -> suggest links ->
        -> Gatekeeper -> decide if notify owner

## Modules Dependencies
Auth -> (all modules)
EventBus -> (all modules)
Gatekeeper -> (Notifications, Automations, Knowledge)
Knowledge -> (RAG, Automations)
```

3. **User Guide** (para admins):
```markdown
# docs/USER_GUIDE.md

## Como configurar Automações
1. Acesse /automations
2. Clique em "Criar Workflow"
3. Escolha trigger...
```

#### 8.4 Migrations
Executar todas as migrations:
```bash
npm run db:generate
npm run db:migrate
```

#### 8.5 Seed Data (exemplos)
Criar: `/prisma/seed-complete.ts`

```typescript
// Criar empresa demo
const company = await prisma.company.create({...})

// Criar usuários com diferentes roles
const admin = await createUser({ role: "company_admin" })
const agent = await createUser({ role: "agent" })

// Criar Company Policy
await prisma.companyPolicy.create({
  data: {
    companyId: company.id,
    maxAutonomy: {...},
    forbidden: [...]
  }
})

// Criar Attention Profiles
await prisma.attentionProfile.create({
  data: {
    userId: agent.id,
    level: "BALANCED",
    quietHours: [{start: "22:00", end: "08:00", days: [0,6]}]
  }
})

// Criar workflows exemplo
await createWorkflow({
  name: "Auto-criar zettel de negociação",
  trigger: "conversation.created",
  actions: [...]
})

// Criar cenários de simulação
await createSimulationScenario({
  title: "Negociação - Objeção de Preço",
  type: "OBJECTION",
  persona: {...}
})

// Criar SOPs/Playbooks
await createZettel({
  type: "PLAYBOOK",
  title: "Como tratar objeção de preço",
  truthStatus: "SOURCE_OF_TRUTH",
  content: "..."
})
```

#### 8.6 Performance Testing
```typescript
// tests/performance/load.test.ts
import autocannon from 'autocannon'

describe("Load testing", () => {
  it("should handle 100 req/s", async () => {
    const result = await autocannon({
      url: 'http://localhost:3000/api/v1/conversations',
      connections: 10,
      duration: 10
    })

    expect(result.errors).toBe(0)
    expect(result.latency.p99).toBeLessThan(200) // ms
  })
})
```

---

# 📅 CRONOGRAMA DE EXECUÇÃO

## Ordem de Implementação:

### Semana 1:
- ✅ Módulo 7: Event Bus completo (base para tudo)
- ✅ Módulo 3: Gatekeeper Agent (impacta automations e knowledge)

### Semana 2:
- ✅ Módulo 5: Configurações de Atenção (depende do Gatekeeper)
- ✅ Módulo 2: Zettelkasten Inteligente (depende Event Bus + Gatekeeper)

### Semana 3:
- ✅ Módulo 1: Automations (depende Event Bus + Gatekeeper)
- ✅ Módulo 4: Cognitive OS - Truth Layer (depende Knowledge)

### Semana 4:
- ✅ Módulo 4: Cognitive OS - People Growth + Causalidade
- ✅ Módulo 6: Narrative Engine

### Semana 5:
- ✅ Módulo 6: Simulation Engine
- ✅ Módulo 8: Testes e Documentação

### Semana 6:
- ✅ Módulo 8: Validação completa
- ✅ Deploy e monitoramento

---

# 🎯 CRITÉRIOS DE SUCESSO

## Cada módulo deve:
1. ✅ Schema Prisma completo e migrado
2. ✅ Services implementados com TypeScript
3. ✅ API endpoints RESTful
4. ✅ Event handlers registrados
5. ✅ Integração com Gatekeeper (quando aplicável)
6. ✅ Testes unitários (>80% coverage)
7. ✅ Documentação Swagger
8. ✅ RBAC implementado
9. ✅ Multi-tenant isolation garantido
10. ✅ Logs e métricas

---

# 🚨 RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Complexidade do Workflow Engine | Alta | Alto | Começar com MVP, expandir iterativamente |
| Performance do RAG com muitos zettels | Média | Médio | Indexação assíncrona, cache, pagination |
| Gatekeeper muito restritivo | Média | Médio | Logs detalhados, fácil override por admin |
| LLM costs altos (simulações) | Alta | Médio | Rate limits, usar Ollama local, cache |
| Event Bus overhead | Baixa | Alto | Redis pub/sub eficiente, batch processing |

---

# 📚 REFERÊNCIAS

- Event-Driven Architecture: https://martinfowler.com/articles/201701-event-driven.html
- RBAC Best Practices: https://auth0.com/docs/manage-users/access-control/rbac
- Zettelkasten Method: https://zettelkasten.de/introduction/
- Workflow Engines: n8n, Temporal, Apache Airflow
- Truth Layer: Roam Research, Obsidian approaches

---

**FIM DO PLANO DE IMPLEMENTAÇÃO**

Total estimado: **6 semanas** de desenvolvimento full-time
Complexidade: **Alta**
ROI esperado: **Muito Alto** (plataforma completa e diferenciada)
