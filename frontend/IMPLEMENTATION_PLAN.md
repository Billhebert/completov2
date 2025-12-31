# 📋 Plano de Implementação Completo - Frontend Completov2

> **Estrutura completa de TODOS os arquivos a serem criados**

---

## 📊 Resumo Quantitativo

- **Total de arquivos:** 95+
- **Categorias:** 11
- **Prioridades:** P0 (crítico), P1 (importante), P2 (desejável)
- **Estimativa:** 30 dias de desenvolvimento

---

## 🎯 PRIORIDADE P0 - CRÍTICO (Dias 1-10)

### **1. Core / Services (5 arquivos)**

#### `src/services/api.ts` ⭐⭐⭐⭐⭐
- Axios instance com baseURL
- Request interceptor (adicionar token)
- Response interceptor (auto-refresh em 401)
- Export default api

#### `src/services/auth.service.ts` ⭐⭐⭐⭐⭐
- login(email, password, code2FA?)
- register(data)
- refreshToken()
- logout()
- getUser()
- isAuthenticated()

#### `src/types/auth.types.ts` ⭐⭐⭐⭐
- interface User
- interface LoginRequest
- interface RegisterRequest
- interface AuthResponse

#### `src/types/common.types.ts` ⭐⭐⭐⭐
- interface PaginatedResponse
- interface ApiError
- type Permissions

#### `src/utils/constants.ts` ⭐⭐⭐
- API_URL
- WS_URL
- PERMISSIONS
- ROLES

---

### **2. Contexts (4 arquivos)**

#### `src/contexts/AuthContext.tsx` ⭐⭐⭐⭐⭐
- interface AuthContextData
- AuthProvider component
- useAuth hook export

#### `src/contexts/SocketContext.tsx` ⭐⭐⭐⭐⭐
- interface SocketContextData
- SocketProvider component
- useSocket hook export
- Gestão de múltiplos namespaces

#### `src/contexts/EventBusContext.tsx` ⭐⭐⭐⭐
- interface EventBusContextData
- EventBusProvider component
- useEventBus hook export

#### `src/contexts/AISettingsContext.tsx` ⭐⭐⭐⭐
- interface AISettingsContextData
- AISettingsProvider component
- useAISettings hook export
- Modos: FULL, AUTO, ECONOMICO

---

### **3. Hooks (5 arquivos)**

#### `src/hooks/usePermissions.ts` ⭐⭐⭐⭐⭐
- hasPermission(permission)
- hasAnyPermission(...permissions)
- hasAllPermissions(...permissions)
- isAdmin()
- isDev()
- isAdminGeral()

#### `src/hooks/useSocket.ts` ⭐⭐⭐⭐
- getSocket(namespace)
- connected(namespace)

#### `src/hooks/useChatSocket.ts` ⭐⭐⭐⭐
- socket
- connected
- typingUsers
- sendMessage()
- startTyping()
- stopTyping()

#### `src/hooks/useEventBus.ts` ⭐⭐⭐
- emit(event, data)
- subscribe(event, handler)

#### `src/hooks/useDebounce.ts` ⭐⭐⭐
- useDebounce(value, delay)

---

### **4. Components - Common (8 arquivos)**

#### `src/components/Common/ProtectedRoute.tsx` ⭐⭐⭐⭐⭐
- Props: children, permission?, adminOnly?
- Verifica autenticação
- Verifica permissões
- Redireciona para /login se necessário

#### `src/components/Common/LoadingSpinner.tsx` ⭐⭐⭐⭐
- Spinner animado
- Mensagem opcional

#### `src/components/Common/Modal.tsx` ⭐⭐⭐⭐
- Props: isOpen, onClose, title, children
- Overlay + Content
- Botão de fechar

#### `src/components/Common/DataTable.tsx` ⭐⭐⭐⭐
- Props: data, columns, loading, onRowClick
- Tabela reutilizável
- Paginação

#### `src/components/Common/ErrorBoundary.tsx` ⭐⭐⭐
- Captura erros
- Exibe fallback UI

#### `src/components/Common/Toast.tsx` ⭐⭐⭐
- Notificações toast
- Tipos: success, error, warning, info

