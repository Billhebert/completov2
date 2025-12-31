# 🤖 PROMPT PARA IA - Implementação Frontend Completov2

> **COPIE TUDO ABAIXO E COLE NA SUA IA (ChatGPT, Claude, etc)**

---

# CONTEXTO

Você vai implementar o frontend completo de um sistema SaaS multi-tenant chamado **Completov2**. O backend já está 100% implementado e documentado.

## Sistema Overview

**Completov2** é uma plataforma empresarial que combina:
- 🏢 **CRM** - Gestão de contatos, deals, pipeline
- 💬 **Chat** - Mensageria em tempo real com WebSocket
- 🧠 **Knowledge System** - Sistema Zettel estilo Obsidian com RAG (busca semântica)
- 🤖 **IA com 3 Modos** - FULL (OpenAI), AUTO (híbrido inteligente), ECONOMICO (Ollama local)
- ⚡ **Automações** - Workflows visuais
- 📱 **Omnichannel** - WhatsApp via Evolution API
- 📊 **Analytics** - Dashboards e relatórios
- 👥 **RBAC** - Sistema de permissões hierárquico

## Características Técnicas

- ✅ Multi-tenant com isolamento de dados por empresa
- ✅ Autenticação JWT com refresh automático + 2FA
- ✅ WebSocket para chat e notificações em tempo real
- ✅ Sistema de permissões: DEV, ADMIN_GERAL (veem tudo), admin, manager, agent, viewer
- ✅ RAG com embeddings para busca semântica
- ✅ Graph visualization (Obsidian-style) com vis-network
- ✅ Todo o sistema em português (pt-BR)

---

# SUA MISSÃO

Implemente o frontend React/TypeScript seguindo EXATAMENTE as especificações abaixo.

## Stack Tecnológico OBRIGATÓRIO

```bash
# Framework
- React 18+ com TypeScript
- Vite (build tool)

# Dependências Core
- react-router-dom (v6) - routing
- axios - HTTP client
- socket.io-client - WebSocket

# UI
- tailwindcss - styling
- @headlessui/react - componentes acessíveis
- @heroicons/react - ícones

# Visualização
- recharts - gráficos
- react-beautiful-dnd - drag & drop
- reactflow - workflow editor
- vis-network - graph visualization

# Formulários
- react-hook-form
- zod
- @hookform/resolvers

# Utilidades
- date-fns
- clsx
- qrcode.react
```

## Setup Inicial

```bash
# 1. Criar projeto
npm create vite@latest completov2-frontend -- --template react-ts
cd completov2-frontend

# 2. Instalar dependências
npm install react-router-dom axios socket.io-client
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @headlessui/react @heroicons/react
npm install recharts react-beautiful-dnd reactflow vis-network
npm install react-hook-form zod @hookform/resolvers
npm install date-fns clsx qrcode.react
npm install -D @types/node

# 3. Configurar .env
cat > .env << EOF
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_ENV=development
EOF

# 4. Estrutura de pastas
mkdir -p src/{components/{Layout,Auth,CRM,Chat,Knowledge,AI,Automations,Omnichannel,Notifications,Analytics,Settings,Common},pages/{Auth,Dashboard,CRM,Chat,Knowledge,AI,Automations,Omnichannel,Settings},contexts,hooks,services,types,utils}
```

---

# ESTRUTURA DE PASTAS

```
src/
├── components/
│   ├── Layout/          # AppLayout, Sidebar, TopBar
│   ├── Auth/            # Login, Register, 2FA
│   ├── CRM/             # ContactList, DealKanban, Forms
│   ├── Chat/            # ChatInterface, MessageList, MessageInput
│   ├── Knowledge/       # ZettelList, ZettelGraph, SemanticSearch, AIQuestionAnswer
│   ├── AI/              # AIModeSwitcher, AIChat
│   ├── Automations/     # WorkflowEditor
│   ├── Omnichannel/     # WhatsAppSetup, ConversationList
│   ├── Notifications/   # NotificationBell
│   ├── Analytics/       # Dashboard, Charts
│   ├── Settings/        # Profile, Security, RBAC
│   └── Common/          # DataTable, Modal, ProtectedRoute, GlobalSearch
├── pages/               # Páginas wrapper dos componentes
├── contexts/            # AuthContext, SocketContext, AISettingsContext, EventBusContext
├── hooks/               # useAuth, usePermissions, useSocket, useChatSocket
├── services/            # api.ts, auth.service.ts, crm.service.ts, knowledge.service.ts
├── types/               # TypeScript types
└── utils/               # Helpers
```

