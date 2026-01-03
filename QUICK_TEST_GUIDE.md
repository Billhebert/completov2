# 🧪 Guia Rápido de Testes - Completo V2

## Como testar as rotas em 5 minutos

---

## 1️⃣ Opção 1: VS Code REST Client (Recomendado)

### Instalação
1. Abra VS Code
2. Vá para Extensions (Ctrl+Shift+X)
3. Pesquise "REST Client"
4. Instale a extensão de "Huachao Mao"
5. Reload VS Code

### Teste Rápido
1. Abra: `backend/src/modules/crm/teste.http`
2. Localize a linha: `@token = Bearer YOUR_JWT_TOKEN_HERE`
3. Substitua por seu token JWT real
4. Clique em "Send Request" acima de qualquer linha GET/POST
5. Veja a resposta no painel lateral

**Tempo**: 2 minutos

---

## 2️⃣ Opção 2: cURL (Terminal)

### Teste sem autenticação
```bash
curl -X GET "http://localhost:3000/api/v1/jobs?types=public&limit=5"
```

### Teste com autenticação
```bash
# Primeiro, faça login
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@company.com",
    "password": "sua-senha"
  }'

# Copie o token da resposta, então:
curl -X GET "http://localhost:3000/api/v1/crm/contacts" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Tempo**: 5 minutos

---

## 3️⃣ Opção 3: Postman

### Importar
1. Abra Postman
2. Clique em "Import"
3. Cole o conteúdo de `backend/src/modules/crm/teste.http`
4. Configure variáveis
5. Execute

**Tempo**: 10 minutos

---

## 📋 Roteiro de Testes Recomendado

### Nível 1: Básico (15 minutos)
```
1. Teste AUTH (login)
2. Teste CRM (listar contatos)
3. Teste SETTINGS (obter configurações)
```

### Nível 2: Intermediário (30 minutos)
```
1. Teste CRM completo (CRUD)
2. Teste ANALYTICS (dashboard)
3. Teste NOTIFICATIONS (listar)
```

### Nível 3: Avançado (1 hora)
```
1. Teste CMMS (asset management)
2. Teste FSM (field service)
3. Teste LEARNING (learning paths)
```

### Nível 4: Integrations (2 horas)
```
1. Teste SYNC (integrations)
2. Teste OMNICHANNEL (multi-canal)
3. Teste AUTOMATIONS (workflows)
```

---

## 🎯 Teste Específico por Módulo

### 1. Testar CRM (19 rotas)
```
Arquivo: backend/src/modules/crm/teste.http

Passos:
1. GET - List Contacts
2. POST - Create Contact
3. GET - Get Contact
4. PUT - Update Contact
5. POST - Create Deal
6. PUT - Update Deal Stage
```

### 2. Testar CMMS (14 rotas)
```
Arquivo: backend/src/modules/cmms/teste.http
README: backend/src/modules/cmms/README.md

Passos:
1. GET - List Assets
2. POST - Create Asset
3. GET - Get Asset
4. POST - Create Maintenance Plan
5. POST - Create Maintenance Record
6. POST - Create Downtime
7. POST - Create Spare Part
8. POST - Record Part Movement
```

### 3. Testar FSM (13 rotas)
```
Arquivo: backend/src/modules/fsm/teste.http
README: backend/src/modules/fsm/README.md

Passos:
1. GET - List Technicians
2. POST - Create Technician
3. GET - List Work Orders
4. POST - Create Work Order
5. POST - Start Work Order
6. POST - Add Task
7. POST - Complete Work Order
```

### 4. Testar Learning (10 rotas)
```
Arquivo: backend/src/modules/learning/teste.http
README: backend/src/modules/learning/README.md

Passos:
1. GET - List Paths
2. POST - Create Path
3. POST - Enroll User
4. GET - List Enrollments
5. POST - Complete Item
6. GET - List Skills
```

### 5. Testar Sync (6 rotas)
```
Arquivo: backend/src/modules/sync/teste.http
README: backend/src/modules/sync/README.md

