# 🚀 Prompt de Implementação do Frontend - Completov2

> **Use este prompt para implementar o frontend completo do sistema Completov2**

---

## 📋 CONTEXTO DO PROJETO

Você está implementando o frontend completo de um sistema SaaS multi-tenant chamado **Completov2**. Este é um sistema empresarial abrangente que combina CRM, Chat, Sistema de Knowledge (Zettel/Obsidian-style), IA com 3 modos, Automações, Omnichannel e muito mais.

### Documentação Disponível:
1. **FRONTEND_COMPLETE_GUIDE.md** - Guia completo com todas as especificações (LEIA PRIMEIRO!)
2. **ZETTEL_SYSTEM.md** - Documentação do sistema de Knowledge
3. **Backend API completo** já implementado em `/src/modules/*`

### Características Principais:
- ✅ Sistema multi-tenant com isolamento de dados
- ✅ Autenticação JWT com refresh automático + 2FA
- ✅ Sistema de permissões RBAC complexo (DEV, ADMIN_GERAL, admin, manager, agent, viewer)
- ✅ IA com 3 modos (FULL=OpenAI, AUTO=híbrido, ECONOMICO=Ollama local)
- ✅ WebSocket em tempo real para Chat e Notificações
- ✅ Sistema Zettel estilo Obsidian com RAG (busca semântica)
- ✅ Graph visualization com vis-network
- ✅ Workflow editor visual com ReactFlow
- ✅ Integração WhatsApp via Evolution API
- ✅ Todo o sistema em português (pt-BR)

---

## 🎯 SUA MISSÃO

Implemente o frontend completo do Completov2 seguindo **exatamente** as especificações do `FRONTEND_COMPLETE_GUIDE.md`.

### Objetivos:
1. ✅ Criar estrutura base do projeto React/TypeScript
2. ✅ Implementar todos os 60+ componentes especificados
3. ✅ Configurar todas as rotas (~40 páginas)
4. ✅ Implementar autenticação completa (login, registro, 2FA, refresh)
5. ✅ Criar sistema de permissões RBAC
6. ✅ Integrar todos os endpoints da API
7. ✅ Implementar WebSocket para chat e notificações em tempo real
8. ✅ Criar visualização de grafo Obsidian-style com vis-network
9. ✅ Implementar sistema de 3 modos de IA
10. ✅ Criar todos os dashboards e analytics com gráficos

---

## 🛠️ STACK TECNOLÓGICO OBRIGATÓRIO

### Core:
```json
{
  "framework": "React 18+ com TypeScript",
  "build": "Vite (recomendado) ou Create React App",
  "routing": "react-router-dom v6",
  "http": "axios",
  "websocket": "socket.io-client",
  "state": "Context API + hooks customizados (sem Redux)"
}
```

### UI e Visualização:
```json
{
  "styling": "TailwindCSS (recomendado) ou SCSS",
  "charts": "recharts",
  "drag-drop": "react-beautiful-dnd",
  "workflow-editor": "reactflow",
  "graph-viz": "vis-network",
  "icons": "@heroicons/react ou lucide-react",
  "forms": "react-hook-form",
  "validation": "zod",
  "qrcode": "qrcode.react"
}
```

### Dependências:
```bash
npm create vite@latest completov2-frontend -- --template react-ts
cd completov2-frontend

# Core
npm install react-router-dom axios socket.io-client

# UI
npm install tailwindcss postcss autoprefixer
npm install @headlessui/react @heroicons/react

# Visualização
npm install recharts react-beautiful-dnd reactflow vis-network

# Formulários
npm install react-hook-form zod @hookform/resolvers

# Utilidades
npm install date-fns clsx qrcode.react
npm install -D @types/node
```

---

## 📂 ESTRUTURA DE PASTAS OBRIGATÓRIA

