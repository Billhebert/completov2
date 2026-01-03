# 🧪 PLANO DE VALIDAÇÃO COMPLETO - Completo V2

**Data Início**: Janeiro 3, 2026  
**Objetivo**: Validar todas as 200+ rotas e funcionalidades  
**Tempo Estimado**: 2-3 horas

---

## 📋 Estrutura de Validação

### Fase 1: Módulos Principais (7) - 45 minutos
### Fase 2: Módulos Críticos (5) - 45 minutos  
### Fase 3: Integração (4 fluxos) - 30 minutos
### Fase 4: Funcionalidades Especiais (8) - 45 minutos

---

## ✅ FASE 1: MÓDULOS PRINCIPAIS (7 Módulos)

### 1️⃣ MODULE: AUTH
**Arquivo**: `backend/src/modules/auth/teste.http`  
**Tempo**: 10 minutos

#### Testes Obrigatórios
- [ ] **POST /auth/register**
  ```
  Status esperado: 200/201
  Validar: User criado, token retornado
  ```
  
- [ ] **POST /auth/login**
  ```
  Status esperado: 200
  Validar: Token JWT retornado
  Guardar: Token para próximos testes
  ```
  
- [ ] **POST /auth/refresh**
  ```
  Status esperado: 200
  Validar: Novo token gerado
  ```
  
- [ ] **GET /auth/verify**
  ```
  Status esperado: 200
  Validar: Token é válido
  ```
  
- [ ] **POST /auth/logout**
  ```
  Status esperado: 200
  Validar: Session encerrada
  ```

#### ⚠️ Testes de Erro
- [ ] Login com email inválido → 401
- [ ] Login com senha errada → 401
- [ ] Token expirado → 401
- [ ] Sem token → 401

**Status**: ⏳ _Aguardando teste_

---

### 2️⃣ MODULE: SIMULATION
**Arquivo**: `backend/src/modules/simulation/teste.http`  
**README**: `backend/src/modules/simulation/README.md`  
**Tempo**: 8 minutos

#### Testes Obrigatórios
- [ ] **GET /simulation/scenarios**
  ```
  Status esperado: 200
  Validar: Array de cenários retornado
  ```
  
- [ ] **POST /simulation/scenarios**
  ```
  Status esperado: 201
  Validar: Cenário criado com ID
  Guardar: ID para próximos testes
  Payload:
  {
    "title": "Sales Training",
    "description": "Learn sales techniques",
    "personas": ["AI Assistant"]
  }
  ```
  
- [ ] **POST /simulation/session/start**
  ```
  Status esperado: 200
  Validar: Session iniciada com ID
  Guardar: Session ID
  Payload:
  {
    "scenarioId": "[guardado acima]"
  }
  ```
  
- [ ] **POST /simulation/session/end**
  ```
  Status esperado: 200
  Validar: Session finalizada, resultado retornado
  Payload:
  {
    "sessionId": "[guardado acima]"
  }
  ```

**Status**: ⏳ _Aguardando teste_

---

### 3️⃣ MODULE: SYNC
**Arquivo**: `backend/src/modules/sync/teste.http`  
**README**: `backend/src/modules/sync/README.md`  
**Tempo**: 10 minutos

#### Testes Obrigatórios
- [ ] **GET /sync/connections**
  ```
  Status esperado: 200
  Validar: Lista de conexões
  ```
  
- [ ] **POST /sync/connections**
  ```
  Status esperado: 201
  Validar: Conexão criada
  Guardar: Connection ID
  Payload:
  {
    "type": "rdstation",
    "name": "RDStation Integration",
    "apiKey": "test_key_123"
  }
  ```
  
- [ ] **GET /sync/runs**
  ```
  Status esperado: 200
  Validar: Lista de sincronizações
  ```
  
- [ ] **POST /sync/run**
  ```
  Status esperado: 200
  Validar: Sincronização iniciada
  Payload:
  {
    "connectionId": "[guardado acima]"
  }
  ```
  
- [ ] **DELETE /sync/connections/:id**
  ```
  Status esperado: 204
  Validar: Conexão removida
  ```

**Status**: ⏳ _Aguardando teste_

---

### 4️⃣ MODULE: CMMS
**Arquivo**: `backend/src/modules/cmms/teste.http`  
**README**: `backend/src/modules/cmms/README.md`  
**Tempo**: 12 minutos

