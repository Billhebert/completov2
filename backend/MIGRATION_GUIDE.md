# 🚀 Guia de Migração para Arquitetura 100% Modular

## 📋 Visão Geral

Este guia detalha como migrar cada módulo do backend para a nova arquitetura modular onde **1 rota = 1 arquivo**.

**Status Atual:**
- ✅ **Auth**: 100% migrado (8 rotas) - USE COMO REFERÊNCIA
- ⏳ **Demais 32 módulos**: Pendentes de migração

---

## 🎯 Objetivo

Transformar arquivos monolíticos (ex: `crm/index.ts` com 1428 linhas) em estrutura modular:

```
modules/crm/
├── routes/
│   ├── contacts-list.route.ts
│   ├── contacts-create.route.ts
│   ├── contacts-get.route.ts
│   ├── contacts-update.route.ts
│   ├── contacts-delete.route.ts
│   ├── deals-list.route.ts
│   ├── ... (mais 20 arquivos)
│   └── index.ts
├── services/
└── crm.http
```

---

## 📊 Inventário de Módulos

### Módulos Grandes (Prioridade Alta)
| Módulo | Linhas | Rotas Estimadas | Status |
|--------|--------|-----------------|--------|
| **CRM** | 1428 | 30+ | ⏳ Pendente |
| **Knowledge** | ~600 | 15+ | ⏳ Pendente |
| **Chat** | ~400 | 8 | ⏳ Pendente |
| **Omnichannel** | ~500 | 12+ | ⏳ Pendente |
| **Analytics** | ~300 | 6 | ⏳ Pendente |
| **RBAC** | ~400 | 15 | ⏳ Pendente |

### Módulos Médios
| Módulo | Rotas Estimadas | Status |
|--------|-----------------|--------|
| **Files** | 6 | ⏳ Pendente |
| **Webhooks** | 8 | ⏳ Pendente |
| **Learning** | 10 | ⏳ Pendente |
| **Jobs** | 10 | ⏳ Pendente |
| **Services** | 13 | ⏳ Pendente |
| **Sync** | 6 | ⏳ Pendente |
| **Search** | 4 | ⏳ Pendente |
| **SSO** | 4 | ⏳ Pendente |
| **Audit** | 5 | ⏳ Pendente |

### Módulos Pequenos
| Módulo | Rotas Estimadas | Status |
|--------|-----------------|--------|
| **API Keys** | 5 | ⏳ Pendente |
| **Settings** | 3 | ⏳ Pendente |
| **Email Templates** | 3 | ⏳ Pendente |
| **Notifications** | 4 | ⏳ Pendente |
| **AI** | 6 | ⏳ Pendente |
| **Automations** | ~5 | ⏳ Pendente |
| **People Growth** | 7 | ⏳ Pendente |

### Módulos Especiais
| Módulo | Notas | Status |
|--------|-------|--------|
| **ERP** | Módulo grande e complexo | ⏳ Pendente |
| **FSM** | Field Service Management | ⏳ Pendente |
| **CMMS** | Asset Management | ⏳ Pendente |
| **Deduplication** | AI Deduplication | ⏳ Pendente |
| **Gatekeeper** | Attention Management | ⏳ Pendente |
| **Feedback** | Feedback System | ⏳ Pendente |
| **Narrative** | AI Narratives | ⏳ Pendente |
| **MCP** | Model Context Protocol | ⏳ Pendente |
| **Partnerships** | B2B Partnerships | ⏳ Pendente |

**Total: 33 módulos, ~250 rotas**

---

## 🛠️ Métodos de Migração

### Método 1: Script Automático (Recomendado para módulos com `routes.ts`)

```bash
cd /home/user/completov2/backend
python3 scripts/migrate-to-modular.py <module-name>
```

**Exemplo:**
```bash
python3 scripts/migrate-to-modular.py auth
```