```
src/
├── components/
│   ├── Layout/
│   │   ├── AppLayout.tsx          # Layout principal com Sidebar + TopBar
│   │   ├── Sidebar.tsx            # Menu lateral de navegação
│   │   └── TopBar.tsx             # Barra superior com busca + notificações
│   ├── Auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── Setup2FA.tsx
│   ├── CRM/
│   │   ├── ContactList.tsx        # Tabela de contatos
│   │   ├── ContactForm.tsx        # Formulário de contato
│   │   ├── ContactDetails.tsx     # Detalhes do contato
│   │   ├── DealKanban.tsx         # Kanban de deals (drag & drop)
│   │   ├── DealForm.tsx           # Formulário de deal
│   │   └── DealAnalytics.tsx      # Analytics de deals com IA
│   ├── Chat/
│   │   ├── ChatInterface.tsx      # Interface principal do chat
│   │   ├── ChannelList.tsx        # Lista de canais
│   │   ├── MessageList.tsx        # Lista de mensagens
│   │   ├── MessageInput.tsx       # Input com typing indicator
│   │   └── MessageReactions.tsx   # Reações de mensagens
│   ├── Knowledge/
│   │   ├── ZettelList.tsx         # Lista de zettels
│   │   ├── ZettelForm.tsx         # Formulário de zettel
│   │   ├── ZettelGraph.tsx        # Graph Obsidian-style (vis-network)
│   │   ├── SemanticSearch.tsx     # Busca semântica RAG
│   │   └── AIQuestionAnswer.tsx   # Q&A com IA
│   ├── AI/
│   │   ├── AIModeSwitcher.tsx     # Switcher FULL/AUTO/ECONOMICO
│   │   ├── AIChat.tsx             # Chat com IA
│   │   └── AIUsageStats.tsx       # Estatísticas de uso
│   ├── Automations/
│   │   ├── WorkflowList.tsx
│   │   ├── WorkflowEditor.tsx     # Editor visual (ReactFlow)
│   │   └── ExecutionLogs.tsx
│   ├── Omnichannel/
│   │   ├── ConversationList.tsx
│   │   ├── WhatsAppSetup.tsx
│   │   └── WhatsAppQRCode.tsx
│   ├── Notifications/
│   │   ├── NotificationBell.tsx   # Sino com contador
│   │   └── NotificationCenter.tsx # Centro de notificações
│   ├── Analytics/
│   │   ├── Dashboard.tsx          # Dashboard principal
│   │   ├── PipelineChart.tsx      # Gráfico de pipeline
│   │   └── TimeSeriesChart.tsx    # Gráficos temporais
│   ├── Settings/
│   │   ├── ProfileSettings.tsx
│   │   ├── SecuritySettings.tsx
│   │   ├── CompanySettings.tsx
│   │   └── RBACSettings.tsx
│   └── Common/
│       ├── DataTable.tsx          # Tabela reutilizável
│       ├── Modal.tsx
│       ├── LoadingSpinner.tsx
│       ├── GlobalSearch.tsx
│       └── ProtectedRoute.tsx
├── pages/
│   ├── Auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── Dashboard/
│   │   └── DashboardPage.tsx
│   ├── CRM/
│   │   ├── ContactsPage.tsx
│   │   ├── DealsPage.tsx
│   │   └── PipelinePage.tsx
│   ├── Chat/
│   │   └── ChatPage.tsx
│   ├── Knowledge/
│   │   ├── KnowledgePage.tsx
│   │   ├── GraphPage.tsx
│   │   └── SearchPage.tsx
│   ├── AI/
│   │   └── AIChatPage.tsx
│   ├── Automations/
│   │   └── AutomationsPage.tsx
│   ├── Omnichannel/
│   │   └── OmnichannelPage.tsx
│   └── Settings/
│       └── SettingsPage.tsx
├── contexts/
│   ├── AuthContext.tsx            # Autenticação e usuário
│   ├── SocketContext.tsx          # WebSocket multi-namespace
│   ├── EventBusContext.tsx        # Event bus interno
│   └── AISettingsContext.tsx      # Modo de IA
├── hooks/
│   ├── useAuth.ts
│   ├── usePermissions.ts          # Hook de permissões RBAC
│   ├── useSocket.ts               # Hook de WebSocket
│   ├── useChatSocket.ts           # Hook especializado para chat
│   └── useEventBus.ts
├── services/
│   ├── api.ts                     # Axios instance com interceptors
│   ├── auth.service.ts            # Serviço de autenticação
│   ├── crm.service.ts             # Serviço de CRM
│   ├── knowledge.service.ts       # Serviço de Knowledge
│   ├── chat.service.ts            # Serviço de Chat
│   └── automations.service.ts     # Serviço de Automations
├── types/
│   ├── auth.types.ts
│   ├── crm.types.ts
│   ├── knowledge.types.ts
│   └── common.types.ts
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
├── App.tsx
├── main.tsx
└── routes.tsx
```