#### Testes Obrigatórios - Assets
- [ ] **GET /cmms/assets**
  ```
  Status esperado: 200
  Validar: Lista de ativos
  ```
  
- [ ] **POST /cmms/assets**
  ```
  Status esperado: 201
  Payload:
  {
    "name": "Motor Bomba A1",
    "category": "equipment",
    "location": "Warehouse A"
  }
  Guardar: Asset ID
  ```
  
- [ ] **GET /cmms/assets/:id**
  ```
  Status esperado: 200
  Validar: Detalhes do ativo
  ```
  
- [ ] **PUT /cmms/assets/:id**
  ```
  Status esperado: 200
  Payload:
  {
    "status": "active"
  }
  ```

#### Testes Obrigatórios - Maintenance
- [ ] **POST /cmms/maintenance**
  ```
  Status esperado: 201
  Payload:
  {
    "assetId": "[asset ID guardado]",
    "type": "preventive",
    "scheduledDate": "2026-01-15"
  }
  ```
  
- [ ] **GET /cmms/maintenance**
  ```
  Status esperado: 200
  ```

#### Testes Obrigatórios - Downtime
- [ ] **POST /cmms/downtime**
  ```
  Status esperado: 201
  Payload:
  {
    "assetId": "[asset ID]",
    "startTime": "2026-01-03T10:00:00Z",
    "endTime": "2026-01-03T11:30:00Z",
    "reason": "Motor failure"
  }
  ```

#### Testes Obrigatórios - Spare Parts
- [ ] **POST /cmms/spare-parts**
  ```
  Status esperado: 201
  Payload:
  {
    "name": "Bearing XYZ",
    "quantity": 5,
    "cost": 150.00
  }
  ```

**Status**: ⏳ _Aguardando teste_

---

### 5️⃣ MODULE: FSM
**Arquivo**: `backend/src/modules/fsm/teste.http`  
**README**: `backend/src/modules/fsm/README.md`  
**Tempo**: 12 minutos

#### Testes Obrigatórios - Technicians
- [ ] **POST /fsm/technicians**
  ```
  Status esperado: 201
  Payload:
  {
    "name": "João Silva",
    "email": "joao@company.com",
    "phone": "11999999999"
  }
  Guardar: Technician ID
  ```
  
- [ ] **GET /fsm/technicians**
  ```
  Status esperado: 200
  ```

#### Testes Obrigatórios - Work Orders
- [ ] **POST /fsm/work-orders**
  ```
  Status esperado: 201
  Payload:
  {
    "title": "Repair Motor A1",
    "description": "Fix motor failure",
    "technician": "[tech ID]",
    "priority": "high"
  }
  Guardar: Work Order ID
  ```
  
- [ ] **GET /fsm/work-orders**
  ```
  Status esperado: 200
  ```
  
- [ ] **POST /fsm/work-orders/:id/start**
  ```
  Status esperado: 200
  Validar: Status = "in_progress"
  ```
  
- [ ] **POST /fsm/work-orders/:id/complete**
  ```
  Status esperado: 200
  Validar: Status = "completed"
  Payload:
  {
    "notes": "Motor repaired successfully"
  }
  ```

#### Testes Obrigatórios - Tasks
- [ ] **POST /fsm/tasks**
  ```
  Status esperado: 201
  Payload:
  {
    "workOrderId": "[WO ID]",
    "description": "Check bearings",
    "order": 1
  }
  ```

**Status**: ⏳ _Aguardando teste_

---

### 6️⃣ MODULE: LEARNING
**Arquivo**: `backend/src/modules/learning/teste.http`  
**README**: `backend/src/modules/learning/README.md`  
**Tempo**: 10 minutos

#### Testes Obrigatórios - Paths
- [ ] **POST /learning/paths**
  ```
  Status esperado: 201
  Payload:
  {
    "title": "Advanced Sales",
    "description": "Master sales techniques",
    "level": "advanced"
  }
  Guardar: Path ID
  ```
  
- [ ] **GET /learning/paths**
  ```
  Status esperado: 200
  ```