#### `src/components/Common/Pagination.tsx` ⭐⭐⭐
- Props: currentPage, totalPages, onPageChange
- Botões prev/next
- Números de página

#### `src/components/Common/EmptyState.tsx` ⭐⭐⭐
- Props: title, description, icon, action
- Estado vazio bonito

---

### **5. Components - Layout (4 arquivos)**

#### `src/components/Layout/AppLayout.tsx` ⭐⭐⭐⭐⭐
- Sidebar + TopBar + Outlet
- Layout flex
- Responsivo

#### `src/components/Layout/Sidebar.tsx` ⭐⭐⭐⭐⭐
- Logo
- Menu de navegação com NavLink
- Verificação de permissões
- Responsivo (mobile collapse)

#### `src/components/Layout/TopBar.tsx` ⭐⭐⭐⭐⭐
- GlobalSearch
- NotificationBell
- User menu (perfil, logout)

#### `src/components/Layout/MobileMenu.tsx` ⭐⭐⭐
- Menu mobile
- Hamburger button
- Drawer lateral

---

### **6. Components - Auth (4 arquivos)**

#### `src/components/Auth/LoginForm.tsx` ⭐⭐⭐⭐⭐
- Formulário email + senha
- Campo opcional 2FA
- Validação com zod
- react-hook-form

#### `src/components/Auth/RegisterForm.tsx` ⭐⭐⭐⭐⭐
- Nome, email, senha, empresa
- Validação com zod
- react-hook-form

#### `src/components/Auth/Setup2FA.tsx` ⭐⭐⭐⭐
- QR code display
- Backup codes display
- Verificação de código

#### `src/components/Auth/ForgotPassword.tsx` ⭐⭐⭐
- Email input
- Enviar token de reset

---

### **7. Pages - Auth (3 arquivos)**

#### `src/pages/Auth/LoginPage.tsx` ⭐⭐⭐⭐⭐
- Usa LoginForm
- Logo + título
- Link para registro

#### `src/pages/Auth/RegisterPage.tsx` ⭐⭐⭐⭐⭐
- Usa RegisterForm
- Logo + título
- Link para login

#### `src/pages/Auth/ForgotPasswordPage.tsx` ⭐⭐⭐
- Usa ForgotPassword
- Link para voltar ao login

---

### **8. App e Rotas (2 arquivos)**

#### `src/App.tsx` ⭐⭐⭐⭐⭐
- BrowserRouter
- Providers (Auth, Socket, EventBus, AISettings)
- Routes configuration
- ErrorBoundary

#### `src/routes.tsx` ⭐⭐⭐⭐⭐
- Definição de todas as rotas
- Rotas públicas
- Rotas protegidas
- Lazy loading

---

## 🎯 PRIORIDADE P1 - IMPORTANTE (Dias 11-20)

### **9. Components - CRM (8 arquivos)**

#### `src/components/CRM/ContactList.tsx` ⭐⭐⭐⭐
- Lista de contatos
- Filtros
- Paginação
- DataTable

#### `src/components/CRM/ContactForm.tsx` ⭐⭐⭐⭐
- Criar/editar contato
- react-hook-form + zod
- Campos: nome, email, telefone, empresa, tags

#### `src/components/CRM/ContactDetails.tsx` ⭐⭐⭐⭐
- Detalhes do contato
- Histórico de interações
- Deals relacionados
- Score de engajamento (IA)

#### `src/components/CRM/ContactFilters.tsx` ⭐⭐⭐
- Filtros: busca, tag, status, owner
- Aplicar/limpar filtros

#### `src/components/CRM/DealKanban.tsx` ⭐⭐⭐⭐
- react-beautiful-dnd
- Colunas por estágio
- Drag & drop
- Cards de deals

#### `src/components/CRM/DealForm.tsx` ⭐⭐⭐⭐
- Criar/editar deal
- Produtos
- Valor, estágio, contato

#### `src/components/CRM/DealDetails.tsx` ⭐⭐⭐⭐
- Detalhes do deal
- Probabilidade (IA)
- Histórico de mudanças

