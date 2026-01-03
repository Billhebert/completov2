# 🧪 GUIA PRÁTICO - EXECUTAR TESTES AGORA

**Data**: Janeiro 3, 2026  
**Tempo Estimado**: 2-3 horas  
**Objetivo**: Validar todas as funcionalidades

---

## 📋 PRÉ-REQUISITOS

### ✅ Verificar Antes de Começar

- [ ] VS Code instalado
- [ ] Extensão REST Client instalada
- [ ] Backend rodando (port 3000)
- [ ] Banco de dados conectado
- [ ] Arquivo `TESTING_RESULTS.md` aberto

---

## 🚀 COMEÇAR AGORA - 3 PASSOS

### Passo 1: Abrir Primeiro Arquivo (30 segundos)

```
VS Code → Abra este arquivo:
backend/src/modules/auth/teste.http
```

### Passo 2: Executar Primeiro Teste (30 segundos)

```
Encontre essa seção:

### Register User
POST http://localhost:3000/api/v1/auth/register

Clique em "Send Request" que aparece acima da linha
```

### Passo 3: Ver Resposta (30 segundos)

```
Painel lateral mostra a resposta
Se status = 200/201 → ✅ SUCESSO
Se status = error → ❌ FALHA
```

---

## 📊 FASE 1: EXECUTAR (45 MINUTOS)

### Módulo 1: AUTH

**Arquivo**: `backend/src/modules/auth/teste.http`

```
⏱️ Tempo: 10 minutos

1. Encontre: "### Register User"
   Clique: "Send Request"
   Status Esperado: 201
   ✅ Resultado: __________

2. Encontre: "### Login"
   Clique: "Send Request"
   Status Esperado: 200
   ✅ Guardar o TOKEN retornado!
   Token: __________

3. Encontre: "### Verify Token"
   Coloque seu token em:
   Authorization: Bearer [seu_token_aqui]
   Clique: "Send Request"
   Status Esperado: 200
   ✅ Resultado: __________

4. Encontre: "### Refresh Token"
   Colique: "Send Request"
   Status Esperado: 200
   ✅ Resultado: __________

5. Encontre: "### Logout"
   Clique: "Send Request"
   Status Esperado: 200
   ✅ Resultado: __________
```

**Preencher TESTING_RESULTS.md:**
```
### 1. AUTH - Autenticação
Status: ✅ PASSOU
├─ [x] POST /auth/register - 201 - 150ms
├─ [x] POST /auth/login - 200 - 200ms
├─ [x] GET /auth/verify - 200 - 100ms
├─ [x] POST /auth/refresh - 200 - 150ms
└─ [x] POST /auth/logout - 200 - 100ms

Tempo Total: 10 minutos
Observações: Todos funcionando ✅
```

---

### Módulo 2: SIMULATION

**Arquivo**: `backend/src/modules/simulation/teste.http`  
**README**: `backend/src/modules/simulation/README.md` (para entender)

```
⏱️ Tempo: 8 minutos

1. Encontre: "### List Scenarios"
   Clique: "Send Request"
   Status: 200
   ✅ Resultado: __________

2. Encontre: "### Create Scenario"
   Clique: "Send Request"
   Status: 201
   ✅ Guardar Scenario ID: __________

3. Encontre: "### Start Session"
   Coloque seu Scenario ID
   Clique: "Send Request"
   Status: 200
   ✅ Guardar Session ID: __________

4. Encontre: "### End Session"
   Coloque seu Session ID
   Clique: "Send Request"
   Status: 200
   ✅ Resultado: __________
```

---

### Módulo 3: SYNC

**Arquivo**: `backend/src/modules/sync/teste.http`  
**README**: `backend/src/modules/sync/README.md`

```
⏱️ Tempo: 10 minutos

1. Encontre: "### List Connections"
   Clique: "Send Request"
   Status: 200
   ✅ Resultado: __________

2. Encontre: "### Create Connection"
   Clique: "Send Request"
   Status: 201
   ✅ Guardar Connection ID: __________

3. Encontre: "### List Sync Runs"
   Clique: "Send Request"
   Status: 200
   ✅ Resultado: __________

4. Encontre: "### Start Sync"
   Coloque seu Connection ID
   Clique: "Send Request"
   Status: 200
   ✅ Resultado: __________

5. Encontre: "### Delete Connection"
   Coloque seu Connection ID
   Clique: "Send Request"
   Status: 204
   ✅ Resultado: __________
```

---

### Módulo 4: CMMS

**Arquivo**: `backend/src/modules/cmms/teste.http`  
**README**: `backend/src/modules/cmms/README.md`

