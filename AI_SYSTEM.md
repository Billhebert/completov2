# 🤖 Sistema Inteligente de IA - 3 Modos

## 📋 Visão Geral

Sistema centralizado de IA com **3 modos inteligentes** que gerencia **TODOS** os recursos de inteligência artificial da plataforma.

---

## 🎯 3 MODOS DE IA

### 1️⃣ FULL - OpenAI (Melhor Qualidade)
- **Usa:** Apenas OpenAI (GPT-4)
- **Vantagens:**
  - ✅ Melhor qualidade de respostas
  - ✅ Mais confiável
  - ✅ Suporta tarefas complexas
- **Desvantagens:**
  - ⚠️ Custa dinheiro (~$0.03-$0.06/1k tokens)
  - ⚠️ Requer conexão internet
  - ⚠️ Depende de API key

**Quando usar:** Produção, clientes premium, tarefas críticas

---

### 2️⃣ AUTO - Híbrido Inteligente (Recomendado) ⭐
- **Usa:** IA decide entre OpenAI e Ollama
- **Lógica de Decisão:**
  ```
  Tarefa SIMPLES → Ollama (grátis)
  Tarefa MÉDIA → Ollama 70% / OpenAI 30%
  Tarefa COMPLEXA → OpenAI (qualidade)
  ```
- **Vantagens:**
  - ✅ Melhor custo-benefício
  - ✅ Balanceia qualidade e economia
  - ✅ Inteligente e adaptativo
- **Análise de Complexidade:**
  - Tamanho do prompt
  - Palavras-chave complexas
  - Contexto da tarefa

**Quando usar:** Desenvolvimento, uso geral, otimização de custos

---

### 3️⃣ ECONOMICO - Ollama (100% Grátis)
- **Usa:** Apenas Ollama (local)
- **Vantagens:**
  - ✅ Totalmente grátis
  - ✅ Privado (dados não saem do servidor)
  - ✅ Sem limites de uso
  - ✅ Funciona offline
- **Desvantagens:**
  - ⚠️ Qualidade menor que OpenAI
  - ⚠️ Mais lento (especialmente sem GPU)
  - ⚠️ Requer recursos do servidor

**Quando usar:** Testes, desenvolvimento local, budget limitado

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│         AIService (Core)                │
│  - Gerencia 3 modos                     │
│  - Análise de complexidade              │
│  - Decisão inteligente (AUTO mode)      │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
   ┌───▼────┐      ┌────▼───┐
   │ OpenAI │      │ Ollama │
   │  GPT-4 │      │ Llama2 │
   └────────┘      └────────┘
```

### Funcionalidades Implementadas:

✅ **Chat AI** (`/api/v1/ai/chat`)
- Conversas inteligentes com 3 modos
- Retorna: resposta, modelo usado, provider, tokens, custo

✅ **RAG/Embeddings**
- Gera embeddings com modo inteligente
- Usa OpenAI ou Ollama baseado no modo

✅ **Endpoints de Modo**
- `GET /api/v1/ai/mode` - Ver modo atual
- `POST /api/v1/ai/mode` - Mudar modo

---

## 🔧 Configuração

### Docker (Recomendado)

```bash
# Ollama já incluído no docker-compose.dev.yml
docker-compose -f docker-compose.dev.yml up

# Auto-download de modelos:
# - llama2 (geral)
# - mistral (mais rápido)
```

### Variáveis de Ambiente

```.env
# Modo de IA (full | auto | economico)
AI_MODE=auto

# OpenAI (para modo FULL ou AUTO)
OPENAI_API_KEY=sk-sua-chave-aqui
OPENAI_MODEL=gpt-4

# Ollama (para modo ECONOMICO ou AUTO)
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=llama2
```

---

## 💻 Uso no Código

### Importar AIService

```typescript
import { getAIService } from '../core/ai/ai.service';

const aiService = getAIService(prisma);
```

### Chat Simples

```typescript
const result = await aiService.complete({
  prompt: 'Explique o que é TypeScript',
  systemMessage: 'Você é um professor de programação.',
  temperature: 0.7,
});

console.log(result.content);   // Resposta da IA
console.log(result.provider);  // 'openai' ou 'ollama'
console.log(result.cost);      // Custo em USD (0 para Ollama)
```

### Embeddings

```typescript
const embedding = await aiService.generateEmbedding('Texto para vetorizar');
// Retorna: number[] (1536 dimensões OpenAI / variável Ollama)
```

### Análise de Sentimento

```typescript
const sentiment = await aiService.analyzeSentiment('Adorei este produto!');
// Retorna: { sentiment: 'positive', score: 0.95 }
```

### Sumarização

```typescript
const summary = await aiService.summarize(longText, 200);
// Retorna: Resumo em até 200 caracteres
```

### Sugestões

```typescript
const suggestions = await aiService.generateSuggestions(
  'Cliente interessado em CRM',
  'próximos passos'
);
// Retorna: ['Agendar demo', 'Enviar proposta', ...]
```

### Mudar Modo

```typescript
import { AIMode } from '../core/ai/ai.service';

aiService.setMode(AIMode.ECONOMICO);  // Muda para Ollama
aiService.setMode(AIMode.FULL);       // Muda para OpenAI
aiService.setMode(AIMode.AUTO);       // Muda para híbrido
```

---

## 🎨 Aplicações

### 1. Chat AI
**Arquivo:** `AIChatPage.tsx`
```typescript
// Frontend chama:
POST /api/v1/ai/chat
{
  "message": "Como posso melhorar minhas vendas?",
  "temperature": 0.7
}

