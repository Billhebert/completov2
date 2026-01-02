# Guia de Integração - Funcionalidades Premium CRM

Este guia mostra como integrar as novas funcionalidades premium do CRM.

## 1. Global Search com Cmd+K

### Hook de Integração

O componente `GlobalSearch` vem com um hook `useGlobalSearch` que automaticamente registra o atalho de teclado Cmd+K (ou Ctrl+K).

### Como Usar no AppLayout

```tsx
// Em qualquer componente de layout (ex: AppLayout.tsx ou TopBar.tsx)
import { GlobalSearch, useGlobalSearch } from '../../modules/crm/components/GlobalSearch';

export const AppLayout = ({ children }) => {
  const { isOpen, setIsOpen } = useGlobalSearch();

  return (
    <div>
      {/* Seu layout existente */}

      {/* Adicione o GlobalSearch */}
      <GlobalSearch isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Opcionalmente, adicione um botão visual para abrir */}
      <button onClick={() => setIsOpen(true)} className="...">
        <MagnifyingGlassIcon className="h-5 w-5" />
        <span>Buscar (Cmd+K)</span>
      </button>

      {children}
    </div>
  );
};
```

### Funcionalidades

- **Atalho de teclado**: Cmd+K (Mac) ou Ctrl+K (Windows/Linux)
- **Busca em**:
  - Deals (por título e descrição)
  - Contatos (por nome e email)
  - Empresas (por nome)
- **Navegação rápida**: Enter para navegar ao resultado selecionado
- **Resultados agrupados**: Por tipo (Deal, Contato, Empresa)

---

## 2. Sistema de Notificações

### NotificationBell Component

O componente `NotificationBell` mostra um ícone de sino com contador de notificações não lidas.

### Como Usar no TopBar

```tsx
// Em TopBar.tsx ou similar
import { NotificationBell } from '../../modules/crm/components/NotificationBell';

export const TopBar = () => {
  return (
    <header className="...">
      {/* Outros elementos do header */}

      <div className="flex items-center gap-4">
        {/* Adicione o NotificationBell */}
        <NotificationBell />

        {/* Perfil do usuário, etc. */}
      </div>
    </header>
  );
};
```

### Funcionalidades

- **Badge de contagem**: Mostra número de notificações não lidas
- **Notification Center**: Dropdown com lista completa de notificações
- **Auto-refresh**: Atualiza notificações a cada 30 segundos
- **Filtros**: Todas / Não lidas
- **Ações**: Marcar como lida, excluir, limpar todas
- **Navegação**: Click para ir ao deal/contact relacionado

### Página de Notificações

Existe também uma página completa de notificações em `/crm/notifications` com:
- Filtros avançados (tipo, prioridade, status)
- Estatísticas de notificações
- Gestão em massa

---

## 3. Rotas Disponíveis

Todas as novas funcionalidades estão disponíveis nas seguintes rotas:

```typescript
/crm/dashboard          // Dashboard Executivo com KPIs
/crm/kanban            // Kanban Board drag & drop
/crm/deal-health       // Dashboard de saúde dos deals
/crm/notifications     // Central de notificações
/crm/analytics         // Analytics e relatórios avançados
/crm/import-export     // Importação e exportação de dados
```

---

## 4. Exemplo Completo de AppLayout com Tudo Integrado

```tsx
import { useState } from 'react';
import { GlobalSearch, useGlobalSearch } from '../../modules/crm/components/GlobalSearch';
import { NotificationBell } from '../../modules/crm/components/NotificationBell';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export const AppLayout = ({ children }) => {
  const { isOpen: searchOpen, setIsOpen: setSearchOpen } = useGlobalSearch();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">CRM Premium</h1>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Search Button (visual trigger for Cmd+K) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              <span className="hidden md:inline">Buscar</span>
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs font-sans text-gray-600">
                ⌘K
              </kbd>
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* User profile, etc */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {children}
      </main>

      {/* Global Search Modal (keyboard shortcut + manual trigger) */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};
```

---

## 5. Notas de Implementação

### Notificações Mock

Atualmente, as notificações são geradas a partir dos dados do CRM:
- Deals críticos (health status = critical)
- Deals em risco (health status = at_risk)
- Deals atrasados (expectedCloseDate passou)

As notificações são armazenadas em **localStorage** com a chave `crm_notifications`.

Para integração com backend real:
1. Substitua `notification.service.ts` para fazer chamadas à API
2. Implemente WebSocket ou polling para notificações em tempo real
3. Adicione endpoints no backend para CRUD de notificações

### Busca Global

A busca global atualmente faz chamadas síncronas aos serviços existentes. Para otimizar:
1. Implemente debounce na busca (aguardar 300ms após digitar)
2. Adicione cache de resultados recentes
3. Implemente endpoint de busca unificada no backend
4. Adicione busca fuzzy para melhor UX

### Import/Export

- **CSV**: Parsing simples implementado
- **JSON**: Suportado nativamente
- **Excel**: Requer biblioteca adicional (ex: xlsx.js) para full support

---

## 6. Componentes Exportados

```typescript
// Global Search
import { GlobalSearch, useGlobalSearch } from '@/modules/crm/components/GlobalSearch';

// Notifications
import { NotificationBell } from '@/modules/crm/components/NotificationBell';
import { NotificationCenter } from '@/modules/crm/components/NotificationCenter';
```

---

## 7. Checklist de Integração

- [ ] Adicionar GlobalSearch no AppLayout com useGlobalSearch hook
- [ ] Adicionar NotificationBell no TopBar
- [ ] Verificar que os atalhos de teclado funcionam (Cmd+K / Ctrl+K)
- [ ] Testar notificações com deals em risco no sistema
- [ ] Configurar links de navegação para as novas páginas no menu
- [ ] Ajustar permissões se necessário (todas usam 'crm.read' atualmente)

---

Para dúvidas ou sugestões, consulte a documentação do projeto ou abra uma issue.