---

## 🔥 IMPLEMENTAÇÃO PASSO A PASSO

### **FASE 1: Setup Inicial (DIA 1)**

#### 1.1. Criar Projeto
```bash
npm create vite@latest completov2-frontend -- --template react-ts
cd completov2-frontend
npm install
```

#### 1.2. Instalar Dependências
```bash
# Core
npm install react-router-dom axios socket.io-client

# UI
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @headlessui/react @heroicons/react

# Visualização
npm install recharts react-beautiful-dnd reactflow vis-network

# Formulários
npm install react-hook-form zod @hookform/resolvers

# Utilidades
npm install date-fns clsx qrcode.react
npm install -D @types/node
```

#### 1.3. Configurar TailwindCSS
```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
      },
    },
  },
  plugins: [],
};
```

#### 1.4. Configurar Variáveis de Ambiente
```env
# .env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_ENV=development
```

#### 1.5. Criar Estrutura de Pastas
```bash
mkdir -p src/{components/{Layout,Auth,CRM,Chat,Knowledge,AI,Automations,Omnichannel,Notifications,Analytics,Settings,Common},pages/{Auth,Dashboard,CRM,Chat,Knowledge,AI,Automations,Omnichannel,Settings},contexts,hooks,services,types,utils}
```

---

### **FASE 2: Autenticação e API (DIA 2-3)**

#### 2.1. API Service com Interceptor
**Arquivo: `src/services/api.ts`**

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor com auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/v1/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

#### 2.2. AuthContext
**Arquivo: `src/contexts/AuthContext.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "Estados Globais e Contextos" > "1. AuthContext"

#### 2.3. AuthService
**Arquivo: `src/services/auth.service.ts`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "Autenticação e Autorização" > "Fluxo de Login"

#### 2.4. Hook de Permissões
**Arquivo: `src/hooks/usePermissions.ts`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "Sistema de Permissões (RBAC)" > "Hook de Permissões"

#### 2.5. ProtectedRoute
**Arquivo: `src/components/Common/ProtectedRoute.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "Componente de Proteção de Rota"

---

### **FASE 3: Layout e Navegação (DIA 4)**

#### 3.1. AppLayout
**Arquivo: `src/components/Layout/AppLayout.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "Componentes Necessários" > "1. AppLayout"

#### 3.2. Sidebar
**Arquivo: `src/components/Layout/Sidebar.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "2. Sidebar"

#### 3.3. TopBar
**Arquivo: `src/components/Layout/TopBar.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "3. TopBar"

#### 3.4. GlobalSearch
**Arquivo: `src/components/Common/GlobalSearch.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "15. GlobalSearch"

#### 3.5. Configurar Rotas
**Arquivo: `src/routes.tsx`**

```typescript
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import { ProtectedRoute } from './components/Common/ProtectedRoute';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
// ... importar todas as páginas

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rotas privadas */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/crm/contacts" element={<ContactsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/knowledge/graph" element={<GraphPage />} />
        {/* ... todas as outras rotas */}
      </Route>
    </Routes>
  );
};
```

---

### **FASE 4: WebSocket (DIA 5)**

