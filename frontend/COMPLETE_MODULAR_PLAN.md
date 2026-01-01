# 🏗️ Plano COMPLETO e MODULAR - Frontend Completov2

> **100% dos 35 módulos do backend + Arquitetura Modular Completa**

---

## 🎯 Filosofia de Modularidade

Cada módulo é **completamente independente** e pode ser:
- ✅ Removido sem afetar outros módulos
- ✅ Habilitado/desabilitado via configuração
- ✅ Desenvolvido separadamente
- ✅ Testado isoladamente

---

## 📦 Estrutura Modular

```
src/
├── core/                      # Core do sistema (SEMPRE necessário)
│   ├── providers/             # Providers globais
│   ├── router/                # Sistema de rotas modular
│   ├── types/                 # Types compartilhados
│   └── utils/                 # Utilitários compartilhados
│
├── modules/                   # TODOS os módulos (35 módulos)
│   ├── auth/                  # ✅ Autenticação
│   ├── crm/                   # ✅ CRM
│   ├── chat/                  # ✅ Chat
│   ├── knowledge/             # ✅ Knowledge (Zettel)
│   ├── ai/                    # ✅ IA (3 modos)
│   ├── automations/           # ✅ Automações
│   ├── omnichannel/           # ✅ Omnichannel
│   ├── notifications/         # ✅ Notificações
│   ├── analytics/             # ✅ Analytics
│   ├── rbac/                  # ✅ RBAC
│   ├── webhooks/              # ✅ Webhooks
│   ├── files/                 # ✅ Files
│   ├── search/                # ✅ Busca Global
│   ├── audit/                 # ✅ Audit
│   ├── apikeys/               # ✅ API Keys
│   ├── erp/                   # ⚠️ ERP
│   ├── email-templates/       # ⚠️ Email Templates
│   ├── people-growth/         # ⚠️ People Growth
│   ├── sync/                  # ⚠️ Sync
│   ├── sso/                   # ⚠️ SSO
│   ├── deduplication/         # ⚠️ Deduplication
│   ├── simulation/            # ⚠️ Simulation
│   ├── narrative/             # ⚠️ Narrative
│   ├── gatekeeper/            # ⚠️ Gatekeeper
│   ├── fsm/                   # ⚠️ FSM (Finite State Machine)
│   ├── mcp/                   # ⚠️ MCP
│   ├── cmms/                  # ⚠️ CMMS
│   ├── services/              # ⚠️ Services
│   ├── partnerships/          # ⚠️ Partnerships
│   ├── jobs/                  # ⚠️ Jobs/Scheduling
│   ├── learning/              # ⚠️ Learning/Training
│   ├── feedback/              # ⚠️ Feedback
│   ├── settings/              # ✅ Settings
│   └── _template/             # Template para novos módulos
│
└── shared/                    # Componentes compartilhados
    ├── components/            # Componentes UI reutilizáveis
    ├── hooks/                 # Hooks compartilhados
    └── layouts/               # Layouts compartilhados
```

---

## 🏛️ CORE DO SISTEMA (Sempre Necessário)

### **Arquivos Core (20 arquivos)**

#### **src/core/providers/** (5 arquivos)
- `AppProviders.tsx` - Wrapper de todos os providers
- `AuthProvider.tsx` - Provider de autenticação
- `ThemeProvider.tsx` - Provider de tema
- `ModuleProvider.tsx` - Provider de módulos habilitados
- `ConfigProvider.tsx` - Provider de configuração

#### **src/core/router/** (3 arquivos)
- `ModularRouter.tsx` - Router que carrega rotas dos módulos
- `RouteRegistry.ts` - Registro de rotas modular
- `ProtectedRoute.tsx` - Proteção de rotas

#### **src/core/types/** (5 arquivos)
- `module.types.ts` - Types para módulos
- `route.types.ts` - Types para rotas
- `api.types.ts` - Types para API
- `user.types.ts` - Types para usuário
- `common.types.ts` - Types comuns

#### **src/core/utils/** (5 arquivos)
- `api.ts` - Axios instance
- `constants.ts` - Constantes globais
- `storage.ts` - LocalStorage helpers
- `formatters.ts` - Formatadores
- `validators.ts` - Validadores

#### **src/core/hooks/** (2 arquivos)
- `useAuth.ts` - Hook de autenticação
- `useModule.ts` - Hook para verificar se módulo está ativo

---

## 📦 ESTRUTURA DE CADA MÓDULO

Cada módulo segue a mesma estrutura:

```
modules/[nome-do-modulo]/
├── index.ts                   # Export público do módulo
├── module.config.ts           # Configuração do módulo
├── types/                     # Types específicos do módulo
│   └── index.ts
├── services/                  # Services de API
│   └── [nome].service.ts
├── hooks/                     # Hooks específicos
│   └── use[Nome].ts
├── components/                # Componentes do módulo
│   ├── [Nome]List.tsx
│   ├── [Nome]Form.tsx
│   ├── [Nome]Details.tsx
│   └── index.ts
├── pages/                     # Páginas do módulo
│   ├── [Nome]Page.tsx
│   ├── [Nome]ListPage.tsx
│   └── index.ts
├── contexts/                  # Contexts específicos (opcional)
│   └── [Nome]Context.tsx
└── routes.tsx                 # Rotas do módulo
```

