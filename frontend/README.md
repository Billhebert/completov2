# Completov2 Frontend

Frontend completo e modular para o sistema Completov2, desenvolvido com React 19, TypeScript e Vite.

## 🎯 Características

- ✅ **100% de Cobertura** - Todos os 33 módulos do backend implementados
- 🧩 **Arquitetura Modular** - Cada módulo pode ser habilitado/desabilitado independentemente
- 🔐 **Autenticação Completa** - Login, registro, 2FA, recuperação de senha
- 🎨 **UI Moderna** - TailwindCSS com componentes reutilizáveis
- 📱 **Responsive** - Design adaptável para todos os dispositivos
- ⚡ **Performance** - Lazy loading, code splitting, otimizações
- 🔄 **Real-time** - WebSocket integration pronta
- 🛡️ **Type-Safe** - 100% TypeScript
- 🎭 **RBAC** - Sistema completo de permissões e roles

## 📦 Tecnologias

- **React 19** - UI Framework
- **TypeScript** - Type safety
- **Vite** - Build tool ultra-rápido
- **React Router v6** - Roteamento
- **TailwindCSS** - Styling
- **Axios** - HTTP client com interceptors
- **Socket.io** - WebSocket client
- **React Hook Form + Zod** - Formulários e validação
- **Recharts** - Gráficos e analytics
- **ReactFlow** - Editor de workflows
- **vis-network** - Grafos de conhecimento

## 🚀 Como Usar

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

### Build para Produção

```bash
npm run build
```

## 🧩 Estrutura de um Módulo

Cada módulo segue o mesmo padrão:

```
modules/[module-name]/
├── types/index.ts              # Types do módulo
├── services/[name].service.ts  # Cliente API (CRUD)
├── pages/[Name]ListPage.tsx    # Página principal
├── routes.tsx                  # Rotas do módulo
├── module.config.ts            # Configuração do módulo
└── index.ts                    # Barrel export
```

## 📊 Módulos Implementados (33 Total)

### Core (3)
- **auth** - Autenticação, login, 2FA
- **shared** - Componentes compartilhados
- **settings** - Configurações do sistema

### Business (3)
- **crm** - Gestão de contatos, empresas e deals
- **chat** - Sistema de mensagens em tempo real
- **knowledge** - Zettelkasten + RAG semantic search

### AI & Automation (5)
- **ai** - Integração LLM (OpenAI + Ollama)
- **automations** - Editor de workflows visual
- **narrative** - Geração de narrativas com IA
- **deduplication** - Detecção de duplicatas com IA
- **gatekeeper** - Gerenciamento de atenção

### Operations (4)
- **omnichannel** - Atendimento multicanal
- **analytics** - Business intelligence
- **notifications** - Sistema de notificações
- **rbac** - Controle de acesso

### Infrastructure (8)
- **webhooks** - Gestão de webhooks
- **files** - Gerenciamento de arquivos
- **search** - Busca global
- **audit** - Logs de auditoria
- **apikeys** - API keys
- **sync** - Sincronização terceiros
- **sso** - Single Sign-On
- **mcp** - Model Context Protocol

### ERP & Financial (3)
- **erp** - Gestão financeira
- **services** - Marketplace de serviços
- **partnerships** - Parcerias B2B

### HR (3)
- **people-growth** - Desenvolvimento pessoal
- **jobs** - Recrutamento
- **learning** - Trilhas de aprendizado

### Specialized (4)
- **fsm** - Field Service Management
- **cmms** - Gestão de ativos
- **simulation** - Simulações de treinamento
- **email-templates** - Templates de email

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_ENV=development
```

### Habilitar/Desabilitar Módulos

Edite `src/core/config/modules.config.ts`:

```typescript
{
  id: 'crm',
  enabled: true,  // false para desabilitar
  // ...
}
```

## 📝 Criar Novo Módulo

```python
python3 generate-modules.py
```

## 🎨 Componentes Disponíveis

### Layout
- `AppLayout`, `Sidebar`, `TopBar`

### UI
- `Button`, `Card`, `Modal`, `Input`, `Badge`, `LoadingSpinner`, `DataTable`

## 🔐 Autenticação

```typescript
import { useAuth } from '@/core/providers/AuthProvider';

const { login, hasPermission, hasRole } = useAuth();
```

## 📊 Estatísticas

- **234 arquivos TypeScript**
- **33 módulos completos**
- **100% cobertura do backend**
- **Arquitetura modular**

---

**Desenvolvido com ❤️ usando React 19 + TypeScript + Vite**