**O que o script faz:**
1. ✅ Lê `routes.ts` existente
2. ✅ Extrai cada rota com regex
3. ✅ Cria pasta `routes/`
4. ✅ Gera arquivo individual para cada rota
5. ✅ Gera `routes/index.ts` orquestrador
6. ✅ Faz backup do `routes.ts` antigo
7. ✅ Copia novo index para `routes.ts`

**Limitações:**
- Funciona apenas se o módulo tiver `routes.ts` separado
- Pode precisar de ajustes manuais para rotas complexas

---

### Método 2: Migração Manual (Para módulos com rotas no `index.ts`)

Maioria dos módulos tem rotas definidas diretamente no `index.ts`. Siga este processo:

#### Passo 1: Criar Estrutura

```bash
cd src/modules/<module-name>
mkdir -p routes
```

#### Passo 2: Identificar Rotas

Procure no `index.ts` por padrões:
```typescript
app.get('/api/v1/module/route', ...)
app.post('/api/v1/module/route', ...)
router.get('/route', ...)
router.post('/route', ...)
```

#### Passo 3: Criar Arquivo por Rota

Para cada rota encontrada, crie arquivo `routes/{nome}.route.ts`:

**Template:**
```typescript
/**
 * {Module} - {Route Name} Route
 * {HTTP_METHOD} /api/v1/{module}/{path}
 * {Description}
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
// Importar service, middleware, schemas necessários

export function setup{RouteName}Route(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.{method}(
    `${baseUrl}/{path}`,
    // Middlewares (authenticate, validate, etc.)
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Lógica da rota
        res.json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    }
  );
}
```

#### Passo 4: Criar `routes/index.ts`

```typescript
/**
 * {Module} Routes - Index
 */

import { Express } from 'express';
import { PrismaClient } from '@prisma/client';

// Imports
import { setupRoute1 } from './route1.route';
import { setupRoute2 } from './route2.route';

export function setup{Module}Routes(app: Express, prisma: PrismaClient) {
  const baseUrl = '/api/v1/{module}';

  setupRoute1(app, prisma, baseUrl);
  setupRoute2(app, prisma, baseUrl);
}
```

#### Passo 5: Atualizar `index.ts` Principal

```typescript
// No index.ts do módulo
import { setup{Module}Routes } from './routes';

export const {module}Module: ModuleDefinition = {
  name: '{module}',
  routes: async (ctx) => {
    setup{Module}Routes(ctx.app, ctx.prisma);
  },
};
```

#### Passo 6: Criar Arquivo `.http`

Crie `{module}.http` com testes para todas as rotas. Use `auth.http` como referência.

---

### Método 3: Migração Híbrida

Para módulos muito grandes (ex: CRM com 1428 linhas):

1. **Separar por Feature** primeiro:
   - `contacts.ts` → `routes/contacts/` (list, create, get, update, delete)
   - `deals.ts` → `routes/deals/` (list, create, get, update, delete, move-stage)
   - `interactions.ts` → `routes/interactions/`

2. **Depois granularizar** cada feature em rotas individuais

**Estrutura:**
```
crm/
├── routes/
│   ├── contacts/
│   │   ├── list.route.ts
│   │   ├── create.route.ts
│   │   ├── get.route.ts
│   │   ├── update.route.ts
│   │   ├── delete.route.ts
│   │   └── index.ts
│   ├── deals/
│   │   ├── list.route.ts
│   │   ├── create.route.ts
│   │   ├── ...
│   │   └── index.ts
│   └── index.ts (importa contacts, deals, etc.)
```

---

## 📝 Checklist por Módulo

Use esta checklist ao migrar cada módulo:

### Antes de Começar
- [ ] Ler código do módulo e entender todas as rotas
- [ ] Contar quantas rotas existem
- [ ] Verificar dependências (services, middlewares, schemas)
- [ ] Fazer backup do código original