---

## 📋 TODOS OS 35 MÓDULOS DETALHADOS

### **1. AUTH - Autenticação** ⭐⭐⭐⭐⭐ CRÍTICO

**Responsabilidade:** Login, registro, 2FA, recuperação de senha

**Arquivos (12):**
```
modules/auth/
├── index.ts
├── module.config.ts
├── types/index.ts (User, LoginRequest, RegisterRequest, AuthResponse)
├── services/auth.service.ts
├── hooks/useAuth.ts, usePermissions.ts
├── components/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── Setup2FA.tsx
│   └── ForgotPassword.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── ForgotPasswordPage.tsx
└── routes.tsx
```

**Permissões:** Nenhuma (público + autenticado)

**Dependências:** Nenhuma

---

### **2. CRM - Customer Relationship Management** ⭐⭐⭐⭐⭐ CRÍTICO

**Responsabilidade:** Gestão de contatos, deals, interações, pipeline

**Arquivos (18):**
```
modules/crm/
├── index.ts
├── module.config.ts
├── types/index.ts (Contact, Deal, Interaction, Pipeline)
├── services/crm.service.ts
├── hooks/useCRM.ts, useContacts.ts, useDeals.ts
├── components/
│   ├── Contacts/
│   │   ├── ContactList.tsx
│   │   ├── ContactForm.tsx
│   │   ├── ContactDetails.tsx
│   │   ├── ContactFilters.tsx
│   │   └── ContactEngagement.tsx (AI)
│   ├── Deals/
│   │   ├── DealKanban.tsx
│   │   ├── DealList.tsx
│   │   ├── DealForm.tsx
│   │   ├── DealDetails.tsx
│   │   └── DealProbability.tsx (AI)
│   └── Interactions/
│       ├── InteractionList.tsx
│       └── InteractionForm.tsx
├── pages/
│   ├── ContactsPage.tsx
│   ├── ContactDetailsPage.tsx
│   ├── DealsPage.tsx
│   ├── DealDetailsPage.tsx
│   └── PipelinePage.tsx
└── routes.tsx
```

**Permissões:** CONTACT_READ, CONTACT_CREATE, DEAL_READ, DEAL_CREATE

**Dependências:** auth, analytics (opcional)

---

### **3. CHAT - Mensageria em Tempo Real** ⭐⭐⭐⭐⭐ CRÍTICO

**Responsabilidade:** Chat, canais, mensagens diretas, WebSocket

**Arquivos (14):**
```
modules/chat/
├── index.ts
├── module.config.ts
├── types/index.ts (Channel, Message, Reaction)
├── services/chat.service.ts
├── hooks/useSocket.ts, useChatSocket.ts
├── contexts/SocketContext.tsx
├── components/
│   ├── ChatInterface.tsx
│   ├── ChannelList.tsx
│   ├── MessageList.tsx
│   ├── MessageItem.tsx
│   ├── MessageInput.tsx
│   ├── TypingIndicator.tsx
│   ├── SentimentBadge.tsx (AI)
│   └── SmartReply.tsx (AI)
├── pages/
│   └── ChatPage.tsx
└── routes.tsx
```

**Permissões:** CHAT_READ, CHAT_SEND, CHAT_MODERATE

**Dependências:** auth, ai (para sentiment)

---

### **4. KNOWLEDGE - Sistema Zettel (Obsidian-style)** ⭐⭐⭐⭐⭐ CRÍTICO

**Responsabilidade:** Zettels, grafo, RAG, busca semântica, Q&A com IA

**Arquivos (16):**
```
modules/knowledge/
├── index.ts
├── module.config.ts
├── types/index.ts (KnowledgeNode, Link, GraphData)
├── services/knowledge.service.ts
├── hooks/useKnowledge.ts, useGraph.ts, useRAG.ts
├── components/
│   ├── ZettelList.tsx
│   ├── ZettelForm.tsx
│   ├── ZettelDetails.tsx
│   ├── ZettelGraph.tsx (vis-network)
│   ├── SemanticSearch.tsx (RAG)
│   ├── AIQuestionAnswer.tsx (RAG + IA)
│   ├── TagCloud.tsx
│   ├── LinkSuggestions.tsx (AI)
│   └── TagSuggestions.tsx (AI)
├── pages/
│   ├── KnowledgePage.tsx
│   ├── GraphPage.tsx
│   ├── SearchPage.tsx
│   └── AskAIPage.tsx
└── routes.tsx
```

**Permissões:** KNOWLEDGE_READ, KNOWLEDGE_CREATE

