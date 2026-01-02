# MODULAR ARCHITECTURE - 100% Modular Backend

## 📁 Nova Estrutura Modular

Cada módulo agora segue esta estrutura **ultra modular** onde **1 rota = 1 arquivo**:

```
modules/{module-name}/
├── routes/
│   ├── {route-name}.route.ts     # Cada rota em seu próprio arquivo
│   ├── {route-name-2}.route.ts
│   ├── {route-name-3}.route.ts
│   └── index.ts                   # Orquestrador que registra todas as rotas
├── services/
│   └── {module}.service.ts        # Lógica de negócio
├── schemas.ts                      # Validações Zod
├── index.ts                        # Definição do módulo (ModuleDefinition)
└── {module}.http                   # Testes HTTP para todas as rotas
```

## 📝 Exemplo: Módulo Auth

### Estrutura de Arquivos

```
modules/auth/
├── routes/
│   ├── login.route.ts           # POST /auth/login
│   ├── register.route.ts        # POST /auth/register
│   ├── refresh.route.ts         # POST /auth/refresh
│   ├── me.route.ts             # GET /auth/me
│   ├── 2fa-setup.route.ts      # POST /auth/2fa/setup
│   ├── 2fa-verify.route.ts     # POST /auth/2fa/verify
│   ├── 2fa-disable.route.ts    # POST /auth/2fa/disable
│   ├── logout.route.ts         # POST /auth/logout
│   └── index.ts                 # Registra todas as 8 rotas
├── services/
│   └── auth.service.ts
├── schemas.ts
├── index.ts
└── auth.http                     # 20+ testes HTTP
```

### Padrão de Arquivo de Rota

Cada arquivo de rota segue este template:

```typescript
/**
 * {Module} - {Route Name} Route
 * {HTTP_METHOD} /api/v1/{module}/{path}
 * {Description}
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { {Service} } from '../service';
import { authenticate } from '../../../core/middleware/auth';
import { validate } from '../../../core/middleware/validate';
import { {schema} } from '../schemas';

export function setup{RouteName}Route(app: Express, prisma: PrismaClient, baseUrl: string) {
  const service = new {Service}(prisma);

  app.{method}(
    `${baseUrl}/{path}`,
    // Middlewares
    authenticate,
    validate({schema}),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await service.{methodName}(/* params */);
        res.json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    }
  );
}
```

### Arquivo Index.ts do Routes

```typescript
/**
 * {Module} Routes - Index
 * Centralized route registration
 */

import { Express } from 'express';
import { PrismaClient } from '@prisma/client';

// Import all route setup functions
import { setup{Route1}Route } from './{route1}.route';
import { setup{Route2}Route } from './{route2}.route';
// ... more imports

export function setup{Module}Routes(app: Express, prisma: PrismaClient) {
  const baseUrl = '/api/v1/{module}';

  // Register all routes
  setup{Route1}Route(app, prisma, baseUrl);
  setup{Route2}Route(app, prisma, baseUrl);
  // ... more registrations
}
```

### Arquivo .http para Testes

```http
###############################################################################
# {MODULE} MODULE - HTTP TESTS
# Base URL: http://localhost:3000/api/v1/{module}
###############################################################################

@baseUrl = http://localhost:3000/api/v1
@{module}Url = {{baseUrl}}/{module}
@accessToken = your_token_here

### {Route 1 Name}
{METHOD} {{{{module}Url}}/{path}
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "field": "value"
}

### {Route 2 Name}
...
```

## 🎯 Benefícios da Nova Arquitetura

### 1. **Máxima Modularidade**
- ✅ 1 arquivo = 1 rota = 1 responsabilidade
- ✅ Fácil de encontrar e modificar rotas específicas
- ✅ Reduz conflitos em merge de código

### 2. **Testabilidade**
- ✅ Cada rota pode ser testada isoladamente
- ✅ Arquivo .http por módulo para testes manuais
- ✅ Fácil criar testes unitários por rota

### 3. **Manutenibilidade**
- ✅ Estrutura consistente em todos os módulos
- ✅ Documentação clara em cada arquivo
- ✅ Fácil onboarding de novos desenvolvedores

### 4. **Escalabilidade**
- ✅ Adicionar novas rotas = criar novo arquivo
- ✅ Remover rotas = deletar arquivo
- ✅ Não afeta outras rotas do módulo

### 5. **Rastreabilidade**
- ✅ Git history por rota individual
- ✅ Code review mais focado
- ✅ Debugging facilitado