#### 4.1. SocketContext
**Arquivo: `src/contexts/SocketContext.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "2. SocketContext"

#### 4.2. Hook useChatSocket
**Arquivo: `src/hooks/useChatSocket.ts`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "Integrações" > "Chat WebSocket Integration"

---

### **FASE 5: CRM (DIA 6-8)**

#### 5.1. CRMService
**Arquivo: `src/services/crm.service.ts`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "CRM Service"

#### 5.2. ContactList
**Arquivo: `src/components/CRM/ContactList.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "4. ContactList"

#### 5.3. DealKanban
**Arquivo: `src/components/CRM/DealKanban.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "5. DealKanban"

#### 5.4. DataTable (componente reutilizável)
**Arquivo: `src/components/Common/DataTable.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "14. DataTable"

---

### **FASE 6: Chat (DIA 9-10)**

#### 6.1. ChatInterface
**Arquivo: `src/components/Chat/ChatInterface.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "6. ChatInterface"

#### 6.2. MessageInput
**Arquivo: `src/components/Chat/MessageInput.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "7. MessageInput"

---

### **FASE 7: Knowledge System (DIA 11-13)**

#### 7.1. KnowledgeService
**Arquivo: `src/services/knowledge.service.ts`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "Knowledge Service"

#### 7.2. ZettelGraph (Obsidian-style)
**Arquivo: `src/components/Knowledge/ZettelGraph.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "8. ZettelGraph"

**IMPORTANTE:** Instale vis-network:
```bash
npm install vis-network
npm install -D @types/vis-network
```

#### 7.3. SemanticSearch
**Arquivo: `src/components/Knowledge/SemanticSearch.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "9. SemanticSearch"

#### 7.4. AIQuestionAnswer
**Arquivo: `src/components/Knowledge/AIQuestionAnswer.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "10. AIQuestionAnswer"

---

### **FASE 8: Sistema de IA (DIA 14)**

#### 8.1. AISettingsContext
**Arquivo: `src/contexts/AISettingsContext.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "4. AISettingsContext"

#### 8.2. AIModeSwitcher
**Arquivo: `src/components/AI/AIModeSwitcher.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "Sistema de IA (3 Modos)" > "Componente de Seleção de Modo"

#### 8.3. AIChat
**Arquivo: `src/components/AI/AIChat.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "AI Chat Component"

---

### **FASE 9: Notificações (DIA 15)**

#### 9.1. EventBusContext
**Arquivo: `src/contexts/EventBusContext.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "3. EventBusContext"

#### 9.2. NotificationBell
**Arquivo: `src/components/Notifications/NotificationBell.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "11. NotificationBell"

---

### **FASE 10: Automações (DIA 16-17)**

#### 10.1. WorkflowEditor
**Arquivo: `src/components/Automations/WorkflowEditor.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "12. WorkflowEditor"

**IMPORTANTE:** Instale ReactFlow:
```bash
npm install reactflow
```

---

### **FASE 11: Omnichannel (DIA 18)**

#### 11.1. WhatsAppSetup
**Arquivo: `src/components/Omnichannel/WhatsAppSetup.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "13. WhatsAppSetup"

---

### **FASE 12: Analytics (DIA 19-20)**

#### 12.1. Dashboard
**Arquivo: `src/components/Analytics/Dashboard.tsx`**

COPIE EXATAMENTE DO `FRONTEND_COMPLETE_GUIDE.md` seção "Analytics e Dashboards" > "Dashboard Component"

**IMPORTANTE:** Instale Recharts:
```bash
npm install recharts
```

---

### **FASE 13: Páginas (DIA 21-23)**

Para cada página, crie um wrapper que use o componente correspondente:

**Exemplo: `src/pages/CRM/ContactsPage.tsx`**
```typescript
import React from 'react';
import { ContactList } from '../../components/CRM/ContactList';

export const ContactsPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Contatos</h1>
        <button className="btn-primary">Novo Contato</button>
      </div>
      <ContactList />
    </div>
  );
};
```