**Dependências:** auth, ai

---

### **5. AI - Sistema de IA (3 Modos)** ⭐⭐⭐⭐⭐ CRÍTICO

**Responsabilidade:** IA FULL/AUTO/ECONOMICO, chat, análise de complexidade

**Arquivos (10):**
```
modules/ai/
├── index.ts
├── module.config.ts
├── types/index.ts (AIMode, AIRequest, AIResponse)
├── services/ai.service.ts
├── hooks/useAI.ts, useAISettings.ts
├── contexts/AISettingsContext.tsx
├── components/
│   ├── AIModeSwitcher.tsx
│   ├── AIChat.tsx
│   ├── AIUsageStats.tsx
│   └── ComplexityIndicator.tsx
├── pages/
│   ├── AIChatPage.tsx
│   └── AISettingsPage.tsx
└── routes.tsx
```

**Permissões:** Nenhuma (todos podem usar)

**Dependências:** auth

---

### **6. AUTOMATIONS - Workflows e Automações** ⭐⭐⭐⭐ IMPORTANTE

**Responsabilidade:** Workflows, execuções, triggers

**Arquivos (12):**
```
modules/automations/
├── index.ts
├── module.config.ts
├── types/index.ts (Workflow, Execution, Node)
├── services/automations.service.ts
├── hooks/useWorkflows.ts, useExecutions.ts
├── components/
│   ├── WorkflowList.tsx
│   ├── WorkflowForm.tsx
│   ├── WorkflowEditor.tsx (ReactFlow)
│   ├── ExecutionLogs.tsx
│   ├── TriggerConfig.tsx
│   └── AIWorkflowSuggestions.tsx (AI)
├── pages/
│   ├── WorkflowsPage.tsx
│   ├── WorkflowEditorPage.tsx
│   └── ExecutionsPage.tsx
└── routes.tsx
```

**Permissões:** WEBHOOK_MANAGE (admin)

**Dependências:** auth, webhooks

---

### **7. OMNICHANNEL - Multi-canal** ⭐⭐⭐⭐ IMPORTANTE

**Responsabilidade:** WhatsApp, conversas, multi-canal

**Arquivos (12):**
```
modules/omnichannel/
├── index.ts
├── module.config.ts
├── types/index.ts (Conversation, WhatsAppAccount, OmniMessage)
├── services/omnichannel.service.ts
├── hooks/useConversations.ts, useWhatsApp.ts
├── components/
│   ├── ConversationList.tsx
│   ├── ConversationView.tsx
│   ├── MessageComposer.tsx
│   ├── WhatsAppSetup.tsx
│   ├── WhatsAppQRCode.tsx
│   ├── WhatsAppAccounts.tsx
│   └── ChannelSelector.tsx
├── pages/
│   ├── ConversationsPage.tsx
│   └── WhatsAppPage.tsx
└── routes.tsx
```

**Permissões:** CHAT_READ, CHAT_SEND

**Dependências:** auth, chat

---

### **8. NOTIFICATIONS - Notificações** ⭐⭐⭐⭐ IMPORTANTE

**Responsabilidade:** Notificações em tempo real, priorização por IA

**Arquivos (8):**
```
modules/notifications/
├── index.ts
├── module.config.ts
├── types/index.ts (Notification)
├── services/notification.service.ts
├── hooks/useNotifications.ts, useEventBus.ts
├── contexts/EventBusContext.tsx
├── components/
│   ├── NotificationBell.tsx
│   ├── NotificationCenter.tsx
│   ├── NotificationItem.tsx
│   └── IntelligentSummary.tsx (AI)
├── pages/
│   └── NotificationsPage.tsx
└── routes.tsx
```

**Permissões:** Nenhuma (todos recebem)

**Dependências:** auth, ai

---

### **9. ANALYTICS - Analytics e Relatórios** ⭐⭐⭐⭐ IMPORTANTE

**Responsabilidade:** Dashboards, gráficos, métricas

**Arquivos (12):**
```
modules/analytics/
├── index.ts
├── module.config.ts
├── types/index.ts (Metric, ChartData, TimeSeriesData)
├── services/analytics.service.ts
├── hooks/useAnalytics.ts, useCharts.ts
├── components/
│   ├── Dashboard.tsx
│   ├── MetricCard.tsx
│   ├── PipelineChart.tsx (Recharts)
│   ├── TimeSeriesChart.tsx (Recharts)
│   ├── ActivityChart.tsx (Recharts)
│   ├── TopContacts.tsx
│   └── ExportButton.tsx
├── pages/
│   ├── AnalyticsPage.tsx
│   └── ReportsPage.tsx
└── routes.tsx
```

**Permissões:** ANALYTICS_VIEW, ANALYTICS_EXPORT

**Dependências:** auth, crm (para dados)

---

### **10. RBAC - Role-Based Access Control** ⭐⭐⭐⭐ IMPORTANTE

**Responsabilidade:** Departamentos, roles, permissões

