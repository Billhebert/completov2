# 🧠 Sistema de Zettels Obsidian-Style - Completov2

## 📋 Visão Geral

Sistema completo de gestão de conhecimento baseado no conceito de Zettelkasten (como Obsidian), onde **TUDO no sistema é tratado como um zettel**: negociações, conversas, documentação, insights, reuniões, tarefas, etc.

### Características Principais:

✅ **Hierarquia de Zettels** - Company-wide (empresa) + Personal (funcionário)
✅ **Permissões Especiais** - DEV e ADMIN_GERAL veem TUDO de TODAS as empresas
✅ **Visualização Obsidian** - Grafo completo de conhecimento interativo
✅ **RAG Automático** - Todos os zettels indexados automaticamente para busca semântica
✅ **Conversão de Entidades** - Deals, mensagens, conversas → zettels automaticamente
✅ **IA com Contexto Completo** - AI acessa zettels da empresa E do usuário

---

## 🏗️ Arquitetura

### Hierarquia de Zettels

```
Sistema de Zettels
├── Zettels da Empresa (Company-Wide)
│   ├── Deals convertidos
│   ├── Documentação oficial
│   ├── Procedimentos
│   ├── Insights da equipe
│   └── Conversas importantes
│
└── Zettels Pessoais (Personal)
    ├── Notas pessoais de cada funcionário
    ├── Reuniões individuais
    ├── Tarefas pessoais
    └── Insights privados
```

### Permissões

| Tipo de Usuário | Zettels da Própria Empresa | Zettels Pessoais Próprios | Zettels de Outras Empresas | Zettels Pessoais de Outros |
|-----------------|---------------------------|---------------------------|----------------------------|----------------------------|
| **Funcionário Normal** | ✅ Ver todos | ✅ Ver os seus | ❌ Não | ❌ Não |
| **Admin da Empresa** | ✅ Ver todos | ✅ Ver os seus | ❌ Não | ❌ Não |
| **DEV** | ✅ Ver TODOS | ✅ Ver TODOS | ✅ Ver TODOS | ✅ Ver TODOS |
| **ADMIN_GERAL** | ✅ Ver TODOS | ✅ Ver TODOS | ✅ Ver TODOS | ✅ Ver TODOS |

---

## 🎯 Tipos de Zettels

O sistema suporta múltiplos tipos de zettels:

```typescript
nodeType: 'zettel'        // Nota geral do tipo Zettelkasten
         | 'documentation' // Documentação técnica
         | 'procedure'     // Procedimento/processo
         | 'reference'     // Referência/recurso
         | 'insight'       // Insight/descoberta
         | 'deal'          // Negociação (auto-convertido)
         | 'message'       // Mensagem (auto-convertido)
         | 'conversation'  // Conversa (auto-convertido)
         | 'meeting'       // Reunião (auto-convertido)
         | 'task'          // Tarefa (auto-convertido)
```

---

## 📊 Visualização Obsidian-Style

### Endpoint Principal

```http
GET /api/v1/knowledge/graph/obsidian
```

**Query Parameters:**
- `scope` - Escopo de visualização (padrão: `accessible`)
  - `accessible` - Zettels da empresa + pessoais do usuário
  - `company` - Apenas zettels da empresa
  - `personal` - Apenas zettels pessoais
- `companyId` - *(Apenas DEV/ADMIN_GERAL)* Filtrar por empresa específica
- `limit` - Número máximo de nós (padrão: 500)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "node-123",
        "label": "Deal: ACME Corp",
        "type": "deal",
        "tags": ["vendas", "b2b"],
        "importance": 0.85,
        "isCompanyWide": true,
        "owner": null,
        "createdBy": "João Silva",
        "companyId": "company-abc",
        "color": "#3b82f6",  // Azul = empresa, Roxo = pessoal
        "size": 27            // 10 + (importance * 20)
      }
    ],
    "edges": [
      {
        "id": "link-456",
        "from": "node-123",
        "to": "node-789",
        "label": "supports",
        "value": 0.9,
        "arrows": "to",
        "color": "#3b82f6"   // Cores por tipo de relação
      }
    ],
    "metadata": {
      "totalNodes": 156,
      "totalLinks": 289,
      "viewMode": "accessible",
      "userRole": "user"
    }
  }
}
```

### Cores do Grafo

**Nós (Nodes):**
- 🔵 **Azul (#3b82f6)** - Zettel da empresa (company-wide)
- 🟣 **Roxo (#8b5cf6)** - Zettel pessoal

**Arestas (Edges):**
- ⚫ **Cinza (#64748b)** - `related` (relacionado)
- 🟢 **Verde (#10b981)** - `derives` (deriva de)
- 🔵 **Azul (#3b82f6)** - `supports` (suporta)
- 🔴 **Vermelho (#ef4444)** - `contradicts` (contradiz)

### Integração Frontend

```typescript
// Usando vis.js para visualização
import { Network } from 'vis-network';

const response = await fetch('/api/v1/knowledge/graph/obsidian?scope=accessible');
const { data } = await response.json();