#### `src/components/CRM/InteractionForm.tsx` ⭐⭐⭐
- Registrar interação
- Tipo: call, email, meeting, note
- Vincular a contato/deal

---

### **10. Components - Chat (6 arquivos)**

#### `src/components/Chat/ChatInterface.tsx` ⭐⭐⭐⭐
- Layout: ChannelList + MessageList + MessageInput
- WebSocket integration
- Listeners de eventos

#### `src/components/Chat/ChannelList.tsx` ⭐⭐⭐⭐
- Lista de canais
- Criar novo canal
- Seleção de canal

#### `src/components/Chat/MessageList.tsx` ⭐⭐⭐⭐
- Lista de mensagens
- Auto-scroll
- Agrupamento por autor
- Reações

#### `src/components/Chat/MessageInput.tsx` ⭐⭐⭐⭐
- Input de mensagem
- Typing indicator
- Envio com Enter
- Emoji picker (opcional)

#### `src/components/Chat/MessageItem.tsx` ⭐⭐⭐⭐
- Mensagem individual
- Editar/deletar (se autor)
- Reações
- Timestamp

#### `src/components/Chat/TypingIndicator.tsx` ⭐⭐⭐
- "Fulano está digitando..."
- Animação de dots

---

### **11. Components - Knowledge (7 arquivos)**

#### `src/components/Knowledge/ZettelList.tsx` ⭐⭐⭐⭐
- Lista de zettels
- Filtros: tipo, tags, scope
- Grid ou lista
- Cards clicáveis

#### `src/components/Knowledge/ZettelForm.tsx` ⭐⭐⭐⭐
- Criar/editar zettel
- Título, conteúdo, tipo
- Tags, importância
- isCompanyWide/Personal

#### `src/components/Knowledge/ZettelDetails.tsx` ⭐⭐⭐⭐
- Detalhes do zettel
- Links relacionados
- Sugestões de IA

#### `src/components/Knowledge/ZettelGraph.tsx` ⭐⭐⭐⭐⭐
- vis-network
- Grafo Obsidian-style
- Cores por tipo
- Clique para navegar

#### `src/components/Knowledge/SemanticSearch.tsx` ⭐⭐⭐⭐⭐
- Input de busca
- Resultados com relevância
- Score %

#### `src/components/Knowledge/AIQuestionAnswer.tsx` ⭐⭐⭐⭐⭐
- Input de pergunta
- Resposta da IA
- Fontes citadas
- Confiança

#### `src/components/Knowledge/TagCloud.tsx` ⭐⭐⭐
- Nuvem de tags
- Contador de uso
- Clique para filtrar

---

### **12. Components - AI (3 arquivos)**

#### `src/components/AI/AIModeSwitcher.tsx` ⭐⭐⭐⭐⭐
- 3 cards: FULL, AUTO, ECONOMICO
- Seleção de modo
- Descrição de cada modo

#### `src/components/AI/AIChat.tsx` ⭐⭐⭐⭐
- Chat com IA
- Histórico de mensagens
- Input
- Indicador do modelo usado

#### `src/components/AI/AIUsageStats.tsx` ⭐⭐⭐
- Estatísticas de uso
- Tokens, custo, requests
- Gráficos

---

### **13. Components - Notifications (2 arquivos)**

#### `src/components/Notifications/NotificationBell.tsx` ⭐⭐⭐⭐
- Sino com contador
- Dropdown de notificações
- Marcar como lida
- Priorização por IA

#### `src/components/Notifications/NotificationCenter.tsx` ⭐⭐⭐
- Lista completa de notificações
- Filtros: tipo, lidas/não lidas
- Resumo inteligente

---

### **14. Components - Search (2 arquivos)**

#### `src/components/Search/GlobalSearch.tsx` ⭐⭐⭐⭐
- Input de busca
- Debounce
- Resultados agrupados por tipo
- Navegação ao clicar

#### `src/components/Search/SearchResults.tsx` ⭐⭐⭐
- Exibição de resultados
- Highlight de query
- Tipos diferentes (contato, deal, zettel, etc)

---

### **15. Pages - Core (8 arquivos)**

