# 📱 Guia Completo do Frontend - Completov2

> **Objetivo:** Documentação completa de 100% das funcionalidades que o frontend precisa implementar para ter o sistema completo.

---

## 📑 Índice

1. [Estrutura de Rotas e Páginas](#estrutura-de-rotas-e-páginas)
2. [Autenticação e Autorização](#autenticação-e-autorização)
3. [Componentes Necessários](#componentes-necessários)
4. [Estados Globais e Contextos](#estados-globais-e-contextos)
5. [Integrações](#integrações)
6. [Módulos Detalhados](#módulos-detalhados)
7. [Exemplos de Código](#exemplos-de-código)
8. [Fluxos de Usuário](#fluxos-de-usuário)
9. [WebSocket e Tempo Real](#websocket-e-tempo-real)
10. [Sistema de IA (3 Modos)](#sistema-de-ia-3-modos)
11. [Sistema de Zettels (Obsidian)](#sistema-de-zettels-obsidian)
12. [Checklist de Implementação](#checklist-de-implementação)

---

## 🗺️ Estrutura de Rotas e Páginas

### **Rotas Públicas** (sem autenticação)

```
/login                          - Página de login
/register                       - Registro de nova empresa
/forgot-password                - Recuperação de senha
/reset-password/:token          - Resetar senha
```

### **Rotas Privadas** (requerem autenticação)

#### **Dashboard e Início**
```
/                               - Dashboard principal (analytics overview)
/dashboard                      - Mesmo que / (redirect)
```

#### **CRM**
```
/crm/contacts                   - Lista de contatos (tabela + filtros)
/crm/contacts/new               - Criar novo contato
/crm/contacts/:id               - Detalhes do contato
/crm/contacts/:id/edit          - Editar contato

/crm/deals                      - Lista de deals (kanban + tabela)
/crm/deals/new                  - Criar novo deal
/crm/deals/:id                  - Detalhes do deal
/crm/deals/:id/edit             - Editar deal

/crm/interactions               - Histórico de interações
/crm/interactions/new           - Registrar nova interação

/crm/pipeline                   - Visualização de pipeline
/crm/analytics                  - Analytics do CRM
```

#### **Chat (Mensageria)**
```
/chat                           - Interface de chat principal
/chat/:channelId                - Chat em canal específico
/chat/direct/:userId            - Mensagem direta com usuário
/chat/settings                  - Configurações do chat
```

#### **Knowledge (Sistema Zettel)**
```
/knowledge                      - Lista de zettels (grid/lista)
/knowledge/new                  - Criar novo zettel
/knowledge/:id                  - Visualizar zettel
/knowledge/:id/edit             - Editar zettel

/knowledge/graph                - Visualização gráfico (Obsidian-style)
/knowledge/search               - Busca semântica (RAG)
/knowledge/tags                 - Explorar por tags

/knowledge/ask                  - Perguntar à IA (Q&A com RAG)
```

#### **IA (Sistema de 3 Modos)**
```
/ai/chat                        - Chat com IA (sem RAG)
/ai/settings                    - Configurar modo de IA (FULL/AUTO/ECONOMICO)
/ai/usage                       - Estatísticas de uso de IA
```

#### **Automações**
```
/automations/workflows          - Lista de workflows
/automations/workflows/new      - Criar workflow
/automations/workflows/:id      - Editor visual de workflow
/automations/executions         - Histórico de execuções
/automations/suggestions        - Sugestões de automação (IA)
```

#### **Omnichannel**
```
/omnichannel/conversations      - Lista de conversas
/omnichannel/conversations/:id  - Conversa específica

/omnichannel/whatsapp           - Contas WhatsApp
/omnichannel/whatsapp/new       - Conectar WhatsApp
/omnichannel/whatsapp/:id       - Gerenciar conta WhatsApp
```

#### **Notificações**
```
/notifications                  - Centro de notificações
/notifications/settings         - Configurar notificações
```

#### **Analytics e Relatórios**
```
/analytics/dashboard            - Dashboard de analytics
/analytics/timeseries           - Gráficos de série temporal
/analytics/pipeline             - Analytics de pipeline
/analytics/activity             - Atividade de usuários
/analytics/export               - Exportar dados
```

#### **Configurações**
```
/settings/profile               - Perfil do usuário
/settings/security              - Segurança (senha, 2FA)
/settings/company               - Configurações da empresa

/settings/users                 - Gerenciar usuários (admin)
/settings/users/new             - Criar novo usuário
/settings/users/:id             - Editar usuário

/settings/rbac/departments      - Gerenciar departamentos
/settings/rbac/roles            - Gerenciar papéis (roles)
/settings/rbac/permissions      - Gerenciar permissões

/settings/integrations          - Integrações
/settings/webhooks              - Webhooks
/settings/api-keys              - Chaves de API
```

#### **Arquivos**
```
/files                          - Gerenciador de arquivos
/files/:id                      - Visualizar arquivo
```

#### **Busca Global**
```
/search?q=termo                 - Busca global no sistema
```

#### **Audit e Logs** (admin apenas)
```
/audit                          - Logs de auditoria
/audit/:id                      - Detalhes de log
```

---

## 🔐 Autenticação e Autorização

### **1. Sistema de Autenticação JWT**

#### **Fluxo de Login**
```typescript
// services/auth.service.ts
export class AuthService {
  async login(email: string, password: string, code2FA?: string) {
    const response = await api.post('/api/v1/auth/login', {
      email,
      password,
      code2FA
    });

    // Salvar tokens
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    return response.data;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await api.post('/api/v1/auth/refresh', { refreshToken });

    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);

    return response.data;
  }

  async logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    await api.post('/api/v1/auth/logout');
  }

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }
}
```

#### **Interceptor Axios para Auto-Refresh**
```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
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
        const response = await axios.post('/api/v1/auth/refresh', { refreshToken });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Logout se refresh falhar
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

### **2. Sistema de Permissões (RBAC)**

#### **Hook de Permissões**
```typescript
// hooks/usePermissions.ts
import { useAuth } from '../contexts/AuthContext';

export type Permission =
  | 'USER_READ' | 'USER_CREATE' | 'USER_UPDATE' | 'USER_DELETE'
  | 'CONTACT_READ' | 'CONTACT_CREATE' | 'CONTACT_UPDATE' | 'CONTACT_DELETE'
  | 'DEAL_READ' | 'DEAL_CREATE' | 'DEAL_UPDATE' | 'DEAL_DELETE'
  | 'KNOWLEDGE_READ' | 'KNOWLEDGE_CREATE' | 'KNOWLEDGE_UPDATE' | 'KNOWLEDGE_DELETE'
  | 'CHAT_READ' | 'CHAT_SEND' | 'CHAT_MODERATE'
  | 'ANALYTICS_VIEW' | 'ANALYTICS_EXPORT'
  | 'SETTINGS_READ' | 'SETTINGS_UPDATE'
  | 'WEBHOOK_READ' | 'WEBHOOK_MANAGE'
  | 'APIKEY_READ' | 'APIKEY_CREATE' | 'APIKEY_REVOKE';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;

    // DEV e ADMIN_GERAL têm todas as permissões
    if (user.role === 'dev' || user.role === 'admin_geral') {
      return true;
    }

    // Admin tem todas as permissões
    if (user.role === 'admin') {
      return true;
    }

    // Mapear permissões por role
    const rolePermissions: Record<string, Permission[]> = {
      manager: [
        'USER_READ', 'CONTACT_READ', 'CONTACT_CREATE', 'CONTACT_UPDATE', 'CONTACT_DELETE',
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
      viewer: [
        'CONTACT_READ', 'DEAL_READ', 'KNOWLEDGE_READ', 'CHAT_READ', 'ANALYTICS_VIEW'
      ]
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (...permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };

  const hasAllPermissions = (...permissions: Permission[]): boolean => {
    return permissions.every(p => hasPermission(p));
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin' || user?.role === 'company_admin';
  };

  const isDev = (): boolean => {
    return user?.role === 'dev';
  };

  const isAdminGeral = (): boolean => {
    return user?.role === 'admin_geral';
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isDev,
    isAdminGeral,
  };
};
```

#### **Componente de Proteção de Rota**
```typescript
// components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions, Permission } from '../hooks/usePermissions';

interface Props {
  children: React.ReactNode;
  permission?: Permission;
  anyPermissions?: Permission[];
  allPermissions?: Permission[];
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<Props> = ({
  children,
  permission,
  anyPermissions,
  allPermissions,
  adminOnly,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin } = usePermissions();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  if (anyPermissions && !hasAnyPermission(...anyPermissions)) {
    return <Navigate to="/" replace />;
  }

  if (allPermissions && !hasAllPermissions(...allPermissions)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

### **3. Setup 2FA (Two-Factor Authentication)**

#### **Página de Configuração 2FA**
```typescript
// pages/Settings/Security2FA.tsx
import React, { useState } from 'react';
import api from '../../services/api';
import QRCode from 'qrcode.react';

export const Security2FA: React.FC = () => {
  const [step, setStep] = useState<'setup' | 'verify' | 'enabled'>('setup');
  const [password, setPassword] = useState('');
  const [qrCode, setQRCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');

  const handleSetup2FA = async () => {
    try {
      const response = await api.post('/api/v1/auth/2fa/setup', { password });
      setQRCode(response.data.qrCode);
      setBackupCodes(response.data.backupCodes);
      setStep('verify');
    } catch (error) {
      console.error('Erro ao configurar 2FA:', error);
    }
  };

  const handleVerify = async () => {
    try {
      await api.post('/api/v1/auth/2fa/verify', { token: verificationCode });
      setStep('enabled');
    } catch (error) {
      console.error('Erro ao verificar 2FA:', error);
    }
  };

  return (
    <div className="2fa-setup">
      {step === 'setup' && (
        <div>
          <h2>Configurar Autenticação em Duas Etapas</h2>
          <input
            type="password"
            placeholder="Sua senha atual"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleSetup2FA}>Configurar 2FA</button>
        </div>
      )}

      {step === 'verify' && (
        <div>
          <h2>Escaneie o QR Code</h2>
          <QRCode value={qrCode} size={256} />

          <h3>Códigos de Backup</h3>
          <ul>
            {backupCodes.map((code, i) => <li key={i}>{code}</li>)}
          </ul>

          <input
            type="text"
            placeholder="Código de verificação"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          <button onClick={handleVerify}>Verificar e Ativar</button>
        </div>
      )}

      {step === 'enabled' && (
        <div>
          <h2>✅ 2FA Ativado com Sucesso!</h2>
        </div>
      )}
    </div>
  );
};
```

---

## 🧩 Componentes Necessários

### **Layout e Estrutura**

#### **1. AppLayout** - Layout principal da aplicação
```typescript
// components/Layout/AppLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { NotificationCenter } from '../Notifications/NotificationCenter';

export const AppLayout: React.FC = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
      <NotificationCenter />
    </div>
  );
};
```

#### **2. Sidebar** - Menu lateral de navegação
```typescript
// components/Layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

export const Sidebar: React.FC = () => {
  const { hasPermission, isAdmin } = usePermissions();

  return (
    <aside className="sidebar">
      <div className="logo">
        <img src="/logo.svg" alt="Completov2" />
      </div>

      <nav>
        <NavLink to="/" end>
          <i className="icon-dashboard" /> Dashboard
        </NavLink>

        {hasPermission('CONTACT_READ') && (
          <NavLink to="/crm/contacts">
            <i className="icon-contacts" /> CRM
          </NavLink>
        )}

        {hasPermission('CHAT_READ') && (
          <NavLink to="/chat">
            <i className="icon-chat" /> Chat
          </NavLink>
        )}

        {hasPermission('KNOWLEDGE_READ') && (
          <NavLink to="/knowledge">
            <i className="icon-knowledge" /> Knowledge
          </NavLink>
        )}

        <NavLink to="/ai/chat">
          <i className="icon-ai" /> IA
        </NavLink>

        {hasPermission('WEBHOOK_READ') && (
          <NavLink to="/automations/workflows">
            <i className="icon-automation" /> Automações
          </NavLink>
        )}

        <NavLink to="/omnichannel/conversations">
          <i className="icon-omnichannel" /> Omnichannel
        </NavLink>

        {hasPermission('ANALYTICS_VIEW') && (
          <NavLink to="/analytics/dashboard">
            <i className="icon-analytics" /> Analytics
          </NavLink>
        )}

        {isAdmin() && (
          <NavLink to="/settings/users">
            <i className="icon-settings" /> Configurações
          </NavLink>
        )}
      </nav>
    </aside>
  );
};
```

#### **3. TopBar** - Barra superior com busca e perfil
```typescript
// components/Layout/TopBar.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GlobalSearch } from '../Search/GlobalSearch';
import { NotificationBell } from '../Notifications/NotificationBell';

export const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <GlobalSearch />

      <div className="topbar-actions">
        <NotificationBell />

        <div className="user-menu">
          <button onClick={() => setShowUserMenu(!showUserMenu)}>
            <img src={user?.avatar || '/default-avatar.png'} alt={user?.name} />
            <span>{user?.name}</span>
          </button>

          {showUserMenu && (
            <div className="dropdown">
              <button onClick={() => navigate('/settings/profile')}>Perfil</button>
              <button onClick={() => navigate('/settings/security')}>Segurança</button>
              <button onClick={handleLogout}>Sair</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
```

### **CRM Components**

#### **4. ContactList** - Lista de contatos
```typescript
// components/CRM/ContactList.tsx
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { DataTable } from '../Common/DataTable';
import { ContactFilters } from './ContactFilters';

export const ContactList: React.FC = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadContacts();
  }, [filters]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/crm/contacts', { params: filters });
      setContacts(response.data);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefone' },
    { key: 'companyName', label: 'Empresa' },
    { key: 'tags', label: 'Tags', render: (tags) => tags.join(', ') },
  ];

  return (
    <div className="contact-list">
      <ContactFilters onChange={setFilters} />
      <DataTable
        data={contacts}
        columns={columns}
        loading={loading}
        onRowClick={(contact) => navigate(`/crm/contacts/${contact.id}`)}
      />
    </div>
  );
};
```

#### **5. DealKanban** - Kanban de deals
```typescript
// components/CRM/DealKanban.tsx
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
    const grouped = response.data.reduce((acc, deal) => {
      if (!acc[deal.stage]) acc[deal.stage] = [];
      acc[deal.stage].push(deal);
      return acc;
    }, {});
    setDealsByStage(grouped);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStage = destination.droppableId;

    await api.patch(`/api/v1/crm/deals/${draggableId}/stage`, { stage: newStage });
    loadDeals();
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {STAGES.map((stage) => (
          <Droppable key={stage} droppableId={stage}>
            {(provided) => (
              <div
                className="kanban-column"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <h3>{stage}</h3>
                {(dealsByStage[stage] || []).map((deal, index) => (
                  <Draggable key={deal.id} draggableId={deal.id} index={index}>
                    {(provided) => (
                      <div
                        className="kanban-card"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <h4>{deal.title}</h4>
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

### **Chat Components**

#### **6. ChatInterface** - Interface principal do chat
```typescript
// components/Chat/ChatInterface.tsx
import React, { useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { ChannelList } from './ChannelList';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export const ChatInterface: React.FC = () => {
  const { socket, connected } = useSocket('/chat');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('message:new', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('message:edited', (updated) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
    });

    socket.on('message:deleted', ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    return () => {
      socket.off('message:new');
      socket.off('message:edited');
      socket.off('message:deleted');
    };
  }, [socket]);

  const handleSendMessage = (content: string) => {
    if (!socket || !selectedChannel) return;

    socket.emit('message:send', {
      channelId: selectedChannel,
      content,
    });
  };

  return (
    <div className="chat-interface">
      <ChannelList
        selectedChannel={selectedChannel}
        onSelectChannel={setSelectedChannel}
      />
      <div className="chat-main">
        <MessageList messages={messages} />
        <MessageInput onSend={handleSendMessage} />
      </div>
    </div>
  );
};
```

#### **7. MessageInput** - Input de mensagem com typing indicator
```typescript
// components/Chat/MessageInput.tsx
import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';

interface Props {
  onSend: (content: string) => void;
  channelId?: string;
}

export const MessageInput: React.FC<Props> = ({ onSend, channelId }) => {
  const { socket } = useSocket('/chat');
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!socket || !channelId) return;

    let timeout: NodeJS.Timeout;

    if (isTyping) {
      socket.emit('typing:start', { channelId });

      timeout = setTimeout(() => {
        socket.emit('typing:stop', { channelId });
        setIsTyping(false);
      }, 3000);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
      if (isTyping) {
        socket.emit('typing:stop', { channelId });
      }
    };
  }, [isTyping, socket, channelId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (!isTyping) setIsTyping(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSend(content);
    setContent('');
    setIsTyping(false);
  };

  return (
    <form onSubmit={handleSubmit} className="message-input">
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Digite sua mensagem..."
      />
      <button type="submit">Enviar</button>
    </form>
  );
};
```

### **Knowledge Components**

#### **8. ZettelGraph** - Visualização gráfico Obsidian-style
```typescript
// components/Knowledge/ZettelGraph.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import api from '../../services/api';

export const ZettelGraph: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = async () => {
    try {
      const response = await api.get('/api/v1/knowledge/graph/obsidian');
      const { nodes, edges } = response.data;

      if (containerRef.current) {
        const data = {
          nodes: nodes.map((n) => ({
            id: n.id,
            label: n.label,
            color: n.color,
            size: n.size,
            title: n.type, // tooltip
          })),
          edges: edges.map((e) => ({
            from: e.from,
            to: e.to,
            label: e.label,
            color: e.color,
            arrows: e.arrows,
          })),
        };

        const options = {
          nodes: {
            shape: 'dot',
            font: { size: 14, color: '#333' },
          },
          edges: {
            width: 2,
            smooth: { type: 'continuous' },
          },
          physics: {
            stabilization: false,
            barnesHut: {
              gravitationalConstant: -8000,
              springConstant: 0.04,
              springLength: 95,
            },
          },
          interaction: {
            hover: true,
            tooltipDelay: 200,
          },
        };

        networkRef.current = new Network(containerRef.current, data, options);

        // Evento de clique em nó
        networkRef.current.on('click', (params) => {
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            window.location.href = `/knowledge/${nodeId}`;
          }
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar grafo:', error);
      setLoading(false);
    }
  };

  return (
    <div className="zettel-graph">
      {loading && <div className="loading">Carregando grafo...</div>}
      <div ref={containerRef} style={{ width: '100%', height: '800px' }} />
    </div>
  );
};
```

#### **9. SemanticSearch** - Busca semântica com RAG
```typescript
// components/Knowledge/SemanticSearch.tsx
import React, { useState } from 'react';
import api from '../../services/api';

export const SemanticSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
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
      console.error('Erro na busca semântica:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="semantic-search">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por significado..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      <div className="results">
        {results.map((result) => (
          <div key={result.id} className="result-card">
            <h3>{result.title}</h3>
            <p>{result.content.substring(0, 200)}...</p>
            <div className="meta">
              <span className="relevance">
                Relevância: {(result.relevanceScore * 100).toFixed(0)}%
              </span>
              <span className="type">{result.nodeType}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### **10. AIQuestionAnswer** - Perguntas e respostas com IA
```typescript
// components/Knowledge/AIQuestionAnswer.tsx
import React, { useState } from 'react';
import api from '../../services/api';

export const AIQuestionAnswer: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/api/v1/knowledge/ask', {
        question,
        maxContext: 5,
      });
      setAnswer(response.data);
    } catch (error) {
      console.error('Erro ao perguntar à IA:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-question-answer">
      <form onSubmit={handleAsk}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Faça uma pergunta sobre sua base de conhecimento..."
          rows={4}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Perguntando à IA...' : 'Perguntar'}
        </button>
      </form>

      {answer && (
        <div className="answer-card">
          <div className="answer-header">
            <span className="confidence">{answer.confidence}</span>
            <span className="model">{answer.provider}</span>
          </div>

          <div className="answer-content">
            <p>{answer.answer}</p>
          </div>

          <div className="sources">
            <h4>Fontes:</h4>
            <ul>
              {answer.sources.map((source, i) => (
                <li key={i}>
                  <a href={`/knowledge/${source.id}`}>
                    {source.title} ({(source.relevance * 100).toFixed(0)}%)
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
```

### **Notification Components**

#### **11. NotificationBell** - Sino de notificações
```typescript
// components/Notifications/NotificationBell.tsx
import React, { useEffect, useState } from 'react';
import { useEventBus } from '../../hooks/useEventBus';
import api from '../../services/api';

export const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { subscribe } = useEventBus();

  useEffect(() => {
    loadNotifications();

    // Escutar novas notificações
    const unsubscribe = subscribe('NOTIFICATION_CREATED', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return unsubscribe;
  }, [subscribe]);

  const loadNotifications = async () => {
    try {
      const response = await api.get('/api/v1/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter((n) => !n.readAt).length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/api/v1/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
      );
      setUnreadCount((prev) => prev - 1);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  return (
    <div className="notification-bell">
      <button onClick={() => setShowDropdown(!showDropdown)}>
        <i className="icon-bell" />
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="header">
            <h3>Notificações</h3>
            <button onClick={() => api.post('/api/v1/notifications/read-all')}>
              Marcar todas como lidas
            </button>
          </div>

          <div className="list">
            {notifications.slice(0, 10).map((n) => (
              <div
                key={n.id}
                className={`notification-item ${!n.readAt ? 'unread' : ''}`}
                onClick={() => markAsRead(n.id)}
              >
                <div className="content">
                  <h4>{n.title}</h4>
                  <p>{n.body}</p>
                </div>
                <div className="meta">
                  <span className="time">{formatRelativeTime(n.createdAt)}</span>
                  {n.aiPriority > 0.7 && <span className="priority-badge">Alta</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### **Automation Components**

#### **12. WorkflowEditor** - Editor visual de workflows
```typescript
// components/Automations/WorkflowEditor.tsx
import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import api from '../../services/api';

export const WorkflowEditor: React.FC<{ workflowId?: string }> = ({ workflowId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('');

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const saveWorkflow = async () => {
    const definition = { nodes, edges };

    if (workflowId) {
      await api.patch(`/api/v1/automations/workflows/${workflowId}`, {
        definition,
      });
    } else {
      await api.post('/api/v1/automations/workflows', {
        name: workflowName,
        definition,
      });
    }
  };

  return (
    <div className="workflow-editor">
      <div className="toolbar">
        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="Nome do workflow"
        />
        <button onClick={saveWorkflow}>Salvar</button>
      </div>

      <div style={{ width: '100%', height: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};
```

### **Omnichannel Components**

#### **13. WhatsAppSetup** - Configurar WhatsApp
```typescript
// components/Omnichannel/WhatsAppSetup.tsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import QRCode from 'qrcode.react';

export const WhatsAppSetup: React.FC = () => {
  const [accounts, setAccounts] = useState([]);
  const [qrCode, setQRCode] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    instanceName: '',
    apiUrl: '',
    apiKey: '',
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const response = await api.get('/api/v1/omnichannel/whatsapp/accounts');
    setAccounts(response.data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/v1/omnichannel/whatsapp/accounts', formData);
      const accountId = response.data.id;

      // Buscar QR Code
      const qrResponse = await api.get(
        `/api/v1/omnichannel/whatsapp/accounts/${accountId}/qrcode`
      );
      setQRCode(qrResponse.data.qrCode);
    } catch (error) {
      console.error('Erro ao criar conta WhatsApp:', error);
    }
  };

  return (
    <div className="whatsapp-setup">
      <button onClick={() => setShowSetup(true)}>Conectar WhatsApp</button>

      {showSetup && (
        <div className="setup-modal">
          <form onSubmit={handleCreate}>
            <input
              type="text"
              placeholder="Nome da conta"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Nome da instância"
              value={formData.instanceName}
              onChange={(e) =>
                setFormData({ ...formData, instanceName: e.target.value })
              }
            />
            <input
              type="url"
              placeholder="URL da API"
              value={formData.apiUrl}
              onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
            />
            <input
              type="text"
              placeholder="API Key"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            />
            <button type="submit">Conectar</button>
          </form>

          {qrCode && (
            <div className="qr-code-display">
              <h3>Escaneie o QR Code no WhatsApp</h3>
              <QRCode value={qrCode} size={256} />
            </div>
          )}
        </div>
      )}

      <div className="accounts-list">
        {accounts.map((account) => (
          <div key={account.id} className="account-card">
            <h4>{account.name}</h4>
            <p>Status: {account.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### **Common/Utility Components**

#### **14. DataTable** - Tabela de dados reutilizável
```typescript
// components/Common/DataTable.tsx
import React from 'react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface Props {
  data: any[];
  columns: Column[];
  loading?: boolean;
  onRowClick?: (row: any) => void;
}

export const DataTable: React.FC<Props> = ({
  data,
  columns,
  loading,
  onRowClick,
}) => {
  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr
            key={i}
            onClick={() => onRowClick?.(row)}
            className={onRowClick ? 'clickable' : ''}
          >
            {columns.map((col) => (
              <td key={col.key}>
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

#### **15. GlobalSearch** - Busca global
```typescript
// components/Search/GlobalSearch.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await api.get('/api/v1/search', { params: { q: query } });
        setResults(response.data);
        setShowResults(true);
      } catch (error) {
        console.error('Erro na busca:', error);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleResultClick = (type: string, id: string) => {
    const routes: Record<string, string> = {
      contacts: `/crm/contacts/${id}`,
      deals: `/crm/deals/${id}`,
      knowledge: `/knowledge/${id}`,
      users: `/settings/users/${id}`,
    };

    navigate(routes[type] || '/');
    setShowResults(false);
    setQuery('');
  };

  return (
    <div className="global-search">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar em tudo..."
      />

      {showResults && results && (
        <div className="search-results">
          {Object.entries(results).map(([type, items]: [string, any]) => (
            items.length > 0 && (
              <div key={type} className="result-group">
                <h4>{type}</h4>
                {items.map((item: any) => (
                  <div
                    key={item.id}
                    className="result-item"
                    onClick={() => handleResultClick(type, item.id)}
                  >
                    {item.name || item.title}
                  </div>
                ))}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 🌐 Estados Globais e Contextos

### **1. AuthContext** - Contexto de autenticação
```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/auth.service';

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
  const authService = new AuthService();

  useEffect(() => {
    const storedUser = authService.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const login = async (email: string, password: string, code2FA?: string) => {
    const data = await authService.login(email, password, code2FA);
    setUser(data.user);
  };

  const logout = async () => {
    await authService.logout();
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

### **2. SocketContext** - Contexto de WebSocket
```typescript
// contexts/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextData {
  sockets: Map<string, Socket>;
  getSocket: (namespace: string) => Socket | undefined;
  connected: (namespace: string) => boolean;
}

const SocketContext = createContext<SocketContextData>({} as SocketContextData);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [sockets, setSockets] = useState<Map<string, Socket>>(new Map());

  useEffect(() => {
    if (!isAuthenticated) {
      // Desconectar todos os sockets ao fazer logout
      sockets.forEach((socket) => socket.disconnect());
      setSockets(new Map());
    }
  }, [isAuthenticated, sockets]);

  const getSocket = (namespace: string): Socket | undefined => {
    if (!isAuthenticated) return undefined;

    if (sockets.has(namespace)) {
      return sockets.get(namespace);
    }

    // Criar novo socket
    const token = localStorage.getItem('accessToken');
    const socket = io(`${process.env.REACT_APP_WS_URL || 'ws://localhost:3000'}${namespace}`, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log(`✅ Conectado ao namespace: ${namespace}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Desconectado do namespace: ${namespace}`);
    });

    socket.on('error', (error) => {
      console.error(`Erro no socket ${namespace}:`, error);
    });

    setSockets((prev) => new Map(prev).set(namespace, socket));
    return socket;
  };

  const connected = (namespace: string): boolean => {
    const socket = sockets.get(namespace);
    return socket?.connected || false;
  };

  return (
    <SocketContext.Provider value={{ sockets, getSocket, connected }}>
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

### **3. EventBusContext** - Contexto do EventBus
```typescript
// contexts/EventBusContext.tsx
import React, { createContext, useContext, useEffect, useRef } from 'react';

type EventHandler = (data: any) => void;

interface EventBusContextData {
  emit: (event: string, data?: any) => void;
  subscribe: (event: string, handler: EventHandler) => () => void;
}

const EventBusContext = createContext<EventBusContextData>({} as EventBusContextData);

export const EventBusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const listenersRef = useRef<Map<string, Set<EventHandler>>>(new Map());

  const emit = (event: string, data?: any) => {
    const listeners = listenersRef.current.get(event);
    if (listeners) {
      listeners.forEach((handler) => handler(data));
    }
  };

  const subscribe = (event: string, handler: EventHandler) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }

    listenersRef.current.get(event)!.add(handler);

    // Retornar função de cleanup
    return () => {
      const listeners = listenersRef.current.get(event);
      if (listeners) {
        listeners.delete(handler);
      }
    };
  };

  return (
    <EventBusContext.Provider value={{ emit, subscribe }}>
      {children}
    </EventBusContext.Provider>
  );
};

export const useEventBus = () => useContext(EventBusContext);
```

### **4. AISettingsContext** - Contexto de configurações de IA
```typescript
// contexts/AISettingsContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

type AIMode = 'full' | 'auto' | 'economico';

interface AISettingsContextData {
  mode: AIMode;
  setMode: (mode: AIMode) => Promise<void>;
  loading: boolean;
}

const AISettingsContext = createContext<AISettingsContextData>(
  {} as AISettingsContextData
);

export const AISettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setModeState] = useState<AIMode>('auto');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMode();
  }, []);

  const loadMode = async () => {
    try {
      const response = await api.get('/api/v1/ai/mode');
      setModeState(response.data.mode);
    } catch (error) {
      console.error('Erro ao carregar modo de IA:', error);
    } finally {
      setLoading(false);
    }
  };

  const setMode = async (newMode: AIMode) => {
    try {
      await api.post('/api/v1/ai/mode', { mode: newMode });
      setModeState(newMode);
    } catch (error) {
      console.error('Erro ao definir modo de IA:', error);
      throw error;
    }
  };

  return (
    <AISettingsContext.Provider value={{ mode, setMode, loading }}>
      {children}
    </AISettingsContext.Provider>
  );
};

export const useAISettings = () => useContext(AISettingsContext);
```

---

## 🔌 Integrações

### **1. WebSocket Integration**

#### **Hook useSocket**
```typescript
// hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useSocket as useSocketContext } from '../contexts/SocketContext';

export const useSocket = (namespace: string) => {
  const { socket: contextSocket, connected } = useSocketContext(namespace);
  const [socket, setSocket] = useState<Socket | undefined>(contextSocket);

  useEffect(() => {
    setSocket(contextSocket);
  }, [contextSocket]);

  return { socket, connected };
};
```

#### **Chat WebSocket Integration**
```typescript
// hooks/useChatSocket.ts
import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';

export const useChatSocket = (channelId?: string) => {
  const { socket, connected } = useSocket('/chat');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Eventos de typing
    socket.on('user:typing', ({ userId, channelId: typingChannelId }) => {
      if (channelId === typingChannelId) {
        setTypingUsers((prev) => [...new Set([...prev, userId])]);
      }
    });

    socket.on('user:stopped-typing', ({ userId, channelId: typingChannelId }) => {
      if (channelId === typingChannelId) {
        setTypingUsers((prev) => prev.filter((id) => id !== userId));
      }
    });

    return () => {
      socket.off('user:typing');
      socket.off('user:stopped-typing');
    };
  }, [socket, channelId]);

  const sendMessage = (content: string) => {
    if (!socket || !channelId) return;

    socket.emit('message:send', {
      channelId,
      content,
    });
  };

  const startTyping = () => {
    if (!socket || !channelId) return;
    socket.emit('typing:start', { channelId });
  };

  const stopTyping = () => {
    if (!socket || !channelId) return;
    socket.emit('typing:stop', { channelId });
  };

  return {
    socket,
    connected,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
  };
};
```

### **2. API Service Patterns**

#### **CRM Service**
```typescript
// services/crm.service.ts
import api from './api';

export class CRMService {
  // Contacts
  async getContacts(filters?: any) {
    const response = await api.get('/api/v1/crm/contacts', { params: filters });
    return response.data;
  }

  async getContactById(id: string) {
    const response = await api.get(`/api/v1/crm/contacts/${id}`);
    return response.data;
  }

  async createContact(data: any) {
    const response = await api.post('/api/v1/crm/contacts', data);
    return response.data;
  }

  async updateContact(id: string, data: any) {
    const response = await api.patch(`/api/v1/crm/contacts/${id}`, data);
    return response.data;
  }

  async deleteContact(id: string) {
    const response = await api.delete(`/api/v1/crm/contacts/${id}`);
    return response.data;
  }

  // Deals
  async getDeals(filters?: any) {
    const response = await api.get('/api/v1/crm/deals', { params: filters });
    return response.data;
  }

  async createDeal(data: any) {
    const response = await api.post('/api/v1/crm/deals', data);
    return response.data;
  }

  async updateDealStage(id: string, stage: string) {
    const response = await api.patch(`/api/v1/crm/deals/${id}/stage`, { stage });
    return response.data;
  }

  // AI Features
  async getDealProbability(dealId: string) {
    const response = await api.get(`/api/v1/crm/deals/${dealId}/probability`);
    return response.data;
  }

  async getContactEngagement(contactId: string) {
    const response = await api.get(`/api/v1/crm/contacts/${contactId}/engagement`);
    return response.data;
  }
}

export const crmService = new CRMService();
```

#### **Knowledge Service**
```typescript
// services/knowledge.service.ts
import api from './api';

export class KnowledgeService {
  async getNodes(filters?: any) {
    const response = await api.get('/api/v1/knowledge/nodes', { params: filters });
    return response.data;
  }

  async getNodeById(id: string) {
    const response = await api.get(`/api/v1/knowledge/nodes/${id}`);
    return response.data;
  }

  async createNode(data: any) {
    const response = await api.post('/api/v1/knowledge/nodes', data);
    return response.data;
  }

  async updateNode(id: string, data: any) {
    const response = await api.patch(`/api/v1/knowledge/nodes/${id}`, data);
    return response.data;
  }

  async deleteNode(id: string) {
    const response = await api.delete(`/api/v1/knowledge/nodes/${id}`);
    return response.data;
  }

  async createLink(sourceId: string, data: any) {
    const response = await api.post(`/api/v1/knowledge/nodes/${sourceId}/links`, data);
    return response.data;
  }

  async getObsidianGraph(filters?: any) {
    const response = await api.get('/api/v1/knowledge/graph/obsidian', {
      params: filters,
    });
    return response.data;
  }

  async semanticSearch(query: string, limit = 10, minScore = 0.7) {
    const response = await api.post('/api/v1/knowledge/search/semantic', {
      query,
      limit,
      minScore,
    });
    return response.data;
  }

  async askAI(question: string, maxContext = 5) {
    const response = await api.post('/api/v1/knowledge/ask', {
      question,
      maxContext,
    });
    return response.data;
  }

  async getSuggestions(nodeId: string) {
    const response = await api.get(`/api/v1/knowledge/nodes/${nodeId}/suggestions`);
    return response.data;
  }
}

export const knowledgeService = new KnowledgeService();
```

---

## 🎯 Sistema de IA (3 Modos)

### **Componente de Seleção de Modo**
```typescript
// components/AI/ModeSwitcher.tsx
import React from 'react';
import { useAISettings } from '../../contexts/AISettingsContext';

export const AIModeSwitcher: React.FC = () => {
  const { mode, setMode, loading } = useAISettings();

  const modes = [
    {
      id: 'full',
      name: 'FULL',
      description: 'Sempre OpenAI (melhor qualidade, pago)',
      icon: '🚀',
    },
    {
      id: 'auto',
      name: 'AUTO',
      description: 'IA decide baseado na complexidade (híbrido inteligente)',
      icon: '🧠',
    },
    {
      id: 'economico',
      name: 'ECONÔMICO',
      description: 'Sempre Ollama (gratuito, local)',
      icon: '💰',
    },
  ];

  const handleModeChange = async (newMode: any) => {
    try {
      await setMode(newMode);
    } catch (error) {
      console.error('Erro ao alterar modo:', error);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="ai-mode-switcher">
      <h2>Modo de IA</h2>
      <div className="mode-cards">
        {modes.map((m) => (
          <div
            key={m.id}
            className={`mode-card ${mode === m.id ? 'active' : ''}`}
            onClick={() => handleModeChange(m.id)}
          >
            <div className="icon">{m.icon}</div>
            <h3>{m.name}</h3>
            <p>{m.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### **AI Chat Component**
```typescript
// components/AI/AIChat.tsx
import React, { useState } from 'react';
import api from '../../services/api';
import { useAISettings } from '../../contexts/AISettingsContext';

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { mode } = useAISettings();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/api/v1/ai/chat', {
        message: input,
      });

      const aiMessage = {
        role: 'assistant',
        content: response.data.message,
        model: response.data.model,
        provider: response.data.provider,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chat">
      <div className="chat-header">
        <h2>Chat com IA</h2>
        <span className="mode-badge">{mode.toUpperCase()}</span>
      </div>

      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="content">{msg.content}</div>
            {msg.provider && (
              <div className="meta">
                {msg.provider} - {msg.model}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="loading">IA está pensando...</div>}
      </div>

      <form onSubmit={handleSend} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          Enviar
        </button>
      </form>
    </div>
  );
};
```

---

## 📊 Analytics e Dashboards

### **Dashboard Component**
```typescript
// components/Analytics/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await api.get('/api/v1/analytics/dashboard');
      setMetrics(response.data);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (!metrics) return <div>Erro ao carregar dados</div>;

  return (
    <div className="analytics-dashboard">
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total de Contatos</h3>
          <p className="value">{metrics.totalContacts}</p>
        </div>
        <div className="metric-card">
          <h3>Deals Ativos</h3>
          <p className="value">{metrics.activeDeals}</p>
        </div>
        <div className="metric-card">
          <h3>Taxa de Conversão</h3>
          <p className="value">{metrics.conversionRate}%</p>
        </div>
        <div className="metric-card">
          <h3>Receita Total</h3>
          <p className="value">R$ {metrics.totalRevenue.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Pipeline por Estágio</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.pipelineByStage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Atividade ao Longo do Tempo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.activityTimeSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="contacts" stroke="#3b82f6" />
              <Line type="monotone" dataKey="deals" stroke="#10b981" />
              <Line type="monotone" dataKey="messages" stroke="#f59e0b" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
```

---

## ✅ Checklist de Implementação

### **Fase 1: Setup Inicial**
- [ ] Configurar projeto React/Next.js/Vite
- [ ] Instalar dependências principais:
  - [ ] react-router-dom (rotas)
  - [ ] axios (HTTP client)
  - [ ] socket.io-client (WebSocket)
  - [ ] recharts (gráficos)
  - [ ] react-beautiful-dnd (drag & drop)
  - [ ] reactflow (workflow editor)
  - [ ] vis-network (graph visualization)
  - [ ] zod (validação)
  - [ ] react-hook-form (formulários)
  - [ ] tailwindcss/scss (styling)
- [ ] Configurar variáveis de ambiente (.env)
- [ ] Configurar interceptor Axios com auto-refresh
- [ ] Criar estrutura de pastas

### **Fase 2: Autenticação**
- [ ] Implementar AuthContext
- [ ] Criar páginas de login, registro, recuperação de senha
- [ ] Implementar ProtectedRoute component
- [ ] Configurar 2FA (QR code, backup codes)
- [ ] Implementar hook usePermissions

### **Fase 3: Layout e Navegação**
- [ ] Criar AppLayout component
- [ ] Implementar Sidebar com navegação
- [ ] Criar TopBar com busca global e notificações
- [ ] Implementar NotificationBell
- [ ] Configurar rotas principais

### **Fase 4: CRM**
- [ ] Página de lista de contatos (tabela + filtros)
- [ ] Formulário de criação/edição de contato
- [ ] Página de detalhes do contato
- [ ] DealKanban component (drag & drop)
- [ ] Formulário de criação/edição de deal
- [ ] Página de detalhes do deal
- [ ] Analytics de CRM (dashboard de pipeline)
- [ ] Integração com AI (probabilidade de deal, engagement score)

### **Fase 5: Chat**
- [ ] Configurar SocketContext
- [ ] Implementar ChatInterface
- [ ] ChannelList component
- [ ] MessageList component
- [ ] MessageInput com typing indicator
- [ ] Reações e edição de mensagens
- [ ] Mensagens diretas
- [ ] Integração com AI (sentiment analysis, smart replies)

### **Fase 6: Knowledge (Zettel System)**
- [ ] Lista de zettels (grid/lista)
- [ ] Formulário de criação/edição de zettel
- [ ] Página de detalhes do zettel
- [ ] ZettelGraph component (Obsidian-style com vis.js)
- [ ] SemanticSearch component (RAG)
- [ ] AIQuestionAnswer component (Q&A)
- [ ] Navegação por tags
- [ ] Sistema de links entre zettels

### **Fase 7: IA**
- [ ] Configurar AISettingsContext
- [ ] AIModeSwitcher component (FULL/AUTO/ECONOMICO)
- [ ] AIChat component
- [ ] Página de estatísticas de uso de IA
- [ ] Integração com todos os módulos que usam IA

### **Fase 8: Automações**
- [ ] Lista de workflows
- [ ] WorkflowEditor component (ReactFlow)
- [ ] Página de execuções
- [ ] Logs de execução
- [ ] AI-powered workflow suggestions

### **Fase 9: Omnichannel**
- [ ] Lista de conversas
- [ ] Página de conversa individual
- [ ] WhatsAppSetup component
- [ ] Lista de contas WhatsApp
- [ ] QR code scanner
- [ ] Gerenciamento de status

### **Fase 10: Analytics e Relatórios**
- [ ] AnalyticsDashboard component
- [ ] Gráficos de série temporal
- [ ] Analytics de pipeline
- [ ] Atividade de usuários
- [ ] Exportação de dados (CSV)

### **Fase 11: Configurações**
- [ ] Perfil do usuário
- [ ] Segurança (senha, 2FA)
- [ ] Configurações da empresa
- [ ] Gerenciamento de usuários (admin)
- [ ] Departamentos e papéis (RBAC)
- [ ] Permissões customizadas
- [ ] Integrações
- [ ] Webhooks
- [ ] Chaves de API

### **Fase 12: Funcionalidades Complementares**
- [ ] GlobalSearch component
- [ ] Gerenciador de arquivos
- [ ] Upload de avatar
- [ ] Audit logs (admin)
- [ ] Notificações em tempo real
- [ ] Centro de notificações

### **Fase 13: Otimizações**
- [ ] Code splitting
- [ ] Lazy loading de rotas
- [ ] Cache de requisições
- [ ] Otimização de imagens
- [ ] Service Worker (PWA)
- [ ] Error boundaries
- [ ] Loading states consistentes
- [ ] Toast notifications

### **Fase 14: Testes**
- [ ] Unit tests (componentes)
- [ ] Integration tests (fluxos)
- [ ] E2E tests (Cypress/Playwright)
- [ ] Testes de permissões
- [ ] Testes de WebSocket

### **Fase 15: Deploy**
- [ ] Build de produção
- [ ] Configuração de CI/CD
- [ ] Deploy no servidor/cloud
- [ ] Configurar HTTPS
- [ ] Monitoramento de erros (Sentry)
- [ ] Analytics (Google Analytics, Mixpanel)

---

## 🎨 Estrutura de Pastas Recomendada

```
frontend/
├── public/
│   ├── logo.svg
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── CRM/
│   │   │   ├── ContactList.tsx
│   │   │   ├── ContactForm.tsx
│   │   │   ├── DealKanban.tsx
│   │   │   └── DealForm.tsx
│   │   ├── Chat/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── ChannelList.tsx
│   │   │   ├── MessageList.tsx
│   │   │   └── MessageInput.tsx
│   │   ├── Knowledge/
│   │   │   ├── ZettelList.tsx
│   │   │   ├── ZettelGraph.tsx
│   │   │   ├── SemanticSearch.tsx
│   │   │   └── AIQuestionAnswer.tsx
│   │   ├── AI/
│   │   │   ├── AIModeSwitcher.tsx
│   │   │   └── AIChat.tsx
│   │   ├── Automations/
│   │   │   └── WorkflowEditor.tsx
│   │   ├── Omnichannel/
│   │   │   └── WhatsAppSetup.tsx
│   │   ├── Notifications/
│   │   │   └── NotificationBell.tsx
│   │   ├── Analytics/
│   │   │   └── AnalyticsDashboard.tsx
│   │   ├── Search/
│   │   │   └── GlobalSearch.tsx
│   │   └── Common/
│   │       ├── DataTable.tsx
│   │       ├── Modal.tsx
│   │       └── LoadingSpinner.tsx
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── CRM/
│   │   │   ├── ContactsPage.tsx
│   │   │   └── DealsPage.tsx
│   │   ├── Chat/
│   │   │   └── ChatPage.tsx
│   │   ├── Knowledge/
│   │   │   ├── KnowledgePage.tsx
│   │   │   └── GraphPage.tsx
│   │   ├── AI/
│   │   │   └── AIChatPage.tsx
│   │   ├── Automations/
│   │   │   └── AutomationsPage.tsx
│   │   ├── Settings/
│   │   │   └── SettingsPage.tsx
│   │   └── Dashboard/
│   │       └── DashboardPage.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── SocketContext.tsx
│   │   ├── EventBusContext.tsx
│   │   └── AISettingsContext.tsx
│   ├── hooks/
│   │   ├── usePermissions.ts
│   │   ├── useSocket.ts
│   │   ├── useChatSocket.ts
│   │   └── useEventBus.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── crm.service.ts
│   │   └── knowledge.service.ts
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── crm.types.ts
│   │   └── knowledge.types.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── App.tsx
│   └── main.tsx
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🔧 Variáveis de Ambiente

```env
# .env.example
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:3000
REACT_APP_ENV=development
```

---

## 📝 Resumo Final

Este guia completo documenta **100% das funcionalidades** que o frontend precisa implementar para ter o sistema Completov2 completo.

### **Principais Módulos:**
1. ✅ **Autenticação** - Login, registro, 2FA, refresh token
2. ✅ **CRM** - Contatos, deals, interações, analytics com IA
3. ✅ **Chat** - Mensageria em tempo real com WebSocket, sentiment analysis
4. ✅ **Knowledge** - Sistema zettel Obsidian-style com RAG e busca semântica
5. ✅ **IA** - Sistema de 3 modos (FULL/AUTO/ECONOMICO), chat, Q&A
6. ✅ **Automações** - Workflows visuais, execuções, sugestões de IA
7. ✅ **Omnichannel** - WhatsApp, conversas multi-canal
8. ✅ **Notificações** - Tempo real com priorização por IA
9. ✅ **Analytics** - Dashboards, gráficos, exportação
10. ✅ **RBAC** - Departamentos, papéis, permissões customizadas
11. ✅ **Configurações** - Perfil, segurança, empresa, integrações

### **Tecnologias Recomendadas:**
- **Framework:** React 18+ (ou Next.js para SSR)
- **Routing:** React Router v6
- **State:** Context API + hooks customizados
- **HTTP:** Axios com interceptors
- **WebSocket:** Socket.IO Client
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Drag & Drop:** react-beautiful-dnd
- **Workflow Editor:** ReactFlow
- **Graph Viz:** vis-network
- **Styling:** TailwindCSS ou SCSS

**Total de páginas:** ~40+
**Total de componentes:** ~60+
**Total de hooks:** ~10+
**Total de contextos:** ~5+
**Total de services:** ~8+