Passos:
1. GET - List Connections
2. POST - Create Connection (RDStation/Chatwoot)
3. GET - List Sync Runs
4. POST - Start Sync Job
```

---

## 🔑 Obter Token JWT

### Método 1: Via Login
```bash
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@company.com",
    "password": "sua-senha"
  }'
```

Resposta:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {...}
  }
}
```

Copie o `token` e use em:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Método 2: Via Banco de Dados
Se tiver acesso direto ao banco, copie um token existente.

---

## ⚠️ Erros Comuns & Soluções

### Erro 401: Unauthorized
**Causa**: Token inválido ou expirado

**Solução**:
1. Faça login novamente
2. Copie o novo token
3. Atualize no teste

### Erro 403: Forbidden
**Causa**: Usuário não tem permissão

**Solução**:
1. Verifique role do usuário
2. Adicione permissão necessária
3. Re-teste

### Erro 404: Not Found
**Causa**: Recurso não existe ou ID está errado

**Solução**:
1. Verifique se o ID existe
2. Crie o recurso primeiro
3. Use o novo ID

### Erro 500: Internal Server Error
**Causa**: Erro no servidor

**Solução**:
1. Verifique logs do servidor
2. Verifique conexão com banco
3. Verifique variáveis de ambiente

---

## 🧪 Template de Teste Customizado

Se quiser criar seu próprio teste, use este template:

```http
### Test Name
POST http://localhost:3000/api/v1/module/endpoint
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "field1": "value1",
  "field2": "value2"
}

### Get Result
GET http://localhost:3000/api/v1/module/endpoint/{{resourceId}}
Authorization: Bearer {{token}}
```

---

## 📚 Documentação Completa

Após os testes, consulte:

1. **Visão geral**: `MODULES_DOCUMENTATION.md`
2. **Validação**: `VALIDATION_REPORT.md`
3. **Sumário**: `DOCUMENTATION_COMPLETE.md`
4. **Module específico**: `backend/src/modules/[nome]/README.md`

---

## ✅ Checklist de Teste

Ao testar um módulo, verifique:

- [ ] Autenticação funcionando (token aceito)
- [ ] GET retorna dados
- [ ] POST cria novo recurso
- [ ] PUT atualiza recurso
- [ ] DELETE remove recurso
- [ ] Validação funciona (tente com dados inválidos)
- [ ] Erro handling funciona (pegue um 404 propositalmente)
- [ ] Paginação funciona (tente page=2)

---

## 🎯 Teste End-to-End Exemplo: CRM

```
1. Login
   POST /auth/login
   → Copie token

2. Criar Contato
   POST /crm/contacts
   {
     "name": "Test Contact",
     "email": "test@example.com",
     "phone": "+1-555-1234"
   }
   → Copie ID do contato

3. Listar Contatos
   GET /crm/contacts
   → Verifique se aparece na lista

4. Atualizar Contato
   PUT /crm/contacts/{id}
   {
     "name": "Updated Name"
   }
   → Verifique atualização

5. Criar Deal
   POST /crm/deals
   {
     "title": "Big Deal",
     "contactId": "{copied-id}",
     "value": 50000
   }
   → Verifique criação

6. Deletar Contato
   DELETE /crm/contacts/{id}
   → Verifique remoção
```

---

## 🚀 Próximos Passos

Após completar os testes:

1. ✅ Você validou 200+ rotas
2. ✅ Você entendeu como testar
3. ✅ Você pode começar a usar a API
4. ✅ Você sabe onde está a documentação

**Próximo**: Deploy em staging e testes de carga

---

## 📞 Problemas?

1. Veja erro em `VALIDATION_REPORT.md`
2. Consulte documentação do módulo
3. Verifique logs do servidor
4. Verifique variáveis de ambiente

---

## 🎓 Tempo Estimado

| Atividade | Tempo |
|-----------|-------|
| Instalar REST Client | 2 min |
| Testar CRM | 10 min |
| Testar CMMS | 15 min |
| Testar FSM | 15 min |
| Testar Learning | 10 min |
| Testar Sync | 10 min |
| **TOTAL** | **~1 hora** |

---

**Bom teste! 🎉**

Data: Janeiro 3, 2026