#### `src/pages/Dashboard/DashboardPage.tsx` ⭐⭐⭐⭐
- Métricas principais
- Gráficos de atividade
- Links rápidos

#### `src/pages/CRM/ContactsPage.tsx` ⭐⭐⭐⭐
- Header + botão "Novo"
- ContactList

#### `src/pages/CRM/ContactDetailsPage.tsx` ⭐⭐⭐⭐
- ContactDetails
- Tabs: Detalhes, Deals, Interações

#### `src/pages/CRM/DealsPage.tsx` ⭐⭐⭐⭐
- Toggle Kanban/Tabela
- DealKanban ou DealList

#### `src/pages/Chat/ChatPage.tsx` ⭐⭐⭐⭐
- ChatInterface fullscreen

#### `src/pages/Knowledge/KnowledgePage.tsx` ⭐⭐⭐⭐
- Tabs: Lista, Grafo, Busca, Q&A
- ZettelList por padrão

#### `src/pages/Knowledge/GraphPage.tsx` ⭐⭐⭐⭐
- ZettelGraph fullscreen

#### `src/pages/AI/AIChatPage.tsx` ⭐⭐⭐⭐
- AIModeSwitcher
- AIChat

---

## 🎯 PRIORIDADE P2 - DESEJÁVEL (Dias 21-30)

### **16. Components - Analytics (3 arquivos)**

#### `src/components/Analytics/Dashboard.tsx` ⭐⭐⭐
- Métricas gerais
- Gráficos (recharts)
- Pipeline, séries temporais

#### `src/components/Analytics/PipelineChart.tsx` ⭐⭐⭐
- BarChart com recharts
- Deals por estágio

#### `src/components/Analytics/TimeSeriesChart.tsx` ⭐⭐⭐
- LineChart com recharts
- Atividade ao longo do tempo

---

### **17. Components - Automations (4 arquivos)**

#### `src/components/Automations/WorkflowList.tsx` ⭐⭐⭐
- Lista de workflows
- Status: DRAFT, ACTIVE, PAUSED
- Ações: editar, ativar, pausar

#### `src/components/Automations/WorkflowEditor.tsx` ⭐⭐⭐⭐
- ReactFlow
- Drag & drop de nodes
- Salvar definição

#### `src/components/Automations/WorkflowForm.tsx` ⭐⭐⭐
- Nome, descrição
- Seleção de eventos

#### `src/components/Automations/ExecutionLogs.tsx` ⭐⭐⭐
- Histórico de execuções
- Status, logs, duração

---

### **18. Components - Omnichannel (4 arquivos)**

#### `src/components/Omnichannel/ConversationList.tsx` ⭐⭐⭐
- Lista de conversas
- Filtros: status, canal
- Atribuição

#### `src/components/Omnichannel/ConversationView.tsx` ⭐⭐⭐
- Mensagens da conversa
- Input de resposta
- Atribuir/mudar status

#### `src/components/Omnichannel/WhatsAppSetup.tsx` ⭐⭐⭐⭐
- Criar conta WhatsApp
- QR code
- Status de conexão

#### `src/components/Omnichannel/WhatsAppQRCode.tsx` ⭐⭐⭐
- QR code component
- qrcode.react
- Polling de status

---

### **19. Components - Settings (6 arquivos)**

#### `src/components/Settings/ProfileSettings.tsx` ⭐⭐⭐
- Editar nome, email, avatar
- Upload de imagem

#### `src/components/Settings/SecuritySettings.tsx` ⭐⭐⭐⭐
- Alterar senha
- Setup2FA
- Ativar/desativar 2FA

#### `src/components/Settings/CompanySettings.tsx` ⭐⭐⭐
- Nome da empresa
- Configurações gerais

#### `src/components/Settings/UserManagement.tsx` ⭐⭐⭐
- Lista de usuários (admin)
- Criar/editar usuário
- Atribuir roles

#### `src/components/Settings/RBACSettings.tsx` ⭐⭐⭐
- Departamentos
- Roles customizados
- Permissões

#### `src/components/Settings/IntegrationSettings.tsx` ⭐⭐⭐
- Webhooks
- API Keys
- Configurações de integração