---

# IMPLEMENTAÇÃO PASSO A PASSO

## FASE 1: API Service e Autenticação

### 1.1. API Service com Auto-Refresh

**Arquivo: `src/services/api.ts`**

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Request interceptor - adicionar token
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

// Response interceptor - auto-refresh em 401
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

### 1.2. AuthContext

**Arquivo: `src/contexts/AuthContext.tsx`**

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  avatar?: string;
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, code2FA?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string, code2FA?: string) => {
    const response = await api.post('/api/v1/auth/login', {
      email,
      password,
      code2FA,
    });

    const { accessToken, refreshToken, user: userData } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setUser(userData);
  };

  const logout = async () => {
    await api.post('/api/v1/auth/logout');
    localStorage.clear();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### 1.3. Hook de Permissões

**Arquivo: `src/hooks/usePermissions.ts`**

```typescript
import { useAuth } from '../contexts/AuthContext';

export type Permission =
  | 'CONTACT_READ' | 'CONTACT_CREATE' | 'CONTACT_UPDATE' | 'CONTACT_DELETE'
  | 'DEAL_READ' | 'DEAL_CREATE' | 'DEAL_UPDATE' | 'DEAL_DELETE'
  | 'KNOWLEDGE_READ' | 'KNOWLEDGE_CREATE' | 'KNOWLEDGE_UPDATE' | 'KNOWLEDGE_DELETE'
  | 'CHAT_READ' | 'CHAT_SEND' | 'CHAT_MODERATE'
  | 'ANALYTICS_VIEW' | 'ANALYTICS_EXPORT'
  | 'SETTINGS_UPDATE' | 'WEBHOOK_MANAGE' | 'APIKEY_CREATE';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;

    // DEV e ADMIN_GERAL têm todas as permissões
    if (user.role === 'dev' || user.role === 'admin_geral') return true;
    if (user.role === 'admin') return true;

    const rolePermissions: Record<string, Permission[]> = {
      manager: [
        'CONTACT_READ', 'CONTACT_CREATE', 'CONTACT_UPDATE', 'CONTACT_DELETE',
        'DEAL_READ', 'DEAL_CREATE', 'DEAL_UPDATE', 'DEAL_DELETE',
        'KNOWLEDGE_READ', 'KNOWLEDGE_CREATE', 'KNOWLEDGE_UPDATE', 'KNOWLEDGE_DELETE',
        'CHAT_READ', 'CHAT_SEND', 'CHAT_MODERATE',
        'ANALYTICS_VIEW', 'ANALYTICS_EXPORT'
      ],
      agent: [
        'CONTACT_READ', 'CONTACT_CREATE', 'CONTACT_UPDATE',
        'DEAL_READ', 'DEAL_CREATE', 'DEAL_UPDATE',
        'KNOWLEDGE_READ', 'KNOWLEDGE_CREATE',
        'CHAT_READ', 'CHAT_SEND'
      ],
      viewer: ['CONTACT_READ', 'DEAL_READ', 'KNOWLEDGE_READ', 'CHAT_READ', 'ANALYTICS_VIEW']
    };

    return (rolePermissions[user.role] || []).includes(permission);
  };

  return {
    hasPermission,
    isAdmin: () => user?.role === 'admin' || user?.role === 'company_admin',
    isDev: () => user?.role === 'dev',
    isAdminGeral: () => user?.role === 'admin_geral',
  };
};
```

### 1.4. ProtectedRoute

**Arquivo: `src/components/Common/ProtectedRoute.tsx`**

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions, Permission } from '../../hooks/usePermissions';