#### Testes Obrigatórios - Enrollments
- [ ] **POST /learning/enrollments**
  ```
  Status esperado: 201
  Payload:
  {
    "pathId": "[path ID]",
    "userId": "[user ID]"
  }
  Guardar: Enrollment ID
  ```
  
- [ ] **GET /learning/enrollments**
  ```
  Status esperado: 200
  ```

#### Testes Obrigatórios - Skills
- [ ] **POST /learning/skills**
  ```
  Status esperado: 201
  Payload:
  {
    "name": "Negotiation",
    "category": "sales",
    "level": "intermediate"
  }
  ```

#### Testes Obrigatórios - Progress
- [ ] **GET /learning/progress/:enrollmentId**
  ```
  Status esperado: 200
  Validar: Progresso retornado
  ```

**Status**: ⏳ _Aguardando teste_

---

### 7️⃣ MODULE: NARRATIVE
**Arquivo**: `backend/src/modules/narrative/teste.http`  
**README**: `backend/src/modules/narrative/README.md`  
**Tempo**: 5 minutos

#### Testes Obrigatórios
- [ ] **POST /narrative/generate**
  ```
  Status esperado: 200
  Payload:
  {
    "zettelIds": ["zettel1", "zettel2"],
    "style": "professional",
    "language": "pt-BR"
  }
  Validar: Narrativa gerada (string)
  ```

**Status**: ⏳ _Aguardando teste_

---

## ✅ FASE 2: MÓDULOS CRÍTICOS SECUNDÁRIOS (5 Módulos)

### 8️⃣ MODULE: CRM
**Arquivo**: `backend/src/modules/crm/teste.http`  
**Tempo**: 12 minutos

#### Testes Obrigatórios
- [ ] **POST /crm/contacts**
  ```
  Status esperado: 201
  Payload:
  {
    "name": "Maria Santos",
    "email": "maria@company.com",
    "phone": "11988888888",
    "company": "Tech Solutions"
  }
  Guardar: Contact ID
  ```
  
- [ ] **GET /crm/contacts**
  ```
  Status esperado: 200
  ```
  
- [ ] **GET /crm/contacts/:id**
  ```
  Status esperado: 200
  ```
  
- [ ] **PUT /crm/contacts/:id**
  ```
  Status esperado: 200
  Payload:
  {
    "status": "active"
  }
  ```

- [ ] **POST /crm/deals**
  ```
  Status esperado: 201
  Payload:
  {
    "title": "Enterprise Contract",
    "value": 50000,
    "stage": "proposal",
    "contactId": "[contact ID]"
  }
  Guardar: Deal ID
  ```
  
- [ ] **PUT /crm/deals/:id/stage**
  ```
  Status esperado: 200
  Payload:
  {
    "stage": "negotiation"
  }
  ```
  
- [ ] **DELETE /crm/contacts/:id**
  ```
  Status esperado: 204
  ```

**Status**: ⏳ _Aguardando teste_

---

### 9️⃣ MODULE: ANALYTICS
**Arquivo**: `backend/src/modules/analytics/teste.http`  
**Tempo**: 8 minutos

#### Testes Obrigatórios
- [ ] **GET /analytics/dashboard**
  ```
  Status esperado: 200
  Validar: Dados do dashboard
  ```
  
- [ ] **GET /analytics/timeseries**
  ```
  Status esperado: 200
  Validar: Dados de série temporal
  ```
  
- [ ] **GET /analytics/pipeline**
  ```
  Status esperado: 200
  Validar: Status do pipeline
  ```
  
- [ ] **GET /analytics/activity**
  ```
  Status esperado: 200
  Validar: Atividades recentes
  ```
  
- [ ] **POST /analytics/export**
  ```
  Status esperado: 200
  Payload:
  {
    "format": "csv",
    "dateRange": "last_30_days"
  }
  ```

**Status**: ⏳ _Aguardando teste_

---

### 🔟 MODULE: NOTIFICATIONS
**Arquivo**: `backend/src/modules/notifications/teste.http`  
**Tempo**: 5 minutos

#### Testes Obrigatórios
- [ ] **GET /notifications**
  ```
  Status esperado: 200
  ```
  
- [ ] **GET /notifications/summary**
  ```
  Status esperado: 200
  ```
  
- [ ] **PUT /notifications/:id/read**
  ```
  Status esperado: 200
  ```
  