---

### **20. Services Adicionais (5 arquivos)**

#### `src/services/crm.service.ts` ⭐⭐⭐⭐
- getContacts()
- createContact()
- updateContact()
- deleteContact()
- getDeals()
- createDeal()
- updateDealStage()

#### `src/services/knowledge.service.ts` ⭐⭐⭐⭐
- getNodes()
- createNode()
- updateNode()
- deleteNode()
- getObsidianGraph()
- semanticSearch()
- askAI()

#### `src/services/chat.service.ts` ⭐⭐⭐⭐
- getChannels()
- createChannel()
- getMessages()
- sendMessage()

#### `src/services/notification.service.ts` ⭐⭐⭐
- getNotifications()
- markAsRead()
- markAllAsRead()

#### `src/services/analytics.service.ts` ⭐⭐⭐
- getDashboard()
- getTimeSeries()
- getPipeline()

---

### **21. Types Adicionais (4 arquivos)**

#### `src/types/crm.types.ts` ⭐⭐⭐⭐
- interface Contact
- interface Deal
- interface Interaction

#### `src/types/knowledge.types.ts` ⭐⭐⭐⭐
- interface KnowledgeNode
- interface Link
- interface GraphData

#### `src/types/chat.types.ts` ⭐⭐⭐⭐
- interface Channel
- interface Message
- interface Reaction

#### `src/types/notification.types.ts` ⭐⭐⭐
- interface Notification

---

### **22. Pages Adicionais (10 arquivos)**

#### `src/pages/Automations/AutomationsPage.tsx` ⭐⭐⭐
- WorkflowList
- Botão criar workflow

#### `src/pages/Automations/WorkflowEditorPage.tsx` ⭐⭐⭐
- WorkflowEditor fullscreen

#### `src/pages/Omnichannel/OmnichannelPage.tsx` ⭐⭐⭐
- ConversationList
- ConversationView

#### `src/pages/Omnichannel/WhatsAppPage.tsx` ⭐⭐⭐
- Lista de contas WhatsApp
- WhatsAppSetup

#### `src/pages/Settings/SettingsPage.tsx` ⭐⭐⭐
- Tabs: Perfil, Segurança, Empresa, Usuários, RBAC, Integrações

#### `src/pages/Settings/ProfilePage.tsx` ⭐⭐⭐
- ProfileSettings

#### `src/pages/Settings/SecurityPage.tsx` ⭐⭐⭐
- SecuritySettings

#### `src/pages/Settings/UsersPage.tsx` ⭐⭐⭐
- UserManagement (admin only)

#### `src/pages/Settings/RBACPage.tsx` ⭐⭐⭐
- RBACSettings (admin only)

#### `src/pages/Settings/IntegrationsPage.tsx` ⭐⭐⭐
- IntegrationSettings

---

### **23. Utilities (3 arquivos)**

#### `src/utils/formatters.ts` ⭐⭐⭐
- formatDate()
- formatCurrency()
- formatNumber()
- formatRelativeTime()

#### `src/utils/validators.ts` ⭐⭐⭐
- Schemas do zod
- validateEmail()
- validatePhone()

#### `src/utils/helpers.ts` ⭐⭐⭐
- cn() - className helper
- generateId()
- truncate()

---

## 📊 Resumo de Arquivos por Categoria

| Categoria | Arquivos | Prioridade |
|-----------|----------|------------|
| **Core/Services** | 5 | P0 |
| **Contexts** | 4 | P0 |
| **Hooks** | 5 | P0 |
| **Common Components** | 8 | P0 |
| **Layout Components** | 4 | P0 |
| **Auth Components** | 4 | P0 |
| **Auth Pages** | 3 | P0 |
| **App/Rotas** | 2 | P0 |
| **CRM Components** | 8 | P1 |
| **Chat Components** | 6 | P1 |
| **Knowledge Components** | 7 | P1 |
| **AI Components** | 3 | P1 |
| **Notifications** | 2 | P1 |
| **Search** | 2 | P1 |
| **Core Pages** | 8 | P1 |
| **Analytics Components** | 3 | P2 |
| **Automations Components** | 4 | P2 |
| **Omnichannel Components** | 4 | P2 |
| **Settings Components** | 6 | P2 |
| **Services Adicionais** | 5 | P2 |
| **Types Adicionais** | 4 | P2 |
| **Pages Adicionais** | 10 | P2 |
| **Utilities** | 3 | P2 |
| **TOTAL** | **100 arquivos** | - |

