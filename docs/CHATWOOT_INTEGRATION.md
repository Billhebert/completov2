# Integração Chatwoot

Documentação completa para integração com o Chatwoot.

## 📋 Pré-requisitos

1. Conta no Chatwoot (self-hosted ou cloud)
2. API Access Token
3. Account ID

## 🔑 Configuração

### 1. Obter credenciais do Chatwoot

1. Acesse seu Chatwoot: `https://app.chatwoot.com` (ou sua instância)
2. Vá em **Profile Settings** → **Access Token**
3. Copie o **API Access Token**
4. Anote seu **Account ID** (aparece na URL: `/app/accounts/{ACCOUNT_ID}/`)

### 2. Criar conexão no OMNI Platform

**Endpoint:** `POST /api/v1/sync/connections`

```json
{
  "provider": "chatwoot",
  "apiKey": "seu_api_access_token",
  "config": {
    "accountId": "123",
    "apiUrl": "https://app.chatwoot.com"  // Opcional, padrão: https://app.chatwoot.com
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "conn_123",
    "provider": "chatwoot",
    "status": "connected"
  }
}
```

## 🔄 Sincronização

### Sincronizar Contatos (Pull)

Importa contatos do Chatwoot para o OMNI Platform.

**Endpoint:** `POST /api/v1/sync/connections/{connectionId}/sync`

```bash
curl -X POST https://api.omni.com/api/v1/sync/connections/conn_123/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "synced": 150,
    "created": 100,
    "updated": 40,
    "skipped": 10,
    "errors": 0
  }
}
```

### Push Contatos

Envia contatos do OMNI para o Chatwoot.

```bash
curl -X POST https://api.omni.com/api/v1/sync/run \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "chatwoot",
    "entityType": "contacts",
    "direction": "push"
  }'
```

### Sincronizar Conversas

Importa conversas do Chatwoot.

```json
{
  "provider": "chatwoot",
  "entityType": "conversations",
  "direction": "pull"
}
```

## 🔔 Webhooks (Tempo Real)

Para sincronização em tempo real, configure webhooks no Chatwoot.

### 1. Configurar Webhook no Chatwoot

1. Vá em **Settings** → **Integrations** → **Webhooks**
2. Clique em **Add Webhook**
3. Configure:
   - **URL:** `https://sua-api.com/api/v1/sync/chatwoot/webhook`
   - **Events:** Selecione os eventos desejados:
     - `message_created`
     - `conversation_created`
     - `conversation_updated`
     - `contact_created`
     - `contact_updated`

### 2. Eventos Suportados

| Evento | Descrição | Ação |
|--------|-----------|------|
| `message_created` | Nova mensagem criada | Cria mensagem no OMNI |
| `conversation_created` | Nova conversa iniciada | Cria conversa no OMNI |
| `conversation_updated` | Conversa atualizada | Atualiza conversa no OMNI |
| `contact_created` | Novo contato criado | Cria contato no OMNI |
| `contact_updated` | Contato atualizado | Atualiza contato no OMNI |

### 3. Payload do Webhook

Exemplo de payload recebido:

```json
{
  "event": "message_created",
  "account": {
    "id": 1,
    "name": "Acme Inc"
  },
  "conversation": {
    "id": 123,
    "inbox_id": 1,
    "status": "open"
  },
  "message": {
    "id": 456,
    "content": "Hello!",
    "message_type": 0,
    "sender": {
      "id": 789,
      "name": "John Doe"
    }
  }
}
```

## 🔐 Sistema Anti-Duplicação

A integração usa um sistema inteligente de **fingerprint** para evitar duplicações:

### Como Funciona:

1. **Fingerprint:** Hash único gerado com base nos dados principais (email, nome, telefone)
2. **Mapping Table:** Tabela `ExternalEntityMap` mapeia IDs externos ↔ IDs internos
3. **Chave Única:** `(companyId, provider, entityType, externalId)`
4. **Detecção de Mudanças:**
   - Se fingerprint igual → **SKIP** (não duplica)
   - Se fingerprint diferente → **UPDATE** (atualiza dados)
   - Se não existe mapping → **CREATE** (cria novo)