- [ ] **DELETE /notifications/:id**
  ```
  Status esperado: 204
  ```

**Status**: ⏳ _Aguardando teste_

---

### 1️⃣1️⃣ MODULE: JOBS
**Arquivo**: `backend/src/modules/jobs/teste.http`  
**Tempo**: 10 minutos

#### Testes Obrigatórios
- [ ] **POST /jobs/postings**
  ```
  Status esperado: 201
  Payload:
  {
    "title": "Senior Developer",
    "description": "Develop amazing features",
    "department": "Engineering"
  }
  Guardar: Posting ID
  ```
  
- [ ] **GET /jobs/postings**
  ```
  Status esperado: 200
  ```
  
- [ ] **POST /jobs/applications**
  ```
  Status esperado: 201
  Payload:
  {
    "postingId": "[posting ID]",
    "candidateName": "João Developer",
    "candidateEmail": "joao@dev.com"
  }
  ```
  
- [ ] **GET /jobs/applications**
  ```
  Status esperado: 200
  ```

**Status**: ⏳ _Aguardando teste_

---

### 1️⃣2️⃣ MODULE: AUTOMATIONS
**Arquivo**: `backend/src/modules/automations/teste.http`  
**Tempo**: 10 minutos

#### Testes Obrigatórios
- [ ] **POST /automations/workflows**
  ```
  Status esperado: 201
  Payload:
  {
    "name": "New Contact Flow",
    "trigger": "contact_created",
    "actions": ["send_email", "create_task"]
  }
  Guardar: Workflow ID
  ```
  
- [ ] **GET /automations/workflows**
  ```
  Status esperado: 200
  ```
  
- [ ] **GET /automations/executions**
  ```
  Status esperado: 200
  ```
  
- [ ] **DELETE /automations/workflows/:id**
  ```
  Status esperado: 204
  ```

**Status**: ⏳ _Aguardando teste_

---

## ✅ FASE 3: TESTES DE INTEGRAÇÃO (4 Fluxos)

### Fluxo 1: Autenticação → CRM
**Tempo**: 10 minutos

```
1. POST /auth/login
   ├─ Obter token
   
2. POST /crm/contacts
   ├─ Usar token acima
   ├─ Validar status 201
   
3. GET /crm/contacts
   ├─ Usar token
   ├─ Verificar contato criado
```

**Status**: ⏳ _Aguardando teste_

---

### Fluxo 2: CRM → Sync → Analytics
**Tempo**: 12 minutos

```
1. POST /crm/contacts (criar)
2. POST /sync/run (sincronizar)
3. GET /analytics/dashboard (verificar dados)
4. GET /analytics/pipeline (pipeline atualizado)
```

**Status**: ⏳ _Aguardando teste_

---

### Fluxo 3: CMMS → FSM (Manutenção)
**Tempo**: 10 minutos

```
1. POST /cmms/assets (criar ativo)
2. POST /cmms/maintenance (agendar manutenção)
3. POST /fsm/work-orders (criar ordem)
4. POST /fsm/work-orders/:id/start (iniciar)
5. POST /fsm/work-orders/:id/complete (completar)
```

**Status**: ⏳ _Aguardando teste_

---

### Fluxo 4: Learning → Skills → Progress
**Tempo**: 10 minutos

```
1. POST /learning/paths (criar caminho)
2. POST /learning/skills (adicionar skill)
3. POST /learning/enrollments (enrollar user)
4. GET /learning/progress/:id (verificar progresso)
```

**Status**: ⏳ _Aguardando teste_

---

## ✅ FASE 4: FUNCIONALIDADES ESPECIAIS (8 Módulos)

### AI (IA Services)
**Arquivo**: `backend/src/modules/ai/teste.http`

- [ ] POST /ai/chat - Chat com IA
- [ ] POST /ai/rag - Retrieval Augmented Generation
- [ ] POST /ai/transcribe - Transcrição
- [ ] POST /ai/summarize - Resumir texto
- [ ] POST /ai/generate - Gerar conteúdo

**Status**: ⏳ _Aguardando teste_

---

### Omnichannel
**Arquivo**: `backend/src/modules/omnichannel/teste.http`

- [ ] GET /omnichannel/conversations
- [ ] POST /omnichannel/whatsapp
- [ ] GET /omnichannel/channels
- [ ] POST /omnichannel/integrations