**Arquivos (14):**
```
modules/rbac/
├── index.ts
├── module.config.ts
├── types/index.ts (Department, Role, Permission, UserPermission)
├── services/rbac.service.ts
├── hooks/useRBAC.ts, useDepartments.ts, useRoles.ts
├── components/
│   ├── DepartmentTree.tsx
│   ├── DepartmentForm.tsx
│   ├── RoleList.tsx
│   ├── RoleForm.tsx
│   ├── PermissionMatrix.tsx
│   ├── UserPermissions.tsx
│   └── AuditLog.tsx
├── pages/
│   ├── DepartmentsPage.tsx
│   ├── RolesPage.tsx
│   ├── PermissionsPage.tsx
│   └── AuditPage.tsx
└── routes.tsx
```

**Permissões:** SETTINGS_UPDATE (admin)

**Dependências:** auth

---

### **11. WEBHOOKS - Webhooks e Integrações** ⭐⭐⭐ MÉDIO

**Arquivos (10):**
```
modules/webhooks/
├── index.ts
├── module.config.ts
├── types/index.ts (WebhookEndpoint, WebhookDelivery, EventDefinition)
├── services/webhook.service.ts
├── hooks/useWebhooks.ts
├── components/
│   ├── WebhookList.tsx
│   ├── WebhookForm.tsx
│   ├── WebhookTest.tsx
│   ├── DeliveryLogs.tsx
│   └── EventSelector.tsx
├── pages/
│   ├── WebhooksPage.tsx
│   └── DeliveryLogsPage.tsx
└── routes.tsx
```

**Permissões:** WEBHOOK_MANAGE (admin)

**Dependências:** auth

---

### **12. FILES - Gestão de Arquivos** ⭐⭐⭐⭐ IMPORTANTE

**Arquivos (10):**
```
modules/files/
├── index.ts
├── module.config.ts
├── types/index.ts (File, UploadProgress)
├── services/file.service.ts
├── hooks/useFiles.ts, useUpload.ts
├── components/
│   ├── FileManager.tsx
│   ├── FileUploader.tsx
│   ├── FilePreview.tsx
│   ├── FileList.tsx
│   ├── AvatarUploader.tsx
│   └── DropZone.tsx
├── pages/
│   └── FilesPage.tsx
└── routes.tsx
```

**Permissões:** FILE_READ, FILE_UPLOAD, FILE_DELETE

**Dependências:** auth

---

### **13. SEARCH - Busca Global** ⭐⭐⭐⭐ IMPORTANTE

**Arquivos (8):**
```
modules/search/
├── index.ts
├── module.config.ts
├── types/index.ts (SearchResult, SearchFilter)
├── services/search.service.ts
├── hooks/useSearch.ts, useDebounce.ts
├── components/
│   ├── GlobalSearch.tsx
│   ├── SearchResults.tsx
│   ├── SearchFilters.tsx
│   └── RecentSearches.tsx
├── pages/
│   └── SearchPage.tsx
└── routes.tsx
```

**Permissões:** Nenhuma (busca o que usuário tem acesso)

**Dependências:** auth

---

### **14. AUDIT - Auditoria e Logs** ⭐⭐⭐ MÉDIO

**Arquivos (8):**
```
modules/audit/
├── index.ts
├── module.config.ts
├── types/index.ts (AuditLog, AuditAction)
├── services/audit.service.ts
├── hooks/useAudit.ts
├── components/
│   ├── AuditLogList.tsx
│   ├── AuditLogDetails.tsx
│   ├── AuditFilters.tsx
│   └── ChangesDiff.tsx
├── pages/
│   └── AuditPage.tsx
└── routes.tsx
```

**Permissões:** AUDIT_READ (admin)

**Dependências:** auth

---

### **15. API KEYS - Gestão de API Keys** ⭐⭐⭐ MÉDIO

**Arquivos (8):**
```
modules/apikeys/
├── index.ts
├── module.config.ts
├── types/index.ts (APIKey, APIKeyScope)
├── services/apikey.service.ts
├── hooks/useAPIKeys.ts
├── components/
│   ├── APIKeyList.tsx
│   ├── APIKeyForm.tsx
│   ├── APIKeyDisplay.tsx (mostra key uma vez)
│   ├── ScopeSelector.tsx
│   └── UsageStats.tsx
├── pages/
│   └── APIKeysPage.tsx
└── routes.tsx
```

**Permissões:** APIKEY_READ, APIKEY_CREATE

**Dependências:** auth

---

### **16. ERP - Enterprise Resource Planning** ⭐⭐⭐⭐ IMPORTANTE

**Responsabilidade:** Produtos, estoque, pedidos, financeiro