### Durante a Migração
- [ ] Criar pasta `routes/`
- [ ] Extrair cada rota para arquivo individual
- [ ] Nomear arquivos seguindo padrão `{resource}-{action}.route.ts`
- [ ] Criar função `setup{Name}Route` em cada arquivo
- [ ] Adicionar documentação no topo de cada arquivo
- [ ] Criar `routes/index.ts` orquestrador
- [ ] Atualizar `index.ts` principal do módulo

### Testes
- [ ] Criar arquivo `{module}.http` com testes
- [ ] Testar cada rota individualmente
- [ ] Testar fluxos de integração
- [ ] Testar cenários de erro
- [ ] Testar autenticação e permissões

### Finalização
- [ ] Remover código antigo (ou mover para `.backup`)
- [ ] Atualizar `API_MASTER.http` se necessário
- [ ] Fazer commit com mensagem descritiva
- [ ] Documentar quaisquer issues encontrados

---

## 🎓 Exemplos Práticos

### Exemplo 1: Módulo Simples (Settings - 3 rotas)

**Antes:**
```typescript
// index.ts (100 linhas)
app.get('/api/v1/settings', ...)
app.put('/api/v1/settings', ...)
app.get('/api/v1/settings/history', ...)
```

**Depois:**
```
settings/
├── routes/
│   ├── get.route.ts           # GET /settings
│   ├── update.route.ts        # PUT /settings
│   ├── history.route.ts       # GET /settings/history
│   └── index.ts
└── settings.http
```

**Tempo estimado:** 30 minutos

---

### Exemplo 2: Módulo Médio (Files - 6 rotas)

**Rotas:**
- POST /files/upload
- GET /files
- GET /files/:id/url
- GET /files/:id/download
- DELETE /files/:id
- POST /files/avatar

**Estrutura:**
```
files/
├── routes/
│   ├── upload.route.ts
│   ├── list.route.ts
│   ├── get-url.route.ts
│   ├── download.route.ts
│   ├── delete.route.ts
│   ├── upload-avatar.route.ts
│   └── index.ts
└── files.http
```

**Tempo estimado:** 1 hora

---

### Exemplo 3: Módulo Grande (CRM - 30+ rotas)

**Abordagem:**
1. Separar por resource (contacts, deals, interactions, companies, pipelines)
2. Cada resource vira uma sub-pasta
3. Cada ação vira um arquivo

**Estrutura:**
```
crm/
├── routes/
│   ├── contacts/
│   │   ├── list.route.ts
│   │   ├── create.route.ts
│   │   ├── get.route.ts
│   │   ├── update.route.ts
│   │   ├── delete.route.ts
│   │   ├── enrich.route.ts (AI)
│   │   ├── engagement.route.ts (AI)
│   │   ├── churn.route.ts (AI)
│   │   └── index.ts
│   ├── deals/
│   │   ├── list.route.ts
│   │   ├── create.route.ts
│   │   ├── get.route.ts
│   │   ├── update.route.ts
│   │   ├── delete.route.ts
│   │   ├── move-stage.route.ts
│   │   ├── probability.route.ts (AI)
│   │   └── index.ts
│   ├── interactions/
│   ├── companies/
│   ├── pipelines/
│   ├── analytics/
│   └── index.ts (importa tudo)
└── crm.http (100+ testes)
```

**Tempo estimado:** 4-6 horas

---

## 🚀 Ordem de Migração Sugerida

Migre nesta ordem para maximizar o aprendizado e impacto:

### Fase 1: Módulos Pequenos (Aprendizado)
1. **Settings** (3 rotas) - 30min
2. **Email Templates** (3 rotas) - 30min
3. **Notifications** (4 rotas) - 45min
4. **API Keys** (5 rotas) - 1h

**Total Fase 1:** ~3 horas, 4 módulos migrados

### Fase 2: Módulos Médios (Consolidação)
1. **Files** (6 rotas) - 1h
2. **AI** (6 rotas) - 1h
3. **Search** (4 rotas) - 45min
4. **SSO** (4 rotas) - 45min
5. **Audit** (5 rotas) - 1h
6. **Sync** (6 rotas) - 1h