**Status**: ⏳ _Aguardando teste_

---

### Webhooks
**Arquivo**: `backend/src/modules/webhooks/teste.http`

- [ ] POST /webhooks (criar)
- [ ] GET /webhooks (listar)
- [ ] POST /webhooks/:id/test (testar)
- [ ] DELETE /webhooks/:id (remover)

**Status**: ⏳ _Aguardando teste_

---

### Deduplication
**Arquivo**: `backend/src/modules/deduplication/teste.http`

- [ ] POST /dedup/analysis
- [ ] POST /dedup/merge
- [ ] GET /dedup/status

**Status**: ⏳ _Aguardando teste_

---

### Search
**Arquivo**: `backend/src/modules/search/teste.http`

- [ ] GET /search
- [ ] POST /search/advanced
- [ ] GET /search/filters

**Status**: ⏳ _Aguardando teste_

---

### Chat
**Arquivo**: `backend/src/modules/chat/teste.http`

- [ ] POST /chat/messages
- [ ] GET /chat/messages
- [ ] POST /chat/channels

**Status**: ⏳ _Aguardando teste_

---

### Files
**Arquivo**: `backend/src/modules/files/teste.http`

- [ ] POST /files/upload
- [ ] GET /files/:id/download
- [ ] DELETE /files/:id

**Status**: ⏳ _Aguardando teste_

---

### Settings
**Arquivo**: `backend/src/modules/settings/teste.http`

- [ ] GET /settings
- [ ] PUT /settings

**Status**: ⏳ _Aguardando teste_

---

## 📊 RESUMO DE TESTES

```
Total de Endpoints a Testar:        200+
Total de Casos de Teste:            250+
Tempo Estimado:                     2-3 horas

Fase 1 (7 módulos):                45 minutos
Fase 2 (5 módulos):                45 minutos
Fase 3 (4 fluxos):                 42 minutos
Fase 4 (8 funcionalidades):        45 minutos
Análise de Resultados:             15 minutos
────────────────────────────────────────
TOTAL:                           ~3.5 horas
```

---

## 📋 CHECKLIST DE VALIDAÇÃO

### Validação de Resposta (Cada Teste)
- [ ] Status HTTP correto (200, 201, 204, etc)
- [ ] Response body válido (JSON bem formado)
- [ ] Campos retornados conforme esperado
- [ ] IDs gerados corretamente
- [ ] Timestamps corretos
- [ ] Paginação funciona (se aplicável)

### Validação de Erro
- [ ] 400: Bad Request (payload inválido)
- [ ] 401: Unauthorized (sem token)
- [ ] 403: Forbidden (sem permissão)
- [ ] 404: Not Found (recurso não existe)
- [ ] 500: Server Error (erro interno)

### Validação de Segurança
- [ ] [ ] Token JWT validado
- [ ] [ ] CORS funcionando
- [ ] [ ] Rate limiting testado
- [ ] [ ] XSS prevenido
- [ ] [ ] SQL Injection prevenido

---

## 📝 TEMPLATE DE RESULTADO

Para cada teste, preencha:

```
### [MODULO]/[ROTA]
- Status: ✅ PASSOU / ❌ FALHOU
- Status Code: 200
- Tempo Resposta: 150ms
- Observações: Funcionando corretamente
```

---

## 🎯 Critério de Sucesso

✅ **SUCESSO**: 95%+ dos testes passando  
⚠️ **AVISO**: 80-95% dos testes passando  
❌ **FALHA**: < 80% dos testes passando  

---

## 📌 Notas Importantes

1. **Use variáveis**: Guarde IDs para reutilizar em testes subsequentes
2. **Ordem importa**: Faça CREATE antes de UPDATE/DELETE
3. **Token**: Obtenha token no AUTH, use em todos os outros
4. **Documente**: Anote qualquer erro ou comportamento inesperado
5. **Reporte**: Crie issue para cada bug encontrado

---

## 🚀 Comece Agora!

**Próxima ação**: Abra `backend/src/modules/auth/teste.http` e comece com a Fase 1

**Tempo para começar**: 5 minutos até seu primeiro teste! ✨

---

*Plano de Validação Criado: Janeiro 3, 2026*  
*Status: Pronto para executar*