**Arquivos (20):**
```
modules/erp/
├── index.ts
├── module.config.ts
├── types/index.ts (Product, Inventory, Order, Invoice, Payment)
├── services/erp.service.ts
├── hooks/useERP.ts, useProducts.ts, useOrders.ts
├── components/
│   ├── Products/
│   │   ├── ProductList.tsx
│   │   ├── ProductForm.tsx
│   │   ├── ProductDetails.tsx
│   │   └── InventoryControl.tsx
│   ├── Orders/
│   │   ├── OrderList.tsx
│   │   ├── OrderForm.tsx
│   │   ├── OrderDetails.tsx
│   │   └── OrderTracking.tsx
│   ├── Invoices/
│   │   ├── InvoiceList.tsx
│   │   ├── InvoiceForm.tsx
│   │   ├── InvoicePreview.tsx
│   │   └── InvoiceTemplate.tsx
│   └── Financial/
│       ├── PaymentList.tsx
│       ├── FinancialReport.tsx
│       └── CashFlow.tsx
├── pages/
│   ├── ProductsPage.tsx
│   ├── OrdersPage.tsx
│   ├── InvoicesPage.tsx
│   └── FinancialPage.tsx
└── routes.tsx
```

**Permissões:** PRODUCT_READ, INVOICE_READ

**Dependências:** auth, crm

---

### **17. EMAIL TEMPLATES - Templates de Email** ⭐⭐⭐ MÉDIO

**Arquivos (8):**
```
modules/email-templates/
├── index.ts
├── module.config.ts
├── types/index.ts (EmailTemplate, TemplateVariable)
├── services/email-template.service.ts
├── hooks/useEmailTemplates.ts
├── components/
│   ├── TemplateList.tsx
│   ├── TemplateEditor.tsx (WYSIWYG)
│   ├── TemplatePreview.tsx
│   └── VariableSelector.tsx
├── pages/
│   └── EmailTemplatesPage.tsx
└── routes.tsx
```

**Permissões:** SETTINGS_UPDATE (admin)

**Dependências:** auth

---

### **18. PEOPLE GROWTH - Desenvolvimento de Pessoas** ⭐⭐⭐ MÉDIO

**Arquivos (12):**
```
modules/people-growth/
├── index.ts
├── module.config.ts
├── types/index.ts (Goal, Review, Development)
├── services/people-growth.service.ts
├── hooks/usePeopleGrowth.ts
├── components/
│   ├── GoalList.tsx
│   ├── GoalForm.tsx
│   ├── ReviewForm.tsx
│   ├── DevelopmentPlan.tsx
│   ├── SkillMatrix.tsx
│   └── ProgressChart.tsx
├── pages/
│   ├── GoalsPage.tsx
│   ├── ReviewsPage.tsx
│   └── DevelopmentPage.tsx
└── routes.tsx
```

**Permissões:** USER_READ, USER_UPDATE

**Dependências:** auth, rbac

---

### **19. SYNC - Sincronização** ⭐⭐⭐ MÉDIO

**Arquivos (8):**
```
modules/sync/
├── index.ts
├── module.config.ts
├── types/index.ts (SyncJob, SyncConfig)
├── services/sync.service.ts
├── hooks/useSync.ts
├── components/
│   ├── SyncJobList.tsx
│   ├── SyncConfig.tsx
│   ├── SyncStatus.tsx
│   └── SyncLog.tsx
├── pages/
│   └── SyncPage.tsx
└── routes.tsx
```

**Permissões:** INTEGRATION_MANAGE (admin)

**Dependências:** auth

---

### **20. SSO - Single Sign-On** ⭐⭐⭐ MÉDIO

**Arquivos (8):**
```
modules/sso/
├── index.ts
├── module.config.ts
├── types/index.ts (SSOProvider, SSOConfig)
├── services/sso.service.ts
├── hooks/useSSO.ts
├── components/
│   ├── SSOProviderList.tsx
│   ├── SSOConfig.tsx
│   ├── SSOButton.tsx
│   └── SSOCallback.tsx
├── pages/
│   └── SSOPage.tsx
└── routes.tsx
```

**Permissões:** SETTINGS_UPDATE (admin)

**Dependências:** auth

---

### **21. DEDUPLICATION - Deduplicação** ⭐⭐⭐ MÉDIO

**Arquivos (8):**
```
modules/deduplication/
├── index.ts
├── module.config.ts
├── types/index.ts (Duplicate, MergeConfig)
├── services/deduplication.service.ts
├── hooks/useDeduplication.ts
├── components/
│   ├── DuplicateList.tsx
│   ├── DuplicateComparison.tsx
│   ├── MergeDialog.tsx
│   └── DedupeRules.tsx
├── pages/
│   └── DeduplicationPage.tsx
└── routes.tsx
```

**Permissões:** CONTACT_UPDATE (admin)

**Dependências:** auth, crm

---

### **22. SIMULATION - Simulações** ⭐⭐ BAIXO