### Exemplo:

```
1ª Sync: Contato "João" (email: joao@email.com)
         → Cria contato + mapping

2ª Sync: Contato "João" (email: joao@email.com) - SEM MUDANÇAS
         → SKIP (fingerprint igual)

3ª Sync: Contato "João Silva" (email: joao@email.com) - NOME MUDOU
         → UPDATE (fingerprint diferente)

4ª Sync: Tenta criar "João Silva" novamente
         → SKIP (mapping já existe)
```

## ✅ Campos Mapeados

### Contatos (Chatwoot → OMNI)

| Chatwoot | OMNI | Observações |
|----------|------|-------------|
| `id` | `customFields.chatwoot_id` | ID original |
| `name` | `name` | Nome do contato |
| `email` | `email` | Email |
| `phone_number` | `phone` | Telefone |
| `identifier` | `customFields.chatwoot_identifier` | Identificador único |
| `thumbnail` | `customFields.chatwoot_thumbnail` | Avatar |
| `additional_attributes` | `customFields.chatwoot_additional_attributes` | Campos extras |

### Conversas (Chatwoot → OMNI)

| Chatwoot | OMNI |
|----------|------|
| `id` | `metadata.chatwoot_id` |
| `status` | `status` (mapeado: open→active, resolved→completed) |
| `inbox_id` | `metadata.chatwoot_inbox_id` |
| `messages_count` | `metadata.chatwoot_messages_count` |
| `labels` | `metadata.chatwoot_labels` |

## 📊 Monitoramento

### Ver Conexões Ativas

```bash
GET /api/v1/sync/connections
```

### Ver Histórico de Sincronizações

```bash
GET /api/v1/sync/runs
```

### Ver Detalhes de uma Sincronização

```bash
GET /api/v1/sync/runs/{runId}
```

## 🚨 Tratamento de Erros

Todos os erros são logados e retornados na resposta:

```json
{
  "success": true,
  "data": {
    "synced": 95,
    "created": 90,
    "updated": 5,
    "skipped": 0,
    "errors": 5,
    "errorMessages": [
      "Contact 123: Email required",
      "Contact 456: Invalid phone format"
    ]
  }
}
```

## 🔧 Troubleshooting

### Erro: "Connection test failed"

**Causa:** API Key inválido ou Account ID incorreto

**Solução:**
1. Verifique o API Access Token
2. Confirme o Account ID correto
3. Teste manualmente: `curl -H "api_access_token: YOUR_TOKEN" https://app.chatwoot.com/api/v1/accounts/{ACCOUNT_ID}/contacts`

### Erro: "Contact duplicated"

**Causa:** Sync manual executado múltiplas vezes

**Solução:** O sistema já previne duplicação automaticamente. Se ocorrer, verifique os logs em `/api/v1/sync/runs/{runId}`

### Contatos não aparecem

**Causa:** Filtro de companyId ou mapping incorreto

**Solução:**
1. Verifique se `companyId` está correto na requisição
2. Consulte `ExternalEntityMap` para ver os mappings: `SELECT * FROM external_entity_maps WHERE provider = 'chatwoot'`

## 📚 Documentação Oficial

- [Chatwoot API Docs](https://www.chatwoot.com/docs/product/channels/api/client-apis)
- [Chatwoot Webhooks](https://www.chatwoot.com/docs/product/webhooks)
- [Chatwoot API Reference](https://www.chatwoot.com/developers/api/)

## 🔄 Próximos Passos

1. Configure os webhooks para sincronização em tempo real
2. Ajuste os campos customizados conforme sua necessidade
3. Configure sync automático via cron job
4. Monitore os logs regularmente

---

**Suporte:** Para dúvidas, abra uma issue ou contate o time de desenvolvimento.