---

## 🎯 Ordem de Implementação Recomendada

### **Fase 1: Foundation (Dias 1-3)**
1. ✅ Types (auth, common)
2. ✅ Utils (constants, formatters)
3. ✅ Services (api, auth)

### **Fase 2: State Management (Dias 4-5)**
4. ✅ Contexts (Auth, Socket, EventBus, AISettings)
5. ✅ Hooks (usePermissions, useSocket, etc)

### **Fase 3: Common Components (Dia 6)**
6. ✅ Common components (ProtectedRoute, LoadingSpinner, Modal, etc)

### **Fase 4: Layout (Dia 7)**
7. ✅ Layout components (AppLayout, Sidebar, TopBar)

### **Fase 5: Auth (Dia 8)**
8. ✅ Auth components + pages (Login, Register, 2FA)

### **Fase 6: App Setup (Dia 9)**
9. ✅ App.tsx e routes.tsx

### **Fase 7: CRM (Dias 10-12)**
10. ✅ Types e services do CRM
11. ✅ CRM components
12. ✅ CRM pages

### **Fase 8: Chat (Dias 13-14)**
13. ✅ Types e services do Chat
14. ✅ Chat components
15. ✅ Chat page

### **Fase 9: Knowledge (Dias 15-17)**
16. ✅ Types e services do Knowledge
17. ✅ Knowledge components (incluindo Graph e RAG)
18. ✅ Knowledge pages

### **Fase 10: AI (Dia 18)**
19. ✅ AI components
20. ✅ AI page

### **Fase 11: Notifications & Search (Dia 19)**
21. ✅ Notifications components
22. ✅ Search components

### **Fase 12: Dashboard (Dia 20)**
23. ✅ Dashboard page
24. ✅ Analytics components básicos

### **Fase 13: Analytics Avançado (Dias 21-22)**
25. ✅ Analytics components completos
26. ✅ Gráficos com recharts

### **Fase 14: Automations (Dias 23-24)**
27. ✅ Automations components
28. ✅ Automations pages
29. ✅ ReactFlow integration

### **Fase 15: Omnichannel (Dias 25-26)**
30. ✅ Omnichannel components
31. ✅ Omnichannel pages
32. ✅ WhatsApp integration

### **Fase 16: Settings (Dias 27-28)**
33. ✅ Settings components
34. ✅ Settings pages
35. ✅ RBAC management

### **Fase 17: Polish & Testing (Dias 29-30)**
36. ✅ Ajustes de UI/UX
37. ✅ Testes de integração
38. ✅ Correção de bugs
39. ✅ Otimizações

---

## ✅ Checklist de Progresso

### P0 - Crítico
- [ ] 5 Services
- [ ] 4 Contexts
- [ ] 5 Hooks
- [ ] 8 Common Components
- [ ] 4 Layout Components
- [ ] 4 Auth Components
- [ ] 3 Auth Pages
- [ ] 2 App/Rotas

**Total P0:** 35 arquivos

### P1 - Importante
- [ ] 8 CRM Components
- [ ] 6 Chat Components
- [ ] 7 Knowledge Components
- [ ] 3 AI Components
- [ ] 2 Notifications
- [ ] 2 Search
- [ ] 8 Core Pages

**Total P1:** 36 arquivos

### P2 - Desejável
- [ ] 3 Analytics Components
- [ ] 4 Automations Components
- [ ] 4 Omnichannel Components
- [ ] 6 Settings Components
- [ ] 5 Services Adicionais
- [ ] 4 Types Adicionais
- [ ] 10 Pages Adicionais
- [ ] 3 Utilities

**Total P2:** 39 arquivos

---

## 🎯 TOTAL: 110 ARQUIVOS

Pronto para começar! 🚀