**Arquivos (8):**
```
modules/simulation/
├── index.ts
├── module.config.ts
├── types/index.ts (Simulation, Scenario)
├── services/simulation.service.ts
├── hooks/useSimulation.ts
├── components/
│   ├── SimulationList.tsx
│   ├── SimulationForm.tsx
│   ├── ScenarioBuilder.tsx
│   └── SimulationResults.tsx
├── pages/
│   └── SimulationPage.tsx
└── routes.tsx
```

**Permissões:** ANALYTICS_VIEW

**Dependências:** auth, analytics

---

### **23. NARRATIVE - Narrativas/Stories** ⭐⭐ BAIXO

**Arquivos (8):**
```
modules/narrative/
├── index.ts
├── module.config.ts
├── types/index.ts (Story, Narrative)
├── services/narrative.service.ts
├── hooks/useNarrative.ts
├── components/
│   ├── StoryList.tsx
│   ├── StoryBuilder.tsx
│   ├── StoryPreview.tsx
│   └── NarrativeTimeline.tsx
├── pages/
│   └── NarrativePage.tsx
└── routes.tsx
```

**Permissões:** KNOWLEDGE_CREATE

**Dependências:** auth, knowledge

---

### **24. GATEKEEPER - Controle de Acesso Avançado** ⭐⭐⭐ MÉDIO

**Arquivos (8):**
```
modules/gatekeeper/
├── index.ts
├── module.config.ts
├── types/index.ts (AccessRule, Condition)
├── services/gatekeeper.service.ts
├── hooks/useGatekeeper.ts
├── components/
│   ├── RuleList.tsx
│   ├── RuleBuilder.tsx
│   ├── ConditionEditor.tsx
│   └── AccessLog.tsx
├── pages/
│   └── GatekeeperPage.tsx
└── routes.tsx
```

**Permissões:** SETTINGS_UPDATE (admin)

**Dependências:** auth, rbac

---

### **25. FSM - Finite State Machine** ⭐⭐ BAIXO

**Arquivos (8):**
```
modules/fsm/
├── index.ts
├── module.config.ts
├── types/index.ts (StateMachine, State, Transition)
├── services/fsm.service.ts
├── hooks/useFSM.ts
├── components/
│   ├── FSMList.tsx
│   ├── FSMEditor.tsx
│   ├── StateGraph.tsx
│   └── TransitionRules.tsx
├── pages/
│   └── FSMPage.tsx
└── routes.tsx
```

**Permissões:** WEBHOOK_MANAGE (admin)

**Dependências:** auth, automations

---

### **26. MCP - Model Context Protocol** ⭐⭐ BAIXO

**Arquivos (8):**
```
modules/mcp/
├── index.ts
├── module.config.ts
├── types/index.ts (MCPConfig, Context)
├── services/mcp.service.ts
├── hooks/useMCP.ts
├── components/
│   ├── MCPConfig.tsx
│   ├── ContextViewer.tsx
│   ├── ProtocolLog.tsx
│   └── ContextBuilder.tsx
├── pages/
│   └── MCPPage.tsx
└── routes.tsx
```

**Permissões:** INTEGRATION_MANAGE (admin)

**Dependências:** auth, ai

---

### **27. CMMS - Computerized Maintenance Management** ⭐⭐⭐ MÉDIO

**Arquivos (12):**
```
modules/cmms/
├── index.ts
├── module.config.ts
├── types/index.ts (Asset, MaintenanceOrder, Schedule)
├── services/cmms.service.ts
├── hooks/useCMMS.ts
├── components/
│   ├── AssetList.tsx
│   ├── AssetForm.tsx
│   ├── MaintenanceList.tsx
│   ├── MaintenanceForm.tsx
│   ├── ScheduleCalendar.tsx
│   └── AssetHistory.tsx
├── pages/
│   ├── AssetsPage.tsx
│   ├── MaintenancePage.tsx
│   └── SchedulePage.tsx
└── routes.tsx
```

**Permissões:** SETTINGS_UPDATE

**Dependências:** auth

---

### **28. SERVICES - Catálogo de Serviços** ⭐⭐⭐ MÉDIO

**Arquivos (10):**
```
modules/services/
├── index.ts
├── module.config.ts
├── types/index.ts (Service, ServiceCategory)
├── services/services.service.ts
├── hooks/useServices.ts
├── components/
│   ├── ServiceList.tsx
│   ├── ServiceForm.tsx
│   ├── ServiceDetails.tsx
│   ├── ServiceCatalog.tsx
│   └── ServicePricing.tsx
├── pages/
│   └── ServicesPage.tsx
└── routes.tsx
```

**Permissões:** PRODUCT_READ, PRODUCT_CREATE

**Dependências:** auth, erp

---

### **29. PARTNERSHIPS - Parcerias** ⭐⭐⭐ MÉDIO

**Arquivos (10):**
```
modules/partnerships/
├── index.ts
├── module.config.ts
├── types/index.ts (Partner, Agreement, Commission)
├── services/partnership.service.ts
├── hooks/usePartnerships.ts
├── components/
│   ├── PartnerList.tsx
│   ├── PartnerForm.tsx
│   ├── PartnerDetails.tsx
│   ├── AgreementList.tsx
│   └── CommissionTracker.tsx
├── pages/
│   └── PartnershipsPage.tsx
└── routes.tsx
```