// Resposta:
{
  "message": "...",
  "provider": "ollama",  // ou "openai"
  "model": "llama2",
  "cost": 0
}
```

### 2. Zettels Inteligentes
**Recurso:** Sugestões automáticas de tags e links
```typescript
// Ao criar zettel:
const suggestions = await aiService.generateSuggestions(
  zettel.content,
  'tags relacionadas'
);
```

### 3. Notificações Inteligentes
**Recurso:** Análise de prioridade e sentimento
```typescript
const sentiment = await aiService.analyzeSentiment(notification.message);
if (sentiment.score < 0.3) {
  // Notificação urgente
}
```

### 4. RAG (Busca Semântica)
**Recurso:** Embeddings inteligentes
```typescript
// RAGService já usa AIService automaticamente
const embedding = await ragService.generateEmbedding(text);
```

---

## 📊 Análise de Complexidade (Modo AUTO)

### Fatores Analisados:

1. **Tamanho do Prompt**
   - < 100 chars → SIMPLE
   - 100-1000 chars → MEDIUM
   - \> 1000 chars → COMPLEX

2. **Palavras-chave**
   - **Simples:** summarize, translate, basic, quick
   - **Complexas:** analyze, technical, professional, legal, medical

3. **Contexto** (futuro)
   - Histórico do usuário
   - Tipo de tarefa
   - Feedback anterior

### Decisão (Modo AUTO):

```
SIMPLE → 100% Ollama
MEDIUM → 70% Ollama, 30% OpenAI
COMPLEX → 100% OpenAI (se disponível)
```

---

## 🔍 Exemplos Práticos

### Exemplo 1: Chat Simples
```
Prompt: "Olá, como você está?"
Complexidade: SIMPLE
Provider: Ollama
Custo: $0
```

### Exemplo 2: Tarefa Média
```
Prompt: "Explique as melhores práticas de vendas B2B"
Complexidade: MEDIUM
Provider: Ollama (70% chance) ou OpenAI (30% chance)
Custo: $0 ou ~$0.03
```

### Exemplo 3: Tarefa Complexa
```
Prompt: "Analise este contrato legal de 2000 palavras e identifique riscos..."
Complexidade: COMPLEX
Provider: OpenAI (se disponível)
Custo: ~$0.15
```

---

## 💰 Economia de Custos

### Cenário: 10.000 requests/mês

| Modo | Distribuição | Custo Mensal |
|------|--------------|--------------|
| **FULL** | 100% OpenAI | $450 |
| **AUTO** | 70% Ollama + 30% OpenAI | $135 |
| **ECONOMICO** | 100% Ollama | $0 |

**Economia com AUTO:** 70% vs FULL ✅

---

## 🚀 Próximas Implementações

### Planejado:
- [ ] Tracking de uso por empresa
- [ ] Dashboard de custos e métricas
- [ ] Cache de respostas frequentes
- [ ] Fine-tuning de modelos Ollama
- [ ] Suporte a mais modelos (Claude, Gemini)
- [ ] A/B testing automático de modelos
- [ ] Feedback loop para melhorar decisões AUTO

### Aplicar em:
- [ ] Zettels inteligentes (sugestões automáticas)
- [ ] Notificações inteligentes (priorização)
- [ ] Deals (análise de probabilidade)
- [ ] Contacts (enriquecimento de dados)
- [ ] Workflows (automação inteligente)

---

## 🛠️ Troubleshooting

### ❌ "Ollama not responding"
```bash
# Verificar se Ollama está rodando:
docker-compose -f docker-compose.dev.yml logs ollama

# Restart Ollama:
docker-compose -f docker-compose.dev.yml restart ollama

# Baixar modelo manualmente:
docker-compose -f docker-compose.dev.yml exec ollama ollama pull llama2
```

### ❌ "OpenAI authentication failed"
```bash
# Verificar API key:
echo $OPENAI_API_KEY

# Testar manualmente:
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hello"}]}'
```

### ❌ "Mode AUTO always using Ollama"
- Se OpenAI não está configurado, AUTO = ECONOMICO
- Adicione OPENAI_API_KEY para ativar híbrido real

---

## 📖 API Reference

### POST /api/v1/ai/chat
**Request:**
```json
{
  "message": "Sua pergunta",
  "systemMessage": "Contexto opcional",
  "temperature": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Resposta da IA",
    "model": "llama2",
    "provider": "ollama",
    "tokensUsed": 150,
    "cost": 0
  }
}
```

### GET /api/v1/ai/mode
**Response:**
```json
{
  "success": true,
  "data": {
    "mode": "auto"
  }
}
```

### POST /api/v1/ai/mode
**Request:**
```json
{
  "mode": "full" | "auto" | "economico"
}
```

---

## ✅ Checklist de Implementação

- [x] AIService centralizado criado
- [x] 3 modos implementados (FULL/AUTO/ECONOMICO)
- [x] Lógica de decisão AUTO
- [x] Chat AI endpoint real
- [x] RAG/Embeddings com 3 modos
- [x] Ollama no Docker
- [x] Configuração de ambiente
- [x] Documentação completa
- [ ] UI para seletor de modo
- [ ] Tracking de custos
- [ ] Dashboard de métricas
- [ ] Aplicar em Zettels
- [ ] Aplicar em Notificações

---

## 🎊 Status

**Implementado:** ✅ Sistema Core Completo
**Testado:** ⚠️ Requer teste manual
**Produção:** 🟡 Pronto para uso (falta UI)

---

**Desenvolvido com ❤️ | Completov2 AI System**
**Versão:** 1.0.0
**Data:** 31 de Dezembro de 2025
