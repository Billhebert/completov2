# 📋 Lista Completa de Funcionalidades e Comportamentos - Completov2

> **Documentação abrangente de TODAS as funcionalidades e comportamentos do sistema**

---

## 📑 Índice

1. [Autenticação e Segurança](#autenticação-e-segurança)
2. [CRM - Gestão de Relacionamento](#crm---gestão-de-relacionamento)
3. [Chat e Mensageria](#chat-e-mensageria)
4. [Sistema de Knowledge (Zettel)](#sistema-de-knowledge-zettel)
5. [Sistema de IA (3 Modos)](#sistema-de-ia-3-modos)
6. [Automações e Workflows](#automações-e-workflows)
7. [Omnichannel](#omnichannel)
8. [Notificações](#notificações)
9. [Analytics e Relatórios](#analytics-e-relatórios)
10. [RBAC e Permissões](#rbac-e-permissões)
11. [Webhooks e Integrações](#webhooks-e-integrações)
12. [Arquivos e Upload](#arquivos-e-upload)
13. [Busca Global](#busca-global)
14. [Audit e Logs](#audit-e-logs)
15. [API Keys](#api-keys)
16. [Eventos do Sistema](#eventos-do-sistema)
17. [Comportamentos Automáticos](#comportamentos-automáticos)
18. [Regras de Negócio](#regras-de-negócio)

---

## 🔐 Autenticação e Segurança

### Funcionalidades

#### 1. **Registro de Usuário e Empresa**
- ✅ Cadastro de nova empresa (multi-tenant)
- ✅ Criação automática do primeiro usuário como admin
- ✅ Validação de email único
- ✅ Validação de domínio da empresa único
- ✅ Senha com mínimo de 8 caracteres
- ✅ Hash de senha com bcrypt

#### 2. **Login**
- ✅ Login com email e senha
- ✅ Login com 2FA (se ativado)
- ✅ Geração de access token (JWT, curta duração)
- ✅ Geração de refresh token (JWT, longa duração)
- ✅ Retorno de dados do usuário

#### 3. **Autenticação de Dois Fatores (2FA)**
- ✅ Setup de 2FA com QR code
- ✅ Uso de Google Authenticator / Authy
- ✅ Geração de secret único
- ✅ Geração de 10 códigos de backup
- ✅ Verificação de token de 6 dígitos
- ✅ Desativação de 2FA (requer senha + token)
- ✅ 2FA obrigatório durante login

#### 4. **Refresh de Token**
- ✅ Renovação de access token usando refresh token
- ✅ Rotação de refresh token
- ✅ Invalidação automática de tokens expirados
- ✅ Auto-refresh no frontend (interceptor Axios)

#### 5. **Gestão de Sessão**
- ✅ Logout com invalidação de tokens
- ✅ Verificação de usuário autenticado (GET /auth/me)
- ✅ Sessões persistentes com refresh token

#### 6. **Recuperação de Senha**
- ✅ Solicitação de reset via email
- ✅ Token de recuperação com expiração
- ✅ Reset de senha com token válido

### Comportamentos

- 🔄 **Auto-refresh:** Token renovado automaticamente antes de expirar
- 🚫 **Bloqueio de acesso:** Redirecionamento para login se token inválido
- 🔒 **Isolamento multi-tenant:** Cada empresa tem acesso apenas aos seus dados
- ⏰ **Expiração de tokens:** Access token expira em 15 minutos, refresh em 7 dias
- 🔐 **2FA obrigatório:** Se ativado, login requer código de verificação

---

## 🏢 CRM - Gestão de Relacionamento

### Funcionalidades

#### 1. **Gestão de Contatos**
- ✅ Criar contato com dados básicos (nome, email, telefone, empresa)
- ✅ Editar contato
- ✅ Excluir contato (soft delete)
- ✅ Listar contatos com paginação
- ✅ Filtrar por tag, status de lead, dono
- ✅ Buscar por nome, email, empresa
- ✅ Atribuir tags aos contatos
- ✅ Definir dono do contato (owner)
- ✅ Visualizar histórico de interações do contato
- ✅ Visualizar deals relacionados ao contato

#### 2. **Gestão de Deals (Negócios)**
- ✅ Criar deal com valor, moeda, estágio, data de fechamento esperada
- ✅ Vincular deal a um contato
- ✅ Atualizar estágio do deal (lead → qualified → proposal → negotiation → won/lost)
- ✅ Adicionar produtos/serviços ao deal
- ✅ Definir dono do deal
- ✅ Listar deals por estágio
- ✅ Filtrar deals por dono, estágio
- ✅ Excluir deal (soft delete)
- ✅ Visualizar histórico de mudanças de estágio

#### 3. **Gestão de Interações**
- ✅ Registrar interação (call, email, meeting, note)
- ✅ Vincular interação a contato ou deal
- ✅ Definir direção (inbound/outbound)
- ✅ Agendar interação futura
- ✅ Adicionar assunto e conteúdo
- ✅ Listar interações por contato ou deal
- ✅ Filtrar interações por tipo

#### 4. **Analytics de CRM com IA**
- ✅ **Probabilidade de Fechamento (Deal Probability)**
  - Análise de idade do deal
  - Contagem de interações
  - Dias desde última interação
  - Score de probabilidade (0-100%)
  - Nível de confiança (high/medium/low)
  - Nível de risco (high/medium/low)
  - Sugestões de ações

- ✅ **Enriquecimento de Contato (Contact Enrichment)**
  - Análise de completude dos dados
  - Porcentagem de preenchimento
  - Campos faltantes
  - Sugestões de melhoria

- ✅ **Score de Engajamento (Engagement Score)**
  - Total de interações
  - Interações recentes
  - Dias desde última interação
  - Deals abertos e totais
  - Score de engajamento (0-100%)
  - Nível de engajamento (high/medium/low)
  - Próxima ação sugerida

- ✅ **Analytics de Pipeline**
  - Agrupamento de deals por estágio
  - Valor total por estágio
  - Contagem de deals por estágio

### Comportamentos

- 🎯 **Auto-conversão para Zettel:** Deals criados viram zettels automaticamente
- 📊 **Analytics em tempo real:** Probabilidades recalculadas quando deal é atualizado
- 🔔 **Evento DEAL_WON:** Dispara quando deal muda para "won"
- 🔔 **Evento DEAL_CREATED:** Dispara quando deal é criado
- 🔔 **Evento CONTACT_CREATED:** Dispara quando contato é criado
- 🏷️ **Tags dinâmicas:** Tags são criadas automaticamente se não existirem
- 👤 **Atribuição automática:** Se owner não especificado, usa usuário criador

---

## 💬 Chat e Mensageria

### Funcionalidades

#### 1. **Canais de Chat**
- ✅ Criar canal público ou privado
- ✅ Definir nome e descrição do canal
- ✅ Listar todos os canais
- ✅ Visualizar membros do canal
- ✅ Adicionar membros ao canal
- ✅ Remover membros do canal

#### 2. **Mensagens**
- ✅ Enviar mensagem em canal
- ✅ Enviar mensagem direta para usuário
- ✅ Editar mensagem (apenas autor)
- ✅ Excluir mensagem (autor ou moderador)
- ✅ Listar mensagens de um canal (últimas 100)
- ✅ Adicionar reações (emoji) a mensagens
- ✅ Remover reações
- ✅ Responder mensagem (threading)
- ✅ Marcar mensagens como lidas
- ✅ Contar mensagens não lidas

#### 3. **Funcionalidades em Tempo Real (WebSocket)**
- ✅ **Typing Indicators:** Indicador de "digitando..."
- ✅ **Presença:** Status online/offline de usuários
- ✅ **Entrega de mensagens:** Mensagens aparecem instantaneamente
- ✅ **Edição em tempo real:** Mensagens editadas atualizam para todos
- ✅ **Deleção em tempo real:** Mensagens deletadas somem para todos
- ✅ **Reações em tempo real:** Reações aparecem instantaneamente
- ✅ **Read receipts:** Marcação de leitura sincronizada

#### 4. **Analytics de Chat com IA**
- ✅ **Análise de Sentimento de Mensagem**
  - Classificação: positive/negative/neutral
  - Score de sentimento (0-1)
  - Autor e conteúdo da mensagem

- ✅ **Análise de Sentimento de Conversa**
  - Sentimento geral do canal
  - Score médio
  - Distribuição (positive/neutral/negative)
  - Contagem de mensagens analisadas

- ✅ **Sugestões de Resposta Inteligente**
  - 3 sugestões de resposta geradas por IA
  - Baseadas no contexto da mensagem

- ✅ **Resumo de Conversa**
  - Resumo gerado por IA das últimas N mensagens
  - Lista de participantes
  - Contagem de mensagens

### Comportamentos

- 🔄 **Auto-join:** Usuário entra automaticamente em rooms da empresa ao conectar
- 👥 **Rooms automáticos:** `company:{companyId}`, `user:{userId}`, `channel:{channelId}`
- ⏱️ **Timeout de typing:** Typing indicator expira após 3 segundos sem digitação
- 🎯 **Auto-conversão para Zettel:** Mensagens importantes viram zettels automaticamente
- 🔔 **Notificações:** Mensagens geram notificações para destinatários
- 📊 **Analytics automático:** Sentimento calculado quando mensagem é criada

---

## 🧠 Sistema de Knowledge (Zettel)

### Funcionalidades

#### 1. **Gestão de Zettels (Nós de Conhecimento)**
- ✅ Criar zettel com título, conteúdo, tipo
- ✅ Tipos: zettel, documentation, procedure, reference, insight, deal, message, conversation, meeting, task
- ✅ Adicionar tags
- ✅ Definir score de importância (0-1)
- ✅ Criar zettel pessoal (ownerId definido)
- ✅ Criar zettel da empresa (isCompanyWide = true)
- ✅ Editar zettel
- ✅ Excluir zettel (soft delete)
- ✅ Listar zettels com filtros
- ✅ Filtrar por tipo, tags, importância mínima, scope
- ✅ Buscar por título/conteúdo
- ✅ Visualizar zettel com links e embeddings

#### 2. **Links Entre Zettels**
- ✅ Criar link entre dois zettels
- ✅ Tipos de link: related, derives, supports, contradicts
- ✅ Definir força do link (strength 0-1)
- ✅ Listar links de entrada (incoming)
- ✅ Listar links de saída (outgoing)
- ✅ Excluir link

#### 3. **Visualização Obsidian-Style**
- ✅ Grafo completo de todos os zettels acessíveis
- ✅ Nós coloridos por tipo:
  - 🔵 Azul (#3b82f6) = zettel da empresa
  - 🟣 Roxo (#8b5cf6) = zettel pessoal
- ✅ Tamanho do nó baseado em importância
- ✅ Links coloridos por tipo:
  - 🔗 Cinza = related
  - 🟢 Verde = derives
  - 🔵 Azul = supports
  - 🔴 Vermelho = contradicts
- ✅ Formato compatível com D3.js e vis-network
- ✅ Metadados: total de nós, total de links, modo de visualização

#### 4. **Sistema RAG (Retrieval-Augmented Generation)**
- ✅ **Auto-indexação:** Embeddings criados automaticamente ao criar/editar zettel
- ✅ **Busca Semântica:**
  - Geração de embedding da query
  - Cálculo de similaridade coseno
  - Ranking por relevância
  - Score mínimo configurável (padrão 0.7)
  - Limite de resultados configurável
  - Respeita permissões (empresa + pessoal)

- ✅ **Perguntas e Respostas com IA:**
  - Busca top N zettels mais relevantes
  - Construção de contexto com conteúdo dos zettels
  - Geração de resposta em português
  - Lista de fontes com scores de relevância
  - Nível de confiança (high/medium/low)
  - Indicação do modelo usado (OpenAI/Ollama)

#### 5. **Conversão de Entidades para Zettels**
- ✅ Converter entidade individual para zettel
- ✅ Conversão em lote (batch)
- ✅ Metadados mantidos (sourceEntityType, sourceEntityId)
- ✅ Flag autoConverted
- ✅ Suporte para qualquer tipo de entidade

#### 6. **Sugestões com IA**
- ✅ **Sugestões de Zettels Relacionados**
  - Análise de zettels similares
  - Sugestões baseadas em conteúdo

- ✅ **Sugestões de Tags**
  - IA sugere tags baseadas em título e conteúdo
  - Tags relevantes ao contexto

- ✅ **Sugestões de Links**
  - IA sugere links para outros zettels
  - Tipos de relacionamento sugeridos

#### 7. **Sistema de Tags**
- ✅ Listar todas as tags
- ✅ Contagem de uso de cada tag
- ✅ Tags criadas dinamicamente

#### 8. **Permissões Hierárquicas**
- ✅ **DEV e ADMIN_GERAL:** Veem TODOS os zettels de TODAS as empresas
- ✅ **Usuários normais:** Veem zettels da empresa + zettels pessoais próprios
- ✅ **Scopes:**
  - `accessible` = empresa + pessoal
  - `company` = apenas empresa
  - `personal` = apenas pessoal

### Comportamentos

- 🔄 **Auto-RAG:** Embeddings gerados/atualizados automaticamente
- 🎯 **Auto-conversão:** Deals, mensagens, contatos viram zettels
- 📊 **Contador de acessos:** Cada visualização incrementa accessCount
- 🔗 **Links bidirecionais:** Links podem ser navegados em ambas direções
- 🏷️ **Tags normalizadas:** Tags convertidas para lowercase
- 🔐 **Permissões em RAG:** Busca semântica respeita permissões
- 🧠 **IA contextual:** Q&A usa contexto de empresa + pessoal do usuário

---

## 🤖 Sistema de IA (3 Modos)

### Funcionalidades

#### 1. **Modos de IA**
- ✅ **FULL (OpenAI sempre):**
  - Todas as requisições vão para OpenAI
  - Melhor qualidade
  - Custo por uso

- ✅ **AUTO (Híbrido Inteligente):**
  - IA analisa complexidade da tarefa
  - Tarefas simples → Ollama (grátis)
  - Tarefas complexas → OpenAI (pago)
  - Tarefas médias → 70% Ollama, 30% OpenAI
  - Análise de complexidade baseada em:
    - Tamanho do prompt
    - Palavras-chave de complexidade
    - Contexto necessário

- ✅ **ECONOMICO (Ollama sempre):**
  - Todas as requisições vão para Ollama
  - Totalmente gratuito
  - Execução local

#### 2. **Análise de Complexidade**
Palavras-chave que indicam alta complexidade:
- `analise`, `complexo`, `profundo`, `detalhado`
- `compare`, `contraste`, `avalie`
- `estratégia`, `planejamento`
- `explique em detalhes`
- `raciocine sobre`

#### 3. **Chat com IA**
- ✅ Enviar mensagem para IA
- ✅ System message customizável
- ✅ Temperatura configurável
- ✅ Retorno da resposta
- ✅ Indicação do modelo usado
- ✅ Indicação do provider (OpenAI/Ollama)
- ✅ Contagem de tokens usados
- ✅ Cálculo de custo (se OpenAI)

#### 4. **RAG Query**
- ✅ Busca na base de conhecimento
- ✅ Geração de resposta com contexto
- ✅ Fontes citadas

#### 5. **Ingestão de Conhecimento**
- ✅ Indexar zettel no RAG
- ✅ Geração de embedding
- ✅ Armazenamento vetorial

#### 6. **Busca RAG**
- ✅ Busca semântica por query
- ✅ Limite de resultados
- ✅ Ranking por relevância

#### 7. **Configuração de Modo**
- ✅ Obter modo atual
- ✅ Alterar modo (FULL/AUTO/ECONOMICO)
- ✅ Persistência da configuração

### Comportamentos

- 🧠 **Decisão inteligente:** No modo AUTO, IA decide qual provider usar
- 💰 **Otimização de custo:** Tarefas simples sempre gratuitas no AUTO
- 🎯 **Fallback:** Se OpenAI falhar, tenta Ollama
- 📊 **Tracking:** Todas as chamadas registram modelo, provider, tokens, custo
- 🔄 **Configuração global:** Modo se aplica a toda a empresa
- 🌐 **Multi-provider:** Suporte para OpenAI e Ollama simultaneamente

---

## ⚡ Automações e Workflows

### Funcionalidades

#### 1. **Gestão de Workflows**
- ✅ Criar workflow com nome, descrição, definição (JSON)
- ✅ Editar workflow
- ✅ Excluir workflow (apenas company_admin)
- ✅ Listar workflows
- ✅ Filtrar por status (DRAFT/ACTIVE/PAUSED)
- ✅ Visualizar workflow com execuções recentes

#### 2. **Controle de Workflow**
- ✅ Ativar workflow (muda status para ACTIVE)
- ✅ Pausar workflow (muda status para PAUSED)
- ✅ Testar workflow manualmente (com dados de teste)

#### 3. **Execuções**
- ✅ Listar execuções de workflows
- ✅ Filtrar por workflowId, status
- ✅ Paginação de execuções
- ✅ Visualizar logs de execução
- ✅ Status: SUCCESS, FAILED, RUNNING

#### 4. **Permissões**
- ✅ Criar/editar/ativar/pausar: company_admin ou supervisor
- ✅ Excluir: apenas company_admin
- ✅ Visualizar: todos usuários autenticados

#### 5. **Sugestões de Workflows com IA**
- ✅ IA analisa atividade da empresa:
  - Quantidade de deals
  - Quantidade de contatos
  - Quantidade de mensagens
  - Quantidade de interações
- ✅ Sugere workflows baseados no uso
- ✅ Exemplos de sugestões:
  - "Automatize notificação quando deal fecha"
  - "Envie email de boas-vindas para novos contatos"
  - "Alerte quando deal fica parado por 7 dias"

#### 6. **Análise de Eficiência com IA**
- ✅ Métricas de execução:
  - Total de execuções
  - Execuções bem-sucedidas
  - Execuções falhadas
  - Taxa de sucesso (%)
  - Duração média em segundos
  - Contagem de nós no workflow
- ✅ Análise gerada por IA
- ✅ Classificação de eficiência: excellent, good, fair, poor

### Comportamentos

- 🔄 **Execução automática:** Workflows ACTIVE executam quando evento ocorre
- 📊 **Logging completo:** Cada execução gera logs detalhados
- 🎯 **Triggers:** Workflows podem escutar eventos do EventBus
- ⏸️ **Pause sem perda:** Workflows pausados podem ser reativados
- 🧪 **Teste seguro:** Modo de teste não afeta dados reais
- 🔐 **Isolamento:** Workflows de uma empresa não afetam outras

---

## 📱 Omnichannel

### Funcionalidades

#### 1. **Gestão de Contas WhatsApp**
- ✅ Criar conta WhatsApp (Evolution API)
- ✅ Configurar instanceName, apiUrl, apiKey
- ✅ Listar contas WhatsApp
- ✅ Obter QR code para conexão
- ✅ Verificar status da instância
- ✅ Desconectar instância
- ✅ Excluir conta WhatsApp
- ✅ Webhook URL configurável

#### 2. **Envio de Mensagens WhatsApp**
- ✅ Enviar mensagem de texto
- ✅ Especificar número de destino
- ✅ Integração com Evolution API

#### 3. **Webhooks WhatsApp**
- ✅ Receber eventos da Evolution API
- ✅ Processar mensagens recebidas
- ✅ Processar status de mensagens
- ✅ Processar conexão/desconexão

#### 4. **Gestão de Conversas**
- ✅ Criar conversa
- ✅ Vincular conversa a contato
- ✅ Definir canal (whatsapp, email, etc)
- ✅ Definir status (open, pending, closed)
- ✅ Atribuir conversa a usuário
- ✅ Listar conversas com filtros
- ✅ Filtrar por status, canal, contactId
- ✅ Paginação de conversas
- ✅ Visualizar conversa com mensagens
- ✅ Atualizar status da conversa
- ✅ Reatribuir conversa

### Comportamentos

- 📲 **Webhook automático:** Evolution API envia eventos para o sistema
- 🔄 **Sincronização:** Status de conexão sincronizado com Evolution API
- 💬 **Histórico:** Todas as mensagens são armazenadas
- 👤 **Auto-criação de contatos:** Novos números viram contatos automaticamente
- 🎯 **Roteamento:** Conversas podem ser atribuídas automaticamente
- 📊 **Métricas:** Tempo de resposta, conversas abertas, etc

---

## 🔔 Notificações

### Funcionalidades

#### 1. **Criação de Notificações**
- ✅ Criar notificação para usuário
- ✅ Definir tipo, título, corpo
- ✅ Vincular a entidade (entityType, entityId)
- ✅ Adicionar metadados customizados

#### 2. **Listagem e Filtros**
- ✅ Listar notificações do usuário
- ✅ Ordenar por prioridade de IA
- ✅ Filtrar lidas/não lidas

#### 3. **Gestão de Notificações**
- ✅ Marcar notificação como lida
- ✅ Marcar todas como lidas
- ✅ Excluir notificação

#### 4. **Resumo Inteligente com IA**
- ✅ Resumo gerado por IA das notificações não lidas
- ✅ Total de não lidas
- ✅ Contagem de alta prioridade
- ✅ Categorização por tipo
- ✅ Top notificações com:
  - ID, tipo, título
  - Prioridade (0-1)
  - Sentimento

#### 5. **Analytics Automático com IA**
Cada notificação criada recebe:
- ✅ **Análise de sentimento:**
  - aiSentiment: positive/negative/neutral
  - aiSentimentScore: 0-1

- ✅ **Análise de prioridade:**
  - aiPriority: 0-1 (urgência)
  - Baseado em palavras-chave e contexto

### Comportamentos

- 🔔 **Evento NOTIFICATION_CREATED:** Dispara quando notificação é criada
- 🧠 **IA automática:** Sentimento e prioridade calculados automaticamente
- 📊 **Ordenação inteligente:** Frontend pode ordenar por aiPriority
- 🎯 **Filtragem inteligente:** Notificações de alta prioridade destacadas
- 🔄 **Tempo real:** Notificações aparecem instantaneamente via EventBus

---

## 📊 Analytics e Relatórios

### Funcionalidades

#### 1. **Dashboard Principal**
- ✅ Métricas gerais:
  - Total de contatos
  - Deals ativos
  - Taxa de conversão
  - Receita total
  - Mensagens enviadas/recebidas
- ✅ Pipeline por estágio
- ✅ Série temporal de atividades

#### 2. **Análise de Série Temporal**
- ✅ Dados agrupados por período
- ✅ Filtro por métrica específica
- ✅ Filtro por range de datas
- ✅ Métricas disponíveis:
  - Contatos criados
  - Deals criados
  - Mensagens enviadas
  - Interações registradas

#### 3. **Top Contatos**
- ✅ Ranking de contatos mais ativos
- ✅ Baseado em interações
- ✅ Limite configurável

#### 4. **Analytics de Pipeline**
- ✅ Valor total por estágio
- ✅ Quantidade de deals por estágio
- ✅ Taxa de conversão por estágio
- ✅ Tempo médio em cada estágio

#### 5. **Atividade de Usuários**
- ✅ Atividade por usuário
- ✅ Filtro por período (últimos N dias)
- ✅ Métricas:
  - Contatos criados
  - Deals criados
  - Mensagens enviadas
  - Interações registradas

#### 6. **Exportação de Dados**
- ✅ Exportar contatos para CSV
- ✅ Exportar deals para CSV
- ✅ Download direto do arquivo

### Comportamentos

- 📊 **Cálculos em tempo real:** Métricas atualizadas com cada ação
- 📈 **Agregação eficiente:** Queries otimizadas com agregações do Prisma
- 🔐 **Isolamento:** Analytics isolados por empresa
- 📅 **Histórico:** Série temporal mantém histórico completo
- 💾 **Cache:** Resultados podem ser cacheados para performance

---

## 👥 RBAC e Permissões

### Funcionalidades

#### 1. **Departamentos**
- ✅ Criar departamento
- ✅ Definir nome, descrição
- ✅ Criar hierarquia (parentId)
- ✅ Adicionar metadados customizados
- ✅ Editar departamento
- ✅ Excluir departamento (se sem subdeps e usuários)
- ✅ Listar departamentos com hierarquia
- ✅ Adicionar usuário a departamento
- ✅ Definir departamento primário do usuário

#### 2. **Roles Customizados**
- ✅ Criar role customizado
- ✅ Definir nome, descrição, nível
- ✅ Editar role
- ✅ Excluir role (se não atribuído a usuários)
- ✅ Listar roles
- ✅ Roles do sistema (não editáveis):
  - dev
  - admin_geral
  - admin
  - manager
  - agent
  - viewer

#### 3. **Permissões de Role**
- ✅ Adicionar permissão a role
- ✅ Definir resource e action
- ✅ Adicionar condições (JSON)
- ✅ Remover permissão de role
- ✅ Listar permissões de um role

#### 4. **Permissões de Usuário**
- ✅ Listar todas as permissões de um usuário
- ✅ Conceder permissão específica a usuário
- ✅ Revogar permissão de usuário
- ✅ Definir expiração de permissão
- ✅ Adicionar razão para concessão
- ✅ Atribuir role customizado a usuário

#### 5. **Audit de Permissões**
- ✅ Histórico de mudanças de permissões
- ✅ Filtrar por tipo de entidade (role/user)
- ✅ Filtrar por ID de entidade
- ✅ Limite de registros

#### 6. **Sistema de Permissões**
Permissões disponíveis:
- ✅ USER: read, create, update, delete
- ✅ CONTACT: read, create, update, delete
- ✅ DEAL: read, create, update, delete
- ✅ PRODUCT: read, create, update, delete
- ✅ INVOICE: read, create, update, delete
- ✅ KNOWLEDGE: read, create, update, delete
- ✅ CHAT: read, send, moderate
- ✅ ANALYTICS: view, export
- ✅ SETTINGS: read, update
- ✅ INTEGRATION: read, manage
- ✅ AUDIT: read
- ✅ FILE: read, upload, delete
- ✅ APIKEY: read, create, revoke
- ✅ WEBHOOK: read, manage

### Comportamentos

- 🔐 **Hierarquia de roles:** DEV > ADMIN_GERAL > admin > manager > agent > viewer
- 🎯 **DEV e ADMIN_GERAL:** Acesso total a todas as empresas
- 🏢 **Isolamento:** Roles e departamentos isolados por empresa
- 📋 **Herança:** Usuários herdam permissões do seu role
- ➕ **Override:** Permissões específicas de usuário sobrescrevem role
- ⏰ **Expiração:** Permissões podem ter data de expiração
- 🔍 **Audit trail:** Todas as mudanças são registradas
- 🚫 **Proteção de sistema:** Roles de sistema não podem ser editados/excluídos

---

## 🔗 Webhooks e Integrações

### Funcionalidades

#### 1. **Definições de Eventos**
- ✅ Criar definição de evento customizado
- ✅ Definir nome, categoria, descrição
- ✅ Definir schema (JSON Schema)
- ✅ Listar eventos disponíveis
- ✅ Eventos do sistema:
  - deal.created, deal.updated, deal.won, deal.lost
  - contact.created, contact.updated
  - message.sent
  - workflow.completed

#### 2. **Endpoints de Webhook**
- ✅ Criar endpoint de webhook
- ✅ Definir URL de destino
- ✅ Selecionar eventos para escutar
- ✅ Adicionar headers customizados
- ✅ Configurar timeout (ms)
- ✅ Configurar retries (tentativas, delay, backoff)
- ✅ Geração automática de secret para assinatura
- ✅ Editar endpoint
- ✅ Excluir endpoint
- ✅ Listar endpoints

#### 3. **Delivery e Logs**
- ✅ Listar entregas de webhooks
- ✅ Filtrar por endpointId, eventName, success
- ✅ Visualizar payload enviado
- ✅ Visualizar resposta recebida
- ✅ Visualizar código de status HTTP
- ✅ Visualizar tempo de resposta
- ✅ Visualizar tentativas de retry

#### 4. **Teste de Webhook**
- ✅ Enviar requisição de teste para endpoint
- ✅ Payload de teste customizável
- ✅ Verificação de conectividade

### Comportamentos

- 🔄 **Retry automático:** Falhas são retentadas conforme configuração
- 📝 **Logging completo:** Todas as entregas são registradas
- 🔐 **Assinatura HMAC:** Cada requisição inclui signature no header
- ⏱️ **Timeout configurável:** Previne requisições travadas
- 🎯 **Filtragem de eventos:** Endpoints recebem apenas eventos selecionados
- 📊 **Métricas:** Taxa de sucesso, tempo médio de resposta
- 🔒 **Isolamento:** Webhooks isolados por empresa

---

## 📁 Arquivos e Upload

### Funcionalidades

#### 1. **Upload de Arquivos**
- ✅ Upload de imagens (JPEG, PNG, GIF, WebP)
- ✅ Upload de documentos (PDF, DOC, DOCX, XLS, XLSX)
- ✅ Limite de 10MB por arquivo
- ✅ Vincular arquivo a entidade (entityType, entityId)
- ✅ Armazenamento com nome único (UUID)
- ✅ Preservação de extensão original

#### 2. **Gestão de Arquivos**
- ✅ Listar arquivos
- ✅ Filtrar por entityType e entityId
- ✅ Obter URL pré-assinada (expira em 1 hora)
- ✅ Download direto de arquivo
- ✅ Excluir arquivo

#### 3. **Upload de Avatar**
- ✅ Upload de avatar de usuário
- ✅ Processamento de imagem
- ✅ Atualização automática do perfil
- ✅ URL do avatar retornado

### Comportamentos

- 📁 **Armazenamento local:** Arquivos salvos em `uploads/`
- 🔐 **Acesso controlado:** URLs pré-assinadas expiram
- 🗂️ **Organização:** Arquivos organizados por empresa
- 🎯 **Vinculação:** Arquivos vinculados a entidades específicas
- 🖼️ **Tipos permitidos:** Validação de MIME type
- 📊 **Metadados:** Tamanho, tipo, nome original armazenados

---

## 🔍 Busca Global

### Funcionalidades

#### 1. **Busca Multi-Entidade**
- ✅ Buscar em múltiplas entidades simultaneamente:
  - Contatos
  - Deals
  - Mensagens
  - Zettels (knowledge nodes)
  - Usuários
  - Produtos
- ✅ Query única busca em todos
- ✅ Filtro por tipo específico
- ✅ Limite de resultados (padrão 20, max 100)
- ✅ Resultados agrupados por tipo

#### 2. **Sugestões de Busca (Autocomplete)**
- ✅ Sugestões enquanto digita
- ✅ Mínimo de 2 caracteres
- ✅ Limite de sugestões (padrão 10, max 20)
- ✅ Filtro por tipo
- ✅ Retorna: type, id, label, sublabel

#### 3. **Histórico de Buscas**
- ✅ Salvar busca recente do usuário
- ✅ Listar buscas recentes (últimas 10)
- ✅ Máximo de 10 buscas por usuário

#### 4. **Cache**
- ✅ Resultados cacheados por 5 minutos
- ✅ Cache por empresa
- ✅ Indicador de cache no response

### Comportamentos

- 🔍 **Busca fuzzy:** Busca parcial em múltiplos campos
- ⚡ **Cache inteligente:** Mesmas queries retornam instantaneamente
- 🎯 **Relevância:** Resultados ordenados por relevância
- 🔐 **Permissões:** Respeita isolamento de empresa
- 📊 **Performance:** Queries otimizadas com índices

---

## 📜 Audit e Logs

### Funcionalidades

#### 1. **Logs de Auditoria**
- ✅ Registrar todas as ações importantes
- ✅ Capturar:
  - Usuário que executou ação
  - Ação executada (CREATE, UPDATE, DELETE)
  - Entidade afetada (entityType, entityId)
  - IP do usuário
  - User agent
  - Timestamp
- ✅ Listar logs de auditoria
- ✅ Filtrar por entityType, entityId, action
- ✅ Paginação

#### 2. **Rastreamento de Mudanças**
- ✅ Armazenar estado anterior (oldValues)
- ✅ Armazenar estado novo (newValues)
- ✅ Diff completo de mudanças

### Comportamentos

- 📝 **Registro automático:** Middleware captura ações automaticamente
- 🔐 **Imutável:** Logs não podem ser editados/excluídos
- 🎯 **Compliance:** Atende requisitos de auditoria
- 📊 **Análise:** Logs podem ser analisados para insights
- ⏰ **Retenção:** Logs mantidos indefinidamente

---

## 🔑 API Keys

### Funcionalidades

#### 1. **Gestão de API Keys**
- ✅ Criar API key com scopes
- ✅ Definir data de expiração (opcional)
- ✅ Geração de key única (prefixo `omni_`)
- ✅ Hash da key armazenado (segurança)
- ✅ Key mostrada apenas uma vez
- ✅ Listar API keys (sem secrets)
- ✅ Revogar API key
- ✅ Excluir API key

#### 2. **Scopes de Permissão**
- ✅ Definir permissões específicas por key
- ✅ Scopes disponíveis:
  - read:contacts, write:contacts
  - read:deals, write:deals
  - read:messages, write:messages
  - read:knowledge, write:knowledge
  - etc.

#### 3. **Estatísticas de Uso**
- ✅ Total de requisições
- ✅ Data da última utilização
- ✅ Logs recentes de uso

#### 4. **Autenticação por API Key**
- ✅ Header: `X-API-Key: omni_xxxxx`
- ✅ Validação de key
- ✅ Verificação de expiração
- ✅ Verificação de revogação
- ✅ Verificação de scopes

### Comportamentos

- 🔐 **Hash seguro:** Keys hasheadas com bcrypt
- ⚠️ **Aviso único:** "Save this key now. You will not be able to see it again."
- ⏰ **Expiração automática:** Keys expiradas não funcionam
- 🚫 **Revogação:** Keys revogadas param imediatamente
- 📊 **Tracking:** Todas as requisições são logadas
- 🎯 **Scopes granulares:** Controle fino de permissões

---

## 🎯 Eventos do Sistema

### EventBus - Eventos Disponíveis

#### **Contatos**
- ✅ `CONTACT_CREATED` - Quando contato é criado
- ✅ `CONTACT_UPDATED` - Quando contato é atualizado
- ✅ `CONTACT_DELETED` - Quando contato é deletado

#### **Deals**
- ✅ `DEAL_CREATED` - Quando deal é criado
- ✅ `DEAL_UPDATED` - Quando deal é atualizado
- ✅ `DEAL_WON` - Quando deal muda para "won"
- ✅ `DEAL_LOST` - Quando deal muda para "lost"
- ✅ `DEAL_STAGE_CHANGED` - Quando estágio muda

#### **Chat**
- ✅ `CHAT_MESSAGE_SENT` - Quando mensagem é enviada
- ✅ `CHAT_MESSAGE_EDITED` - Quando mensagem é editada
- ✅ `CHAT_MESSAGE_DELETED` - Quando mensagem é deletada
- ✅ `CHAT_REACTION_ADDED` - Quando reação é adicionada
- ✅ `CHAT_REACTION_REMOVED` - Quando reação é removida

#### **Usuários**
- ✅ `USER_CREATED` - Quando usuário é criado
- ✅ `USER_ONLINE` - Quando usuário fica online
- ✅ `USER_OFFLINE` - Quando usuário fica offline

#### **Notificações**
- ✅ `NOTIFICATION_CREATED` - Quando notificação é criada

#### **Workflows**
- ✅ `WORKFLOW_STARTED` - Quando workflow inicia
- ✅ `WORKFLOW_COMPLETED` - Quando workflow completa
- ✅ `WORKFLOW_FAILED` - Quando workflow falha

#### **Knowledge**
- ✅ `KNOWLEDGE_NODE_CREATED` - Quando zettel é criado
- ✅ `KNOWLEDGE_NODE_UPDATED` - Quando zettel é atualizado
- ✅ `KNOWLEDGE_LINK_CREATED` - Quando link é criado

### WebSocket - Eventos em Tempo Real

#### **Namespace: /chat**
**Eventos Enviados pelo Cliente:**
- ✅ `channel:join` - Entrar em canal
- ✅ `channel:leave` - Sair de canal
- ✅ `message:send` - Enviar mensagem
- ✅ `message:edit` - Editar mensagem
- ✅ `message:delete` - Deletar mensagem
- ✅ `message:react` - Adicionar/remover reação
- ✅ `typing:start` - Começar a digitar
- ✅ `typing:stop` - Parar de digitar
- ✅ `message:mark-read` - Marcar como lida

**Eventos Recebidos pelo Cliente:**
- ✅ `user:online` - Usuário ficou online
- ✅ `user:offline` - Usuário ficou offline
- ✅ `channel:joined` - Entrou no canal
- ✅ `channel:left` - Saiu do canal
- ✅ `message:new` - Nova mensagem
- ✅ `message:edited` - Mensagem editada
- ✅ `message:deleted` - Mensagem deletada
- ✅ `message:reaction:added` - Reação adicionada
- ✅ `message:reaction:removed` - Reação removida
- ✅ `user:typing` - Usuário digitando
- ✅ `user:stopped-typing` - Usuário parou de digitar
- ✅ `messages:marked-read` - Mensagens marcadas como lidas
- ✅ `error` - Erro ocorreu

---

## 🔄 Comportamentos Automáticos

### Auto-Conversão para Zettels

#### 1. **Deals → Zettels**
- ✅ **Trigger:** Evento `DEAL_CREATED`
- ✅ **Conteúdo gerado:**
  - Título do deal
  - Status e valor
  - Contato relacionado
  - Responsável
  - Lista de produtos
- ✅ **Tags:** `['deal', 'vendas', <stage>]`
- ✅ **Importância:** 0.8 se valor > 10000, senão 0.6
- ✅ **Tipo:** `deal`
- ✅ **Metadados:** sourceEntityType, sourceEntityId, autoConverted

#### 2. **Deals Ganhos → Atualização de Zettels**
- ✅ **Trigger:** Evento `DEAL_WON`
- ✅ **Comportamento:** Atualiza zettel existente com "Deal Won! 🎉"
- ✅ **Atualização de RAG:** Re-indexa embedding

#### 3. **Mensagens Importantes → Zettels**
- ✅ **Trigger:** Evento `CHAT_MESSAGE_SENT` com flag `isImportant` ou `shouldArchive`
- ✅ **Conteúdo gerado:**
  - Autor da mensagem
  - Conteúdo completo
  - Canal/conversa
- ✅ **Tags:** `['mensagem', 'importante']`
- ✅ **Tipo:** `message`

#### 4. **Contatos → Zettels**
- ✅ **Trigger:** Evento `CONTACT_CREATED`
- ✅ **Conteúdo gerado:**
  - Nome e empresa
  - Email e telefone
  - Tags do contato
- ✅ **Tags:** `['contato', <tags do contato>]`
- ✅ **Tipo:** `reference`

### Auto-Indexação RAG

- ✅ **Criar zettel:** Embedding gerado automaticamente
- ✅ **Editar zettel:** Embedding atualizado se título/conteúdo/tags mudaram
- ✅ **Modelo:** text-embedding-ada-002 (OpenAI) ou nomic-embed-text (Ollama)
- ✅ **Conteúdo indexado:** `${title}\n\n${content}\n\nTags: ${tags.join(', ')}`

### Analytics Automático

#### 1. **Notificações**
- ✅ Análise de sentimento ao criar
- ✅ Cálculo de prioridade ao criar
- ✅ Campos adicionados: aiSentiment, aiSentimentScore, aiPriority

#### 2. **Mensagens**
- ✅ Análise de sentimento disponível via endpoint
- ✅ Análise de sentimento da conversa completa
- ✅ Sugestões de resposta inteligentes

### Eventos em Cascata

- ✅ **DEAL_CREATED** → Cria zettel → Indexa no RAG → Dispara webhook
- ✅ **CONTACT_CREATED** → Cria zettel → Indexa no RAG → Dispara webhook
- ✅ **CHAT_MESSAGE_SENT** → Cria notificação → Analisa sentimento → Emite WebSocket
- ✅ **DEAL_WON** → Atualiza zettel → Re-indexa RAG → Dispara webhook

---

## 📏 Regras de Negócio

### Multi-Tenancy

- ✅ **Isolamento total:** Dados de uma empresa não visíveis para outra
- ✅ **Exceções:** DEV e ADMIN_GERAL veem todas as empresas
- ✅ **Middleware:** `tenantIsolation` garante isolamento em queries
- ✅ **Compartilhamento zero:** Nenhum dado compartilhado entre empresas

### Hierarquia de Permissões

#### **Níveis de Acesso (do maior para menor):**
1. **dev** - Desenvolvedor, acesso total ao sistema
2. **admin_geral** - Super admin, acesso total ao sistema
3. **admin** - Admin da empresa, todas as permissões da empresa
4. **company_admin** - Admin da empresa (alias de admin)
5. **manager** - Gerente, maioria das permissões
6. **supervisor** - Supervisor (entre manager e agent)
7. **agent** - Agente, permissões básicas de operação
8. **viewer** - Visualizador, apenas leitura

### Soft Delete

- ✅ **Implementação:** Campo `deletedAt` em vez de DELETE do banco
- ✅ **Entidades com soft delete:**
  - Contatos
  - Deals
  - Knowledge nodes
  - Mensagens (algumas)
- ✅ **Queries:** Filtro automático `deletedAt: null`
- ✅ **Recuperação:** Possível reverter exclusão

### Validações

#### **Contatos:**
- ✅ Nome: mínimo 2 caracteres
- ✅ Email: formato válido (se fornecido)
- ✅ Telefone: formato válido (se fornecido)

#### **Deals:**
- ✅ Título: mínimo 1 caractere
- ✅ Valor: número positivo
- ✅ Estágio: um dos valores válidos
- ✅ Produtos: array de objetos válidos

#### **Mensagens:**
- ✅ Conteúdo: mínimo 1 caractere
- ✅ Channel OU recipient obrigatório

#### **Zettels:**
- ✅ Título: obrigatório
- ✅ Conteúdo: obrigatório
- ✅ Tipo: um dos valores do enum
- ✅ ImportanceScore: entre 0 e 1

#### **Workflows:**
- ✅ Nome: mínimo 1 caractere
- ✅ Definição: JSON válido

### Limites e Quotas

- ✅ **Upload de arquivo:** Máximo 10MB
- ✅ **Mensagens por query:** Padrão 100, máximo 1000
- ✅ **Contatos por query:** Padrão 20, máximo 100
- ✅ **Busca global:** Padrão 20, máximo 100
- ✅ **Sugestões:** Padrão 10, máximo 20
- ✅ **Histórico de buscas:** Máximo 10 por usuário
- ✅ **Códigos de backup 2FA:** 10 códigos

### Expiração e TTL

- ✅ **Access token:** 15 minutos
- ✅ **Refresh token:** 7 dias
- ✅ **URL pré-assinada:** 1 hora
- ✅ **Cache de busca:** 5 minutos
- ✅ **Token de recuperação de senha:** 1 hora
- ✅ **API keys:** Configurável, pode não expirar

### Segurança

- ✅ **Passwords:** Hash com bcrypt (10 rounds)
- ✅ **API Keys:** Hash com bcrypt
- ✅ **Webhook signatures:** HMAC-SHA256
- ✅ **JWT:** Assinado com secret
- ✅ **2FA:** TOTP (Time-based One-Time Password)

---

## 🎯 Comportamentos Especiais

### Sistema de IA

#### **Modo AUTO - Decisão de Complexidade:**

**Fatores de alta complexidade:**
- ✅ Prompt > 200 caracteres
- ✅ Contém palavras: analise, complexo, profundo, detalhado, compare, contraste, avalie, estratégia, planejamento, raciocine
- ✅ Presença de múltiplas perguntas
- ✅ Requisição de análise aprofundada

**Decisão:**
- ✅ **Alta complexidade:** 100% OpenAI
- ✅ **Baixa complexidade:** 100% Ollama
- ✅ **Média complexidade:** 70% Ollama, 30% OpenAI (randomizado)

### Sistema de Knowledge

#### **Permissões Hierárquicas:**

**DEV ou ADMIN_GERAL:**
- ✅ Vê TODOS os zettels de TODAS as empresas
- ✅ Pode filtrar por companyId
- ✅ Sem restrições de acesso

**Usuários normais:**
- ✅ Vê zettels da própria empresa (isCompanyWide = true)
- ✅ Vê seus próprios zettels pessoais (ownerId = userId)
- ✅ NÃO vê zettels pessoais de outros usuários
- ✅ NÃO vê zettels de outras empresas

**Scopes:**
- ✅ `accessible` = empresa + pessoal próprio
- ✅ `company` = apenas empresa
- ✅ `personal` = apenas pessoal próprio

### Chat em Tempo Real

#### **Auto-Join em Rooms:**
Ao conectar WebSocket, usuário entra automaticamente em:
- ✅ `company:{companyId}` - Eventos da empresa
- ✅ `user:{userId}` - Eventos pessoais
- ✅ Todos os canais dos quais é membro

#### **Typing Indicators:**
- ✅ Timeout de 3 segundos sem digitação
- ✅ Emitido apenas para o canal/conversa específica
- ✅ Não emitido para mensagens diretas em grupo

### Webhooks

#### **Retry Logic:**
- ✅ **Tentativa 1:** Imediato
- ✅ **Tentativa 2:** Delay configurável (padrão: 1s)
- ✅ **Tentativa 3+:** Backoff exponencial (2x a cada tentativa)
- ✅ **Máximo de tentativas:** Configurável (padrão: 3)

#### **Assinatura:**
- ✅ Header: `X-Webhook-Signature`
- ✅ Algoritmo: HMAC-SHA256
- ✅ Secret: Gerado ao criar endpoint
- ✅ Verificação: `HMAC(secret, payload) == signature`

---

## 📝 Resumo Quantitativo

### Módulos Implementados
- ✅ **16 módulos principais**
- ✅ **31 submódulos**

### Endpoints de API
- ✅ **150+ endpoints REST**
- ✅ **15+ eventos WebSocket**

### Funcionalidades
- ✅ **200+ funcionalidades únicas**
- ✅ **50+ comportamentos automáticos**

### Eventos
- ✅ **25+ eventos do EventBus**
- ✅ **15+ eventos WebSocket**

### Permissões
- ✅ **30+ permissões granulares**
- ✅ **8 roles pré-definidos**

### IA e Analytics
- ✅ **15+ features com IA**
- ✅ **3 modos de IA**
- ✅ **Sistema RAG completo**

### Integrações
- ✅ **WhatsApp (Evolution API)**
- ✅ **Webhooks customizados**
- ✅ **API Keys**
- ✅ **OpenAI**
- ✅ **Ollama**

---

## 🏆 Recursos Únicos e Diferenciais

### 1. **Sistema de IA com 3 Modos**
- Único sistema que permite escolher entre OpenAI, Ollama ou híbrido inteligente
- Análise automática de complexidade para otimizar custo/qualidade

### 2. **Sistema Zettel Estilo Obsidian**
- Graph visualization completo
- Auto-conversão de TUDO para zettels
- RAG integrado nativamente
- Permissões hierárquicas (empresa + pessoal)

### 3. **Auto-Conversão Universal**
- Tudo no sistema vira zettel automaticamente
- Indexação RAG automática
- Busca semântica em tudo

### 4. **Analytics com IA em Tempo Real**
- Probabilidade de fechamento de deals
- Análise de sentimento de conversas
- Score de engajamento de contatos
- Sugestões automáticas de ações

### 5. **Multi-Tenancy com Exceções**
- Isolamento total por empresa
- DEV e ADMIN_GERAL veem tudo (para suporte e debug)

### 6. **WebSocket Completo**
- Chat em tempo real
- Typing indicators
- Presença online/offline
- Notificações instantâneas

### 7. **RBAC Flexível**
- Roles customizados
- Permissões granulares
- Departamentos hierárquicos
- Audit trail completo

### 8. **Omnichannel Integrado**
- WhatsApp nativo via Evolution API
- Conversas unificadas
- Multi-canal pronto para expansão

---

**Total de funcionalidades documentadas:** 200+
**Total de comportamentos automáticos:** 50+
**Total de eventos:** 40+
**Total de endpoints:** 150+