**Permissões:** CONTACT_READ, DEAL_READ

**Dependências:** auth, crm

---

### **30. JOBS - Agendamento de Tarefas** ⭐⭐⭐ MÉDIO

**Arquivos (8):**
```
modules/jobs/
├── index.ts
├── module.config.ts
├── types/index.ts (Job, Schedule, Execution)
├── services/job.service.ts
├── hooks/useJobs.ts
├── components/
│   ├── JobList.tsx
│   ├── JobForm.tsx
│   ├── JobScheduler.tsx
│   └── ExecutionLog.tsx
├── pages/
│   └── JobsPage.tsx
└── routes.tsx
```

**Permissões:** WEBHOOK_MANAGE (admin)

**Dependências:** auth, automations

---

### **31. LEARNING - Aprendizado/Treinamento** ⭐⭐⭐ MÉDIO

**Arquivos (12):**
```
modules/learning/
├── index.ts
├── module.config.ts
├── types/index.ts (Course, Lesson, Quiz, Progress)
├── services/learning.service.ts
├── hooks/useLearning.ts
├── components/
│   ├── CourseList.tsx
│   ├── CourseDetails.tsx
│   ├── LessonViewer.tsx
│   ├── QuizPlayer.tsx
│   ├── ProgressTracker.tsx
│   └── Certificate.tsx
├── pages/
│   ├── CoursesPage.tsx
│   ├── CourseViewPage.tsx
│   └── MyLearningPage.tsx
└── routes.tsx
```

**Permissões:** USER_READ

**Dependências:** auth, knowledge

---

### **32. FEEDBACK - Feedback/Avaliações** ⭐⭐ BAIXO

**Arquivos (8):**
```
modules/feedback/
├── index.ts
├── module.config.ts
├── types/index.ts (Feedback, Rating, Survey)
├── services/feedback.service.ts
├── hooks/useFeedback.ts
├── components/
│   ├── FeedbackForm.tsx
│   ├── RatingWidget.tsx
│   ├── SurveyBuilder.tsx
│   └── FeedbackList.tsx
├── pages/
│   └── FeedbackPage.tsx
└── routes.tsx
```

**Permissões:** Nenhuma (todos podem dar feedback)

**Dependências:** auth

---

### **33. SETTINGS - Configurações Gerais** ⭐⭐⭐⭐ IMPORTANTE

**Arquivos (14):**
```
modules/settings/
├── index.ts
├── module.config.ts
├── types/index.ts (CompanySettings, UserSettings)
├── services/settings.service.ts
├── hooks/useSettings.ts
├── components/
│   ├── ProfileSettings.tsx
│   ├── SecuritySettings.tsx
│   ├── CompanySettings.tsx
│   ├── UserManagement.tsx
│   ├── ModuleToggle.tsx
│   ├── ThemeSettings.tsx
│   └── NotificationPreferences.tsx
├── pages/
│   ├── SettingsPage.tsx
│   ├── ProfilePage.tsx
│   ├── SecurityPage.tsx
│   └── CompanyPage.tsx
└── routes.tsx
```

**Permissões:** SETTINGS_READ, SETTINGS_UPDATE

**Dependências:** auth, rbac

---

### **34. Shared - Componentes Compartilhados** ⭐⭐⭐⭐⭐ CRÍTICO

**Arquivos (15):**
```
shared/
├── components/
│   ├── LoadingSpinner.tsx
│   ├── Modal.tsx
│   ├── DataTable.tsx
│   ├── Pagination.tsx
│   ├── EmptyState.tsx
│   ├── ErrorBoundary.tsx
│   ├── Toast.tsx
│   ├── ConfirmDialog.tsx
│   ├── Breadcrumbs.tsx
│   └── Card.tsx
├── layouts/
│   ├── AppLayout.tsx
│   ├── Sidebar.tsx
│   ├── TopBar.tsx
│   └── MobileMenu.tsx
└── hooks/
    ├── useDebounce.ts
    └── useLocalStorage.ts
```

---

### **35. Module Template - Template para Novos Módulos** ⭐⭐⭐⭐⭐ CRÍTICO

**Arquivos (10):**
```
modules/_template/
├── index.ts
├── module.config.ts
├── types/index.ts
├── services/template.service.ts
├── hooks/useTemplate.ts
├── components/
│   ├── TemplateList.tsx
│   ├── TemplateForm.tsx
│   └── TemplateDetails.tsx
├── pages/
│   └── TemplatePage.tsx
└── routes.tsx
```

---

## 📊 RESUMO TOTAL