Crie páginas para:
- ✅ Dashboard
- ✅ CRM (Contatos, Deals, Pipeline)
- ✅ Chat
- ✅ Knowledge (Lista, Grafo, Busca, Q&A)
- ✅ IA (Chat, Configurações)
- ✅ Automações
- ✅ Omnichannel
- ✅ Analytics
- ✅ Configurações (Perfil, Segurança, Usuários, RBAC)

---

### **FASE 14: Styling (DIA 24-25)**

#### 14.1. CSS Global
**Arquivo: `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer components {
  .page-container {
    @apply p-6;
  }

  .page-header {
    @apply flex items-center justify-between mb-6;
  }

  .btn-primary {
    @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition;
  }

  .btn-secondary {
    @apply bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition;
  }

  .card {
    @apply bg-white rounded-lg shadow p-4;
  }

  .sidebar {
    @apply w-64 bg-gray-900 text-white h-screen fixed left-0 top-0;
  }

  .topbar {
    @apply h-16 bg-white shadow-sm flex items-center justify-between px-6;
  }

  .data-table {
    @apply w-full bg-white rounded-lg shadow overflow-hidden;
  }

  .data-table th {
    @apply bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
  }

  .data-table td {
    @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900;
  }

  .modal-overlay {
    @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
  }

  .modal-content {
    @apply bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto;
  }
}
```

---

### **FASE 15: Testes e Refinamentos (DIA 26-30)**

#### 15.1. Testar Fluxos Principais
- ✅ Login e logout
- ✅ Refresh automático de token
- ✅ CRUD de contatos
- ✅ CRUD de deals
- ✅ Drag & drop no kanban
- ✅ Chat em tempo real
- ✅ Typing indicators
- ✅ Notificações em tempo real
- ✅ Busca semântica RAG
- ✅ Visualização do grafo
- ✅ Q&A com IA
- ✅ Troca de modo de IA
- ✅ WhatsApp QR code
- ✅ Analytics e gráficos

#### 15.2. Otimizações
```typescript
// Lazy loading de rotas
import { lazy, Suspense } from 'react';

const ContactsPage = lazy(() => import('./pages/CRM/ContactsPage'));
const GraphPage = lazy(() => import('./pages/Knowledge/GraphPage'));

// Uso
<Suspense fallback={<LoadingSpinner />}>
  <ContactsPage />
</Suspense>
```

#### 15.3. Error Boundaries
```typescript
// src/components/Common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <h1>Algo deu errado. Por favor, recarregue a página.</h1>;
    }

    return this.props.children;
  }
}
```

---

## ⚡ INSTRUÇÕES CRÍTICAS

### ❌ NÃO FAÇA:
1. ❌ NÃO invente endpoints - use exatamente os que estão no `FRONTEND_COMPLETE_GUIDE.md`
2. ❌ NÃO use Redux - use Context API conforme especificado
3. ❌ NÃO altere a estrutura de permissões
4. ❌ NÃO ignore o sistema de refresh automático de token
5. ❌ NÃO esqueça de implementar WebSocket para chat

### ✅ FAÇA:
1. ✅ SIGA EXATAMENTE os exemplos de código do `FRONTEND_COMPLETE_GUIDE.md`
2. ✅ USE TypeScript para tudo
3. ✅ IMPLEMENTE tratamento de erros em todas as chamadas de API
4. ✅ ADICIONE loading states em todas as operações assíncronas
5. ✅ TESTE cada feature antes de passar para a próxima
6. ✅ MANTENHA o código em português (variáveis, comentários, textos)
7. ✅ USE TailwindCSS para styling
8. ✅ IMPLEMENTE responsividade (mobile-first)

---

## 🎯 PRIORIDADES DE IMPLEMENTAÇÃO

### **P0 - Crítico (Dias 1-10):**
1. Setup inicial e dependências
2. Autenticação completa (login, refresh, 2FA)
3. Layout e navegação
4. Sistema de permissões RBAC
5. CRM básico (contatos e deals)
6. Chat básico com WebSocket