const container = document.getElementById('knowledge-graph');
const network = new Network(container, data, {
  physics: {
    enabled: true,
    barnesHut: {
      gravitationalConstant: -2000,
      springLength: 200,
      springConstant: 0.04
    }
  },
  nodes: {
    shape: 'dot',
    font: { size: 14 }
  },
  edges: {
    smooth: { type: 'continuous' }
  }
});

// Click handler
network.on('click', (params) => {
  if (params.nodes.length > 0) {
    const nodeId = params.nodes[0];
    // Abrir detalhes do zettel
    openZettelDetails(nodeId);
  }
});
```

---

## 🔄 Conversão de Entidades para Zettels

### Conversão Individual

```http
POST /api/v1/knowledge/convert
```

**Body:**
```json
{
  "entityType": "deal",
  "entityId": "deal-123",
  "title": "Deal: ACME Corp - R$ 50.000",
  "content": "Negociação iniciada em 15/01/2024. Cliente interessado em pacote enterprise. Principais objeções: preço e prazo de implementação.",
  "tags": ["vendas", "b2b", "enterprise"],
  "isPersonal": false  // true = zettel pessoal, false = empresa
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "node-xyz",
    "title": "Deal: ACME Corp - R$ 50.000",
    "nodeType": "deal",
    "isCompanyWide": true,
    "metadata": {
      "sourceEntityType": "deal",
      "sourceEntityId": "deal-123",
      "autoConverted": true
    }
  }
}
```

### Conversão em Lote

```http
POST /api/v1/knowledge/convert/batch
```

**Body:**
```json
{
  "entities": [
    {
      "entityType": "message",
      "entityId": "msg-1",
      "title": "Conversa com Cliente X",
      "content": "Cliente perguntou sobre pricing...",
      "tags": ["chat", "pricing"],
      "isPersonal": false
    },
    {
      "entityType": "meeting",
      "entityId": "meeting-2",
      "title": "1:1 com Manager",
      "content": "Discutimos metas Q1...",
      "tags": ["1:1", "metas"],
      "isPersonal": true  // Zettel pessoal
    }
  ]
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "created": 2,
    "total": 2,
    "nodes": [...]
  }
}
```

---

## 🤖 IA com Acesso Completo ao Conhecimento

### Como Funciona

Quando um usuário faz uma pergunta para a IA, ela tem acesso a:

1. **Zettels da Empresa** - Todo conhecimento compartilhado da organização
2. **Zettels Pessoais do Usuário** - Notas e insights pessoais do funcionário
3. **RAG (Busca Semântica)** - Busca vetorial em todos os zettels indexados

Isso permite que a IA forneça respostas mais contextualizadas e personalizadas.

### Exemplo de Uso

**Usuário:** "Como fechar o deal com a ACME Corp?"

**IA acessa:**
- ✅ Zettel do deal ACME (empresa)
- ✅ Histórico de conversas com cliente (empresa)
- ✅ Notas pessoais do usuário sobre o cliente (pessoal)
- ✅ Procedimentos de vendas (empresa)
- ✅ Insights anteriores do usuário (pessoal)

**Resposta da IA:** *Contextualizada com TODOS esses dados*

---

## 📝 CRUD de Zettels

### Criar Zettel

```http
POST /api/v1/knowledge/nodes
```

```json
{
  "title": "Estratégia de Vendas Q1 2024",
  "content": "Focar em segmento enterprise com emphasis em ROI...",
  "nodeType": "insight",
  "tags": ["vendas", "estratégia", "q1"],
  "importanceScore": 0.9,
  "isCompanyWide": true,  // false para zettel pessoal
  "ownerId": null          // user ID se pessoal
}
```

**Auto-RAG:** ✅ Embedding criado automaticamente

### Listar Zettels

```http
GET /api/v1/knowledge/nodes?scope=accessible
```

**Scopes disponíveis:**
- `accessible` - Empresa + pessoais (padrão)
- `company` - Apenas empresa
- `personal` - Apenas pessoais

**Filtros:**
- `search` - Busca em título e conteúdo
- `nodeType` - Filtrar por tipo
- `tag` - Filtrar por tag
- `minImportance` - Score mínimo de importância

### Atualizar Zettel

```http
PATCH /api/v1/knowledge/nodes/:id
```

```json
{
  "content": "Conteúdo atualizado...",
  "tags": ["vendas", "estratégia", "q1", "prioridade"]
}
```

**Auto-RAG:** ✅ Embedding atualizado automaticamente

### Deletar Zettel

```http
DELETE /api/v1/knowledge/nodes/:id
```

**Nota:** Soft delete (marca como deletado mas não remove)

---

## 🔗 Links Entre Zettels

### Tipos de Links

- **related** - Relacionamento geral
- **derives** - Um zettel deriva do outro
- **supports** - Um zettel suporta as afirmações do outro
- **contradicts** - Um zettel contradiz o outro

### Criar Link

```http
POST /api/v1/knowledge/nodes/:id/links
```

```json
{
  "targetId": "node-xyz",
  "linkType": "supports",
  "strength": 0.9  // 0-1
}
```

### Sugestões de Links (IA)

```http
GET /api/v1/knowledge/nodes/:id/suggest-links
```

A IA analisa o conteúdo e sugere links relevantes com os tipos apropriados.

---

## 🏷️ Tags Inteligentes

### Sugerir Tags (IA)

```http
POST /api/v1/knowledge/nodes/suggest-tags
```

```json
{
  "title": "Estratégia de Crescimento",
  "content": "Vamos focar em expansão para mercado internacional..."
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "tags": ["estratégia", "crescimento", "internacional", "expansão"]
  }
}
```

### Listar Tags Populares

```http
GET /api/v1/knowledge/tags
```

---

## 🎨 Casos de Uso

### 1. Sistema de Documentação Empresarial

```typescript
// Criar documentação técnica
POST /api/v1/knowledge/nodes
{
  "title": "Como configurar ambiente de dev",
  "content": "1. Instalar Node.js...",
  "nodeType": "documentation",
  "tags": ["dev", "setup", "onboarding"],
  "isCompanyWide": true
}
```

### 2. Notas Pessoais de Reunião

```typescript
// Criar nota pessoal
POST /api/v1/knowledge/nodes
{
  "title": "1:1 com Manager - 20/01/2024",
  "content": "Discutimos progressão de carreira...",
  "nodeType": "meeting",
  "tags": ["1:1", "carreira"],
  "isCompanyWide": false,  // Pessoal!
  "ownerId": "user-123"
}
```

### 3. Captura Automática de Negociações

```typescript
// Quando deal é criado, converter automaticamente para zettel
async function onDealCreated(deal) {
  await fetch('/api/v1/knowledge/convert', {
    method: 'POST',
    body: JSON.stringify({
      entityType: 'deal',
      entityId: deal.id,
      title: `Deal: ${deal.title}`,
      content: `
        Cliente: ${deal.contact.name}
        Valor: R$ ${deal.value}
        Stage: ${deal.stage}
        Observações: ${deal.notes}
      `,
      tags: ['vendas', 'deal', deal.stage],
      isPersonal: false
    })
  });
}
```

### 4. Knowledge Base com Busca Semântica

```typescript
// Buscar insights relacionados
GET /api/v1/knowledge/nodes/:id/suggestions