| Categoria | Módulos | Arquivos Estimados |
|-----------|---------|-------------------|
| **Core** | 1 | 20 |
| **Crítico (P0)** | 5 | ~80 |
| **Importante (P1)** | 10 | ~120 |
| **Médio (P2)** | 15 | ~120 |
| **Baixo (P3)** | 4 | ~32 |
| **Shared** | 1 | 15 |
| **Total** | **36** | **~387 arquivos** |

---

## 🎯 CONFIGURAÇÃO DE MÓDULOS

### **src/core/config/modules.config.ts**

```typescript
export const MODULE_CONFIG = {
  // Sempre habilitados
  core: { enabled: true, required: true },
  auth: { enabled: true, required: true },
  shared: { enabled: true, required: true },

  // Críticos (padrão: habilitado)
  crm: { enabled: true, required: false },
  chat: { enabled: true, required: false },
  knowledge: { enabled: true, required: false },
  ai: { enabled: true, required: false },

  // Opcionais (padrão: desabilitado)
  automations: { enabled: false },
  omnichannel: { enabled: false },
  notifications: { enabled: true },
  analytics: { enabled: true },
  rbac: { enabled: true },
  webhooks: { enabled: false },
  files: { enabled: true },
  search: { enabled: true },
  audit: { enabled: false },
  apikeys: { enabled: false },
  erp: { enabled: false },
  'email-templates': { enabled: false },
  'people-growth': { enabled: false },
  sync: { enabled: false },
  sso: { enabled: false },
  deduplication: { enabled: false },
  simulation: { enabled: false },
  narrative: { enabled: false },
  gatekeeper: { enabled: false },
  fsm: { enabled: false },
  mcp: { enabled: false },
  cmms: { enabled: false },
  services: { enabled: false },
  partnerships: { enabled: false },
  jobs: { enabled: false },
  learning: { enabled: false },
  feedback: { enabled: false },
  settings: { enabled: true },
};
```

---

## 🏗️ COMO ADICIONAR/REMOVER MÓDULOS

### **Adicionar Novo Módulo:**
1. Copiar pasta `modules/_template/`
2. Renomear para novo módulo
3. Atualizar `module.config.ts`
4. Adicionar em `src/core/config/modules.config.ts`
5. Pronto! Sistema carrega automaticamente

### **Remover Módulo:**
1. Definir `enabled: false` em `modules.config.ts`
2. OU deletar pasta do módulo
3. Sistema ignora automaticamente

---

## ✅ CHECKLIST COMPLETO

### Core (20 arquivos)
- [ ] Core providers
- [ ] Router modular
- [ ] Types base
- [ ] Utils base
- [ ] Hooks base

### Módulos Críticos P0 (80 arquivos)
- [ ] auth (12)
- [ ] crm (18)
- [ ] chat (14)
- [ ] knowledge (16)
- [ ] ai (10)
- [ ] shared (15)

### Módulos Importantes P1 (120 arquivos)
- [ ] automations (12)
- [ ] omnichannel (12)
- [ ] notifications (8)
- [ ] analytics (12)
- [ ] rbac (14)
- [ ] webhooks (10)
- [ ] files (10)
- [ ] search (8)
- [ ] audit (8)
- [ ] apikeys (8)
- [ ] settings (14)

### Módulos Médios P2 (120 arquivos)
- [ ] erp (20)
- [ ] email-templates (8)
- [ ] people-growth (12)
- [ ] sync (8)
- [ ] sso (8)
- [ ] deduplication (8)
- [ ] gatekeeper (8)
- [ ] cmms (12)
- [ ] services (10)
- [ ] partnerships (10)
- [ ] jobs (8)
- [ ] learning (12)

### Módulos Baixos P3 (32 arquivos)
- [ ] simulation (8)
- [ ] narrative (8)
- [ ] fsm (8)
- [ ] mcp (8)
- [ ] feedback (8)

---

## 🎯 ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

### **Sprint 1 (Dias 1-5): Core + Auth**
- Core completo (20 arquivos)
- Auth completo (12 arquivos)
- Shared básico (10 arquivos)

### **Sprint 2 (Dias 6-10): CRM**
- CRM completo (18 arquivos)

### **Sprint 3 (Dias 11-15): Chat + Knowledge**
- Chat completo (14 arquivos)
- Knowledge completo (16 arquivos)

### **Sprint 4 (Dias 16-20): AI + Analytics**
- AI completo (10 arquivos)
- Analytics completo (12 arquivos)

### **Sprint 5 (Dias 21-25): Automations + Notifications**
- Automations completo (12 arquivos)
- Notifications completo (8 arquivos)
- Search completo (8 arquivos)

### **Sprint 6 (Dias 26-30): RBAC + Settings**
- RBAC completo (14 arquivos)
- Settings completo (14 arquivos)

### **Sprint 7+: Módulos Opcionais**
- Implementar conforme necessidade
- Priorizar por valor de negócio

---

**TOTAL: ~387 ARQUIVOS em 36 MÓDULOS COMPLETAMENTE MODULARES** 🚀

Cada módulo pode ser habilitado/desabilitado independentemente!