### **P1 - Importante (Dias 11-20):**
7. Knowledge system com grafo
8. Busca semântica RAG
9. Sistema de IA (3 modos)
10. Notificações em tempo real
11. Analytics e dashboards

### **P2 - Desejável (Dias 21-30):**
12. Automações com workflow editor
13. Omnichannel WhatsApp
14. Configurações avançadas (RBAC, webhooks)
15. Otimizações e testes

---

## 📋 CHECKLIST FINAL

Antes de considerar o frontend completo, verifique:

- [ ] ✅ Todas as rotas funcionando
- [ ] ✅ Login, logout e refresh automático funcionando
- [ ] ✅ 2FA completo (QR code, backup codes)
- [ ] ✅ Permissões RBAC funcionando corretamente
- [ ] ✅ CRUD de contatos funcionando
- [ ] ✅ CRUD de deals funcionando
- [ ] ✅ Kanban de deals com drag & drop
- [ ] ✅ Chat em tempo real funcionando
- [ ] ✅ Typing indicators funcionando
- [ ] ✅ Reações em mensagens
- [ ] ✅ Notificações em tempo real
- [ ] ✅ Lista de zettels funcionando
- [ ] ✅ Grafo Obsidian-style funcionando
- [ ] ✅ Busca semântica RAG funcionando
- [ ] ✅ Q&A com IA funcionando
- [ ] ✅ Troca de modo de IA (FULL/AUTO/ECONOMICO)
- [ ] ✅ Chat com IA funcionando
- [ ] ✅ WhatsApp QR code funcionando
- [ ] ✅ Analytics com gráficos funcionando
- [ ] ✅ Busca global funcionando
- [ ] ✅ Perfil do usuário editável
- [ ] ✅ Layout responsivo (mobile, tablet, desktop)
- [ ] ✅ Loading states em todas as operações
- [ ] ✅ Tratamento de erros adequado
- [ ] ✅ Todos os textos em português

---

## 🚀 COMEÇANDO AGORA

Execute os comandos:

```bash
# 1. Criar projeto
npm create vite@latest completov2-frontend -- --template react-ts
cd completov2-frontend

# 2. Instalar todas as dependências
npm install react-router-dom axios socket.io-client
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @headlessui/react @heroicons/react
npm install recharts react-beautiful-dnd reactflow vis-network
npm install react-hook-form zod @hookform/resolvers
npm install date-fns clsx qrcode.react
npm install -D @types/node

# 3. Criar estrutura de pastas
mkdir -p src/{components/{Layout,Auth,CRM,Chat,Knowledge,AI,Automations,Omnichannel,Notifications,Analytics,Settings,Common},pages/{Auth,Dashboard,CRM,Chat,Knowledge,AI,Automations,Omnichannel,Settings},contexts,hooks,services,types,utils}

# 4. Criar .env
echo "VITE_API_URL=http://localhost:3000" > .env
echo "VITE_WS_URL=ws://localhost:3000" >> .env
echo "VITE_ENV=development" >> .env

# 5. Iniciar desenvolvimento
npm run dev
```

---

## 📚 REFERÊNCIAS

1. **FRONTEND_COMPLETE_GUIDE.md** - Guia completo com TODOS os detalhes
2. **ZETTEL_SYSTEM.md** - Documentação do sistema de knowledge
3. **Backend API**: `http://localhost:3000` (certifique-se de que está rodando)

---

## 🎯 RESULTADO ESPERADO

Ao final, você terá:
- ✅ Frontend completo e funcional do Completov2
- ✅ ~40 páginas implementadas
- ✅ ~60 componentes implementados
- ✅ Autenticação completa com 2FA
- ✅ Sistema de permissões RBAC
- ✅ CRM completo com IA
- ✅ Chat em tempo real
- ✅ Knowledge system estilo Obsidian
- ✅ Sistema de IA com 3 modos
- ✅ Automações com workflow visual
- ✅ Omnichannel WhatsApp
- ✅ Analytics completo
- ✅ Interface responsiva e moderna
- ✅ Tudo em português (pt-BR)

**Boa sorte! 🚀**