// A IA usa RAG para encontrar zettels semanticamente similares
// Tanto da empresa quanto pessoais do usuário
```

### 5. Visualização para Administradores

```typescript
// DEV/ADMIN vendo todas as empresas
GET /api/v1/knowledge/graph/obsidian
// Sem companyId = VÊ TUDO

// Filtrar por empresa específica
GET /api/v1/knowledge/graph/obsidian?companyId=company-xyz
```

---

## 🔐 Segurança e Privacidade

### Regras de Acesso

1. **Funcionários normais:**
   - ✅ Veem todos os zettels da sua empresa
   - ✅ Veem apenas seus próprios zettels pessoais
   - ❌ Não veem zettels de outras empresas
   - ❌ Não veem zettels pessoais de outros

2. **DEV e ADMIN_GERAL:**
   - ✅ Veem TUDO de TODAS as empresas
   - ✅ Veem TODOS os zettels pessoais de TODOS os funcionários
   - 🎯 Útil para debugging, suporte e administração global

### Proteção de Dados

- Zettels pessoais são marcados com `ownerId`
- Query automática filtra por permissões
- Soft delete para recuperação
- Audit trail através de `createdById`

---

## 📊 Estatísticas e Métricas

### Métricas Disponíveis

- Total de zettels (empresa vs pessoal)
- Zettels mais acessados (`accessCount`)
- Zettels mais importantes (`importanceScore`)
- Tags mais usadas
- Densidade de links (conectividade do grafo)
- Zettels órfãos (sem links)

### Dashboard Sugerido

```typescript
const stats = {
  totalNodes: await prisma.knowledgeNode.count(),
  companyNodes: await prisma.knowledgeNode.count({
    where: { isCompanyWide: true }
  }),
  personalNodes: await prisma.knowledgeNode.count({
    where: { isCompanyWide: false }
  }),
  totalLinks: await prisma.knowledgeLink.count(),
  avgLinksPerNode: totalLinks / totalNodes
};
```

---

## 🚀 Próximos Passos

- [ ] Frontend com vis.js ou D3.js para visualização
- [ ] Busca full-text avançada
- [ ] Versionamento de zettels
- [ ] Colaboração em tempo real
- [ ] Export para Markdown/Obsidian
- [ ] Import de arquivos Markdown
- [ ] Templates de zettels
- [ ] Automações baseadas em zettels

---

## 💡 Dicas de Uso

1. **Tag Consistency:** Use tags consistentes para melhor organização
2. **Links Ricos:** Adicione links com tipos apropriados para melhor compreensão da IA
3. **Importância:** Ajuste `importanceScore` para priorizar conteúdo crítico
4. **Conversão Automática:** Configure webhooks para converter entidades automaticamente
5. **Review Regular:** Use o grafo para identificar gaps de conhecimento

---

**Desenvolvido com ❤️ | Completov2 Zettel System**