**Total Fase 2:** ~6 horas, 6 módulos migrados

### Fase 3: Módulos Grandes (Experiência)
1. **Chat** (8 rotas) - 2h
2. **Webhooks** (8 rotas) - 2h
3. **Learning** (10 rotas) - 2.5h
4. **Jobs** (10 rotas) - 2.5h
5. **Services** (13 rotas) - 3h
6. **RBAC** (15 rotas) - 3.5h
7. **People Growth** (7 rotas) - 2h

**Total Fase 3:** ~17 horas, 7 módulos migrados

### Fase 4: Módulos Muito Grandes (Desafio)
1. **Analytics** (6 rotas, complexas) - 3h
2. **Omnichannel** (12+ rotas) - 4h
3. **Knowledge** (15+ rotas) - 5h
4. **CRM** (30+ rotas) - 6h

**Total Fase 4:** ~18 horas, 4 módulos migrados

### Fase 5: Módulos Especiais
1. **ERP** - 4h
2. **FSM** - 3h
3. **CMMS** - 3h
4. **Outros** - 8h

**Total Fase 5:** ~18 horas, 8+ módulos migrados

---

## 📊 Estimativa Total

- **Módulos:** 33
- **Rotas:** ~250
- **Tempo Total Estimado:** 60-80 horas
- **Desenvolvedor Solo:** 2-3 semanas
- **Time de 3 Devs:** 1 semana

---

## 🎯 Benefícios Pós-Migração

Após migrar todos os módulos:

1. **Codebase 5x mais maintível**
   - Arquivos pequenos (~30 linhas cada)
   - Fácil navegação
   - Zero conflitos de merge

2. **Testes 100% cobertos**
   - Arquivo .http por módulo
   - Testes individuais por rota
   - Fácil debugging

3. **Onboarding 10x mais rápido**
   - Estrutura consistente
   - Documentação clara
   - Fácil encontrar código

4. **Desenvolvimento paralelo**
   - Múltiplos devs trabalhando sem conflitos
   - Features isoladas
   - Review focado

---

## 📚 Recursos

- **Template:** `/backend/src/modules/auth/` (referência completa)
- **Documentação:** `/backend/MODULAR_ARCHITECTURE.md`
- **Testes:** `/backend/API_MASTER.http`
- **Script:** `/backend/scripts/migrate-to-modular.py`

---

## 🆘 Troubleshooting

### Problema: "Rota não encontrada após migração"
**Solução:** Verificar se `routes/index.ts` está exportando `setup{Module}Routes` e se o `index.ts` principal está importando corretamente.

### Problema: "Import errors"
**Solução:** Verificar caminhos relativos (`../../` vs `../`) e se todos os imports necessários foram copiados.

### Problema: "Middleware não aplicado"
**Solução:** Verificar se middlewares estão sendo passados na ordem correta em cada arquivo de rota.

### Problema: "Testes falham após migração"
**Solução:** Verificar se lógica foi copiada corretamente e se todas as dependências estão importadas.

---

## ✅ Validação

Após migrar um módulo, validar:

```bash
# 1. Build compila
npm run build

# 2. Testes passam
npm test

# 3. Servidor inicia
npm run dev

# 4. Rotas respondem
# Testar com arquivo .http
```

---

## 📝 Template de Commit

```
feat(module): modularize {module} routes

- Split {module}/index.ts ({old_lines} lines) into {num_routes} route files
- Create routes/{route1}.route.ts
- Create routes/{route2}.route.ts
- ...
- Create {module}.http with {num_tests} tests
- Backup old code to index.ts.backup

Routes:
- {METHOD} /api/v1/{module}/{path1}
- {METHOD} /api/v1/{module}/{path2}
- ...

Benefits:
- Improved maintainability
- Better testability
- Easier code review
```

---

**Boa sorte na migração! 🚀**

**Status:** Auth migrado ✅, 32 módulos pendentes ⏳

**Próximo:** Escolha um módulo pequeno da Fase 1 e comece!