```
⏱️ Tempo: 12 minutos

ASSETS:
1. "### Create Asset" → 201 → Guardar ID: __________
2. "### List Assets" → 200 → ✅
3. "### Get Asset" → 200 → ✅
4. "### Update Asset" → 200 → ✅

MAINTENANCE:
5. "### Create Maintenance" → 201 → ✅
6. "### List Maintenance" → 200 → ✅

DOWNTIME:
7. "### Create Downtime" → 201 → ✅
8. "### List Downtime" → 200 → ✅

SPARE PARTS:
9. "### Create Spare Part" → 201 → ✅
10. "### List Spare Parts" → 200 → ✅
```

---

### Módulo 5: FSM

**Arquivo**: `backend/src/modules/fsm/teste.http`  
**README**: `backend/src/modules/fsm/README.md`

```
⏱️ Tempo: 12 minutos

TECHNICIANS:
1. "### Create Technician" → 201 → Guardar ID: __________
2. "### List Technicians" → 200 → ✅

WORK ORDERS:
3. "### Create Work Order" → 201 → Guardar ID: __________
4. "### List Work Orders" → 200 → ✅
5. "### Start Work Order" → 200 → ✅
6. "### Complete Work Order" → 200 → ✅

TASKS:
7. "### Create Task" → 201 → ✅
8. "### List Tasks" → 200 → ✅

TIME TRACKING:
9. "### Log Time" → 201 → ✅
10. "### List Time Logs" → 200 → ✅
```

---

### Módulo 6: LEARNING

**Arquivo**: `backend/src/modules/learning/teste.http`  
**README**: `backend/src/modules/learning/README.md`

```
⏱️ Tempo: 10 minutos

PATHS:
1. "### Create Path" → 201 → Guardar ID: __________
2. "### List Paths" → 200 → ✅

ENROLLMENTS:
3. "### Create Enrollment" → 201 → Guardar ID: __________
4. "### List Enrollments" → 200 → ✅

SKILLS:
5. "### Create Skill" → 201 → ✅
6. "### List Skills" → 200 → ✅

PROGRESS:
7. "### Get Progress" → 200 → ✅
8. "### Update Progress" → 200 → ✅
```

---

### Módulo 7: NARRATIVE

**Arquivo**: `backend/src/modules/narrative/teste.http`  
**README**: `backend/src/modules/narrative/README.md`

```
⏱️ Tempo: 5 minutos

1. "### Generate Narrative"
   Clique: "Send Request"
   Status: 200
   ✅ Validar: Texto gerado
```

---

## 📋 FASE 2: VALIDAR (45 MINUTOS)

### Módulo 8: CRM

**Arquivo**: `backend/src/modules/crm/teste.http`

```
⏱️ Tempo: 12 minutos

CONTACTS:
1. "### Create Contact" → 201 → Guardar ID: __________
2. "### List Contacts" → 200 → ✅
3. "### Get Contact" → 200 → ✅
4. "### Update Contact" → 200 → ✅

DEALS:
5. "### Create Deal" → 201 → ✅
6. "### List Deals" → 200 → ✅
7. "### Update Deal Stage" → 200 → ✅

CLEANUP:
8. "### Delete Contact" → 204 → ✅
```

---

### Módulo 9: ANALYTICS

**Arquivo**: `backend/src/modules/analytics/teste.http`

```
⏱️ Tempo: 8 minutos

1. "### Get Dashboard" → 200 → ✅
2. "### Get Timeseries" → 200 → ✅
3. "### Get Pipeline" → 200 → ✅
4. "### Get Activity" → 200 → ✅
5. "### Export Data" → 200 → ✅
```

---

### Módulo 10: NOTIFICATIONS

**Arquivo**: `backend/src/modules/notifications/teste.http`

```
⏱️ Tempo: 5 minutos

1. "### List Notifications" → 200 → ✅
2. "### Get Summary" → 200 → ✅
3. "### Mark as Read" → 200 → ✅
4. "### Delete Notification" → 204 → ✅
```

---

### Módulo 11: JOBS

**Arquivo**: `backend/src/modules/jobs/teste.http`

```
⏱️ Tempo: 10 minutos

POSTINGS:
1. "### Create Posting" → 201 → Guardar ID: __________
2. "### List Postings" → 200 → ✅

APPLICATIONS:
3. "### Create Application" → 201 → ✅
4. "### List Applications" → 200 → ✅
```

---

### Módulo 12: AUTOMATIONS

**Arquivo**: `backend/src/modules/automations/teste.http`

```
⏱️ Tempo: 10 minutos

1. "### Create Workflow" → 201 → Guardar ID: __________
2. "### List Workflows" → 200 → ✅
3. "### Get Executions" → 200 → ✅
4. "### Delete Workflow" → 204 → ✅
```

---

## 🔗 FASE 3: INTEGRAÇÃO (42 MINUTOS)

### Fluxo 1: Auth → CRM (10 min)