## 📊 Comparação: Antes vs Depois

### ❌ Antes (Monolítico)

```
modules/crm/
├── routes.ts              # 500+ linhas, 25 rotas misturadas
├── service.ts             # Lógica de negócio
└── index.ts
```

**Problemas:**
- Difícil encontrar rota específica
- Conflitos frequentes em merges
- Modificar uma rota afeta arquivo inteiro
- Difícil testar rotas isoladamente

### ✅ Depois (100% Modular)

```
modules/crm/
├── routes/
│   ├── contacts-list.route.ts      # 30 linhas
│   ├── contacts-create.route.ts    # 30 linhas
│   ├── contacts-get.route.ts       # 25 linhas
│   ├── contacts-update.route.ts    # 30 linhas
│   ├── contacts-delete.route.ts    # 25 linhas
│   ├── deals-list.route.ts         # 30 linhas
│   ├── ... (20 mais arquivos)
│   └── index.ts                     # 50 linhas (só registros)
├── services/
│   └── crm.service.ts
├── schemas.ts
└── crm.http                         # 100+ testes
```

**Vantagens:**
- ✅ Cada rota em arquivo de ~30 linhas
- ✅ Zero conflitos em merges
- ✅ Mudanças isoladas e rastreáveis
- ✅ Testes por rota individual

## 🔧 Padrões e Convenções

### Nomenclatura de Arquivos

```
{resource}-{action}.route.ts

Exemplos:
- contacts-list.route.ts        # GET /contacts
- contacts-create.route.ts      # POST /contacts
- contacts-get.route.ts         # GET /contacts/:id
- contacts-update.route.ts      # PATCH /contacts/:id
- contacts-delete.route.ts      # DELETE /contacts/:id
- deals-move-stage.route.ts     # PATCH /deals/:id/stage
```

### Função de Setup

```typescript
export function setup{Resource}{Action}Route(...)

Exemplos:
- setupContactsListRoute
- setupContactsCreateRoute
- setupDealsMovestageRoute
```

### HTTP Methods

- **GET**: Buscar/Listar recursos
- **POST**: Criar recurso
- **PUT**: Substituir recurso completo
- **PATCH**: Atualizar parcialmente
- **DELETE**: Remover recurso

## 📚 Documentação por Rota

Cada arquivo de rota DEVE conter no topo:

```typescript
/**
 * {Module} - {Route Name} Route
 * {HTTP_METHOD} /api/v1/{module}/{path}
 *
 * Description: {O que esta rota faz}
 *
 * Auth: {Required/Optional/Public}
 * Permissions: {Lista de permissões necessárias}
 *
 * Request Body: {Tipo esperado}
 * Response: {Tipo retornado}
 *
 * Rate Limit: {Limite se houver}
 *
 * Examples:
 * - Success: {Exemplo de sucesso}
 * - Error: {Exemplo de erro}
 */
```

## 🧪 Testes HTTP

Cada módulo tem um arquivo `.http` com:

1. **Variáveis de ambiente**
   ```http
   @baseUrl = http://localhost:3000/api/v1
   @accessToken = {{login.response.body.data.accessToken}}
   ```

2. **Testes de sucesso**
   - Casos normais de uso
   - Com e sem autenticação

3. **Testes de erro**
   - Validação de campos
   - Autenticação inválida
   - Permissões negadas
   - Rate limiting

4. **Cenários de integração**
   - Fluxos completos
   - Dependências entre rotas

## 🚀 Migração de Módulos Existentes

### Checklist por Módulo

- [ ] Criar pasta `routes/`
- [ ] Separar cada rota em arquivo individual
- [ ] Criar `routes/index.ts` orquestrador
- [ ] Atualizar módulo principal para usar nova estrutura
- [ ] Criar arquivo `.http` com testes
- [ ] Deletar arquivo `routes.ts` antigo
- [ ] Testar todas as rotas funcionando
- [ ] Commit com mensagem descritiva

## 🎓 Exemplo Completo

Ver módulo **Auth** em `/backend/src/modules/auth/` como referência completa.

## 📞 Suporte

Dúvidas sobre a nova arquitetura? Consulte:
1. Módulo Auth (referência completa)
2. Este documento
3. Comentários inline nos arquivos
4. Equipe de arquitetura

---

**Versão**: 1.0.0
**Data**: 2026-01-02
**Autor**: Sistema de Arquitetura Modular