interface Props {
  children: React.ReactNode;
  permission?: Permission;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<Props> = ({ children, permission, adminOnly }) => {
  const { isAuthenticated } = useAuth();
  const { hasPermission, isAdmin } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

---

## FASE 2: Layout

### 2.1. AppLayout

**Arquivo: `src/components/Layout/AppLayout.tsx`**

```typescript
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
```

### 2.2. Sidebar

**Arquivo: `src/components/Layout/Sidebar.tsx`**

```typescript
import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

export const Sidebar: React.FC = () => {
  const { hasPermission, isAdmin } = usePermissions();

  return (
    <aside className="w-64 bg-gray-900 text-white">
      <div className="p-4">
        <h1 className="text-2xl font-bold">Completov2</h1>
      </div>

      <nav className="mt-8">
        <NavLink to="/" end className="nav-link">
          Dashboard
        </NavLink>

        {hasPermission('CONTACT_READ') && (
          <NavLink to="/crm/contacts" className="nav-link">
            CRM
          </NavLink>
        )}

        {hasPermission('CHAT_READ') && (
          <NavLink to="/chat" className="nav-link">
            Chat
          </NavLink>
        )}

        {hasPermission('KNOWLEDGE_READ') && (
          <NavLink to="/knowledge" className="nav-link">
            Knowledge
          </NavLink>
        )}

        <NavLink to="/ai/chat" className="nav-link">
          IA
        </NavLink>

        {hasPermission('WEBHOOK_MANAGE') && (
          <NavLink to="/automations/workflows" className="nav-link">
            Automações
          </NavLink>
        )}

        {isAdmin() && (
          <NavLink to="/settings/users" className="nav-link">
            Configurações
          </NavLink>
        )}
      </nav>
    </aside>
  );
};
```

---

## FASE 3: WebSocket

### 3.1. SocketContext

**Arquivo: `src/contexts/SocketContext.tsx`**

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextData {
  getSocket: (namespace: string) => Socket | undefined;
  connected: (namespace: string) => boolean;
}

const SocketContext = createContext<SocketContextData>({} as SocketContextData);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [sockets, setSockets] = useState<Map<string, Socket>>(new Map());

  useEffect(() => {
    if (!isAuthenticated) {
      sockets.forEach((socket) => socket.disconnect());
      setSockets(new Map());
    }
  }, [isAuthenticated]);

  const getSocket = (namespace: string): Socket | undefined => {
    if (!isAuthenticated) return undefined;

    if (sockets.has(namespace)) {
      return sockets.get(namespace);
    }

    const token = localStorage.getItem('accessToken');
    const socket = io(`${import.meta.env.VITE_WS_URL}${namespace}`, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => console.log(`✅ Conectado: ${namespace}`));
    socket.on('disconnect', () => console.log(`❌ Desconectado: ${namespace}`));

    setSockets((prev) => new Map(prev).set(namespace, socket));
    return socket;
  };

  const connected = (namespace: string): boolean => {
    return sockets.get(namespace)?.connected || false;
  };

  return (
    <SocketContext.Provider value={{ getSocket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (namespace: string) => {
  const { getSocket, connected } = useContext(SocketContext);
  const socket = getSocket(namespace);
  return { socket, connected: connected(namespace) };
};
```

---

## FASE 4: Componentes Principais

### 4.1. ChatInterface

**Arquivo: `src/components/Chat/ChatInterface.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';

export const ChatInterface: React.FC = () => {
  const { socket } = useSocket('/chat');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('message:new', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('message:new');
    };
  }, [socket]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !input.trim() || !selectedChannel) return;

    socket.emit('message:send', {
      channelId: selectedChannel,
      content: input,
    });

    setInput('');
  };

  return (
    <div className="flex h-full">
      <div className="w-64 bg-white border-r">
        {/* Lista de canais */}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((msg) => (
            <div key={msg.id} className="mb-4">
              <strong>{msg.author?.name}:</strong> {msg.content}
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="p-4 border-t">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full border rounded px-4 py-2"
            placeholder="Digite sua mensagem..."
          />
        </form>
      </div>
    </div>
  );
};
```

### 4.2. ZettelGraph (Obsidian-style)

**Arquivo: `src/components/Knowledge/ZettelGraph.tsx`**

```typescript
import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import api from '../../services/api';

export const ZettelGraph: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = async () => {
    try {
      const response = await api.get('/api/v1/knowledge/graph/obsidian');
      const { nodes, edges } = response.data;

      if (containerRef.current) {
        const network = new Network(
          containerRef.current,
          { nodes, edges },
          {
            nodes: { shape: 'dot', font: { size: 14 } },
            edges: { width: 2, smooth: { type: 'continuous' } },
            physics: { barnesHut: { gravitationalConstant: -8000 } },
          }
        );

        network.on('click', (params) => {
          if (params.nodes.length > 0) {
            window.location.href = `/knowledge/${params.nodes[0]}`;
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar grafo:', error);
    }
  };

  return <div ref={containerRef} style={{ width: '100%', height: '800px' }} />;
};
```

### 4.3. SemanticSearch (RAG)

**Arquivo: `src/components/Knowledge/SemanticSearch.tsx`**

```typescript
import React, { useState } from 'react';
import api from '../../services/api';

export const SemanticSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/api/v1/knowledge/search/semantic', {
        query,
        limit: 10,
        minScore: 0.7,
      });
      setResults(response.data.results);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por significado..."
          className="w-full border rounded px-4 py-2"
        />
        <button type="submit" disabled={loading} className="mt-2 btn-primary">
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.id} className="card">
            <h3 className="font-bold">{result.title}</h3>
            <p className="text-gray-600">{result.content.substring(0, 200)}...</p>
            <span className="text-sm text-blue-600">
              Relevância: {(result.relevanceScore * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 4.4. AIModeSwitcher

**Arquivo: `src/components/AI/AIModeSwitcher.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

type AIMode = 'full' | 'auto' | 'economico';

export const AIModeSwitcher: React.FC = () => {
  const [mode, setModeState] = useState<AIMode>('auto');

  useEffect(() => {
    loadMode();
  }, []);

  const loadMode = async () => {
    const response = await api.get('/api/v1/ai/mode');
    setModeState(response.data.mode);
  };

  const setMode = async (newMode: AIMode) => {
    await api.post('/api/v1/ai/mode', { mode: newMode });
    setModeState(newMode);
  };

  const modes = [
    { id: 'full', name: 'FULL', desc: 'Sempre OpenAI (melhor, pago)', icon: '🚀' },
    { id: 'auto', name: 'AUTO', desc: 'IA decide (híbrido)', icon: '🧠' },
    { id: 'economico', name: 'ECONÔMICO', desc: 'Sempre Ollama (grátis)', icon: '💰' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {modes.map((m) => (
        <div
          key={m.id}
          onClick={() => setMode(m.id as AIMode)}
          className={`card cursor-pointer ${mode === m.id ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="text-4xl mb-2">{m.icon}</div>
          <h3 className="font-bold">{m.name}</h3>
          <p className="text-sm text-gray-600">{m.desc}</p>
        </div>
      ))}
    </div>
  );
};
```

### 4.5. DealKanban

**Arquivo: `src/components/CRM/DealKanban.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../../services/api';

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

export const DealKanban: React.FC = () => {
  const [dealsByStage, setDealsByStage] = useState<Record<string, any[]>>({});

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    const response = await api.get('/api/v1/crm/deals');
    const grouped = response.data.reduce((acc: any, deal: any) => {
      if (!acc[deal.stage]) acc[deal.stage] = [];
      acc[deal.stage].push(deal);
      return acc;
    }, {});
    setDealsByStage(grouped);
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const dealId = result.draggableId;
    const newStage = result.destination.droppableId;

    await api.patch(`/api/v1/crm/deals/${dealId}/stage`, { stage: newStage });
    loadDeals();
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto">
        {STAGES.map((stage) => (
          <Droppable key={stage} droppableId={stage}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="w-80 bg-gray-100 rounded p-4"
              >
                <h3 className="font-bold mb-4">{stage}</h3>
                {(dealsByStage[stage] || []).map((deal, index) => (
                  <Draggable key={deal.id} draggableId={deal.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="card mb-2"
                      >
                        <h4 className="font-semibold">{deal.title}</h4>
                        <p>R$ {deal.value.toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};
```

---

## FASE 5: Rotas

**Arquivo: `src/App.tsx`**

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { AppLayout } from './components/Layout/AppLayout';
import { ProtectedRoute } from './components/Common/ProtectedRoute';
import { LoginPage } from './pages/Auth/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { ContactsPage } from './pages/CRM/ContactsPage';
import { ChatPage } from './pages/Chat/ChatPage';
import { KnowledgePage } from './pages/Knowledge/KnowledgePage';
import { GraphPage } from './pages/Knowledge/GraphPage';
import { AIChatPage } from './pages/AI/AIChatPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

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
              <Route path="/ai/chat" element={<AIChatPage />} />
            </Route>
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

---

## FASE 6: Styling

**Arquivo: `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .nav-link {
    @apply block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition;
  }

  .nav-link.active {
    @apply bg-gray-800 text-white;
  }

  .card {
    @apply bg-white rounded-lg shadow p-4;
  }

  .btn-primary {
    @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition;
  }

  .btn-secondary {
    @apply bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition;
  }
}
```

---

# ENDPOINTS DA API

## Autenticação
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Registro
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/2fa/setup` - Setup 2FA
- `POST /api/v1/auth/2fa/verify` - Verificar 2FA

## CRM
- `GET /api/v1/crm/contacts` - Listar contatos
- `POST /api/v1/crm/contacts` - Criar contato
- `GET /api/v1/crm/deals` - Listar deals
- `POST /api/v1/crm/deals` - Criar deal
- `PATCH /api/v1/crm/deals/:id/stage` - Atualizar estágio

## Chat (REST + WebSocket)
- `GET /api/v1/chat/channels` - Listar canais
- `POST /api/v1/chat/messages` - Enviar mensagem
- **WebSocket `/chat`**: `message:send`, `message:new`, `typing:start`, `typing:stop`

## Knowledge (Zettel)
- `GET /api/v1/knowledge/nodes` - Listar zettels
- `POST /api/v1/knowledge/nodes` - Criar zettel
- `GET /api/v1/knowledge/graph/obsidian` - Grafo Obsidian
- `POST /api/v1/knowledge/search/semantic` - Busca semântica (RAG)
- `POST /api/v1/knowledge/ask` - Perguntar à IA (Q&A)

## IA
- `GET /api/v1/ai/mode` - Modo atual
- `POST /api/v1/ai/mode` - Alterar modo
- `POST /api/v1/ai/chat` - Chat com IA

## Notificações
- `GET /api/v1/notifications` - Listar notificações
- `POST /api/v1/notifications/:id/read` - Marcar como lida

## Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard

---

# INSTRUÇÕES FINAIS

## ✅ FAÇA:
1. Copie EXATAMENTE os códigos acima
2. Use TypeScript em tudo
3. Adicione loading states
4. Trate erros com try/catch
5. Mantenha tudo em português
6. Use TailwindCSS
7. Teste cada feature

## ❌ NÃO FAÇA:
1. NÃO invente endpoints
2. NÃO use Redux
3. NÃO ignore o auto-refresh de token
4. NÃO esqueça WebSocket para chat

## Prioridades:
1. **P0:** Autenticação, Layout, CRM básico, Chat básico
2. **P1:** Knowledge + RAG, IA, Notificações
3. **P2:** Automações, Omnichannel, RBAC avançado

## Próximos Passos:
1. Execute os comandos de setup
2. Crie os arquivos na ordem das fases
3. Teste cada componente
4. Adicione as páginas restantes
5. Implemente funcionalidades avançadas

**Backend:** http://localhost:3000 (certifique-se de que está rodando)

---

**BOA SORTE! 🚀**