```
1. Abra: backend/src/modules/auth/teste.http
   └─ Copie seu TOKEN

2. Abra: backend/src/modules/crm/teste.http
   └─ Cole TOKEN em: Authorization: Bearer [token]
   └─ Execute: "### Create Contact"
   └─ Status esperado: 201 ✅

3. Execute: "### List Contacts"
   └─ Verifique: Seu contato está lá ✅
```

**Resultado**: ✅ __________

---

### Fluxo 2: CRM → Sync → Analytics (12 min)

```
1. Execute: "### Create Contact" (CRM)
   └─ Guardar Contact ID

2. Abra: backend/src/modules/sync/teste.http
   └─ Execute: "### Start Sync"
   └─ Status esperado: 200 ✅

3. Abra: backend/src/modules/analytics/teste.http
   └─ Execute: "### Get Dashboard"
   └─ Verifique: Dados foram atualizados ✅
```

**Resultado**: ✅ __________

---

### Fluxo 3: CMMS → FSM (10 min)

```
1. Abra: backend/src/modules/cmms/teste.http
   └─ Execute: "### Create Asset"
   └─ Guardar Asset ID

2. Execute: "### Create Maintenance"
   └─ Status esperado: 201 ✅

3. Abra: backend/src/modules/fsm/teste.http
   └─ Execute: "### Create Technician"
   └─ Guardar Tech ID

4. Execute: "### Create Work Order"
   └─ Coloque Asset ID e Tech ID
   └─ Status esperado: 201 ✅

5. Execute: "### Start Work Order"
   └─ Status esperado: 200 ✅

6. Execute: "### Complete Work Order"
   └─ Status esperado: 200 ✅
```

**Resultado**: ✅ __________

---

### Fluxo 4: Learning (10 min)

```
1. Abra: backend/src/modules/learning/teste.http

2. Execute: "### Create Path"
   └─ Guardar Path ID

3. Execute: "### Create Skill"
   └─ Guardar Skill ID

4. Execute: "### Create Enrollment"
   └─ Coloque Path ID
   └─ Status esperado: 201 ✅

5. Execute: "### Get Progress"
   └─ Verifique: Progresso 0% ✅
```

**Resultado**: ✅ __________

---

## ✨ FASE 4: ESPECIAIS (45 MINUTOS)

### Módulos a Testar

```
Teste cada um com a mesma abordagem:
1. Arquivo de teste (.http)
2. Execute cada rota
3. Valide status codes
4. Verifique resposta

Módulos:
- AI (5 rotas)
- Omnichannel (4 rotas)
- Webhooks (4 rotas)
- Deduplication (3 rotas)
- Search (3 rotas)
- Chat (3 rotas)
- Files (3 rotas)
- Settings (2 rotas)
```

---

## 📝 REGISTRO DE RESULTADOS

### Template para Preencher

```
Módulo: [NOME]
Arquivo: [PATH]
Tempo: [minutos]
Data: [data]

Testes:
✅ Rota 1 - Status 200 - Tempo 150ms
✅ Rota 2 - Status 201 - Tempo 200ms
❌ Rota 3 - Status 500 - ERRO!

Total: 2/3 ✅
Observações: Rota 3 apresentou erro de conexão

Próximo: [próximo módulo]
```

---

## 🐛 ENCONTROU BUG?

Se algum teste falhar:

```
1. Anote o módulo e rota
2. Anote o status code retornado
3. Anote a resposta de erro
4. Marque em TESTING_RESULTS.md
5. Continue testando os outros
6. Crie issue no GitHub depois
```

**Exemplo**:
```
Bug: CMMS Asset Creation falha
Rota: POST /cmms/assets
Status: 500
Erro: Internal Server Error
Payload: {"name": "Bomba A1", "category": "equipment"}
Resposta: {"message": "Database connection failed"}
```

---

## ✅ CHECKLIST FINAL

Quando terminar, verifique:

- [ ] Fase 1 completa (7 módulos)
- [ ] Fase 2 completa (5 módulos)
- [ ] Fase 3 completa (4 fluxos)
- [ ] Fase 4 completa (8 funcionalidades)
- [ ] Resultados documentados em TESTING_RESULTS.md
- [ ] Bugs documentados (se houver)
- [ ] Taxa de sucesso > 95%

---

## 📊 TEMPO ESTIMADO

```
Fase 1: 45 minutos
Fase 2: 45 minutos
Fase 3: 42 minutos
Fase 4: 45 minutos
Análise: 15 minutos
────────────────
TOTAL: ~3 horas
```

---

## 🎯 Próximo Passo

**COMECE AGORA:**

1. Abra: `backend/src/modules/auth/teste.http`
2. Clique em: "Send Request"
3. Anote o resultado
4. Continue com o próximo módulo

---

**Status**: Pronto para executar ✅  
**Tempo para começar**: 2 minutos  
**Tempo para completar**: 3 horas

---

*Boa sorte! 🚀*
