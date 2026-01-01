# 🚀 Completov2 - Guia de Configuração Completo

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
3. [Configuração do Backend](#configuração-do-backend)
4. [Configuração do Frontend](#configuração-do-frontend)
5. [Internacionalização (i18n)](#internacionalização)
6. [Testando a Aplicação](#testando-a-aplicação)
7. [Solucionando Problemas](#solucionando-problemas)

---

## 🔧 Pré-requisitos

### Softwares Necessários
- **Node.js** >= 18.x
- **npm** ou **yarn**
- **PostgreSQL** >= 14.x
- **Git**

### Instalação do PostgreSQL

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### MacOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Windows
Baixe o instalador em: https://www.postgresql.org/download/windows/

---

## 💾 Configuração do Banco de Dados

### 1. Criar Banco de Dados

```bash
# Conectar ao PostgreSQL
sudo -u postgres psql

# Criar banco de dados
CREATE DATABASE omni_platform;

# Criar usuário (opcional)
CREATE USER omni_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE omni_platform TO omni_user;

# Sair
\q
```

### 2. Configurar Variáveis de Ambiente

```bash
cd /home/user/completov2

# O arquivo .env já foi criado, mas você pode editar se necessário
nano .env
```

Certifique-se de que a `DATABASE_URL` está correta:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/omni_platform?schema=public"
```

**OU** se criou um usuário customizado:
```env
DATABASE_URL="postgresql://omni_user:your_password@localhost:5432/omni_platform?schema=public"
```

### 3. Aplicar Schema ao Banco

```bash
# Gerar Prisma Client
npx prisma generate

# Sincronizar schema com o banco (cria todas as tabelas)
npx prisma db push

# OU usar migrations (recomendado para produção)
npx prisma migrate dev --name init
```

**Resultado esperado:**
```
✔ Generated Prisma Client
Database schema synchronized successfully
✔ All tables created
```

### 4. Seed de Dados (Opcional)

```bash
# Se houver um seed script
npm run seed
```

---

## ⚙️ Configuração do Backend

### 1. Instalar Dependências

```bash
cd /home/user/completov2
npm install
```

### 2. Gerar Prisma Client

```bash
npx prisma generate
```

### 3. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

**Resultado esperado:**
```
[INFO] ✅ Database connected
[INFO] ✅ Socket.IO initialized
[INFO] ✅ EventBus initialized
[INFO] ✅ Modules enabled
[INFO] ✅ System initialization completed successfully
[INFO] Server running on port 5000
```

**Módulos Ativos:**
- ✅ auth
- ✅ crm
- ✅ omnichannel
- ✅ knowledge
- ✅ **rbac** (NOVO!)
- ✅ **jobs** (NOVO!)
- ✅ **services** (NOVO!)
- ✅ **partnerships** (NOVO!)
- ✅ **settings** (NOVO!)
- ✅ **webhooks** (NOVO!)
- ✅ ai, analytics, files, etc.

---

## 🎨 Configuração do Frontend

### 1. Instalar Dependências

```bash
cd /home/user/completov2/web
npm install
```

### 2. Configurar Variáveis de Ambiente (Opcional)

```bash
# Criar .env.local se necessário
echo "VITE_API_URL=http://localhost:5000" > .env.local
```

### 3. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

**Resultado esperado:**
```
VITE v4.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 4. Acessar Aplicação

Abra seu navegador em: **http://localhost:5173**

---

## 🌍 Internacionalização (i18n)

### Sistema Implementado

A plataforma agora possui **suporte completo a pt-BR e en-US**!

### Como Usar

#### 1. Adicionar o Provider ao App (JÁ FEITO)

```tsx
// web/src/main.tsx ou App.tsx
import { I18nProvider } from './i18n';

<I18nProvider defaultLocale="pt-BR">
  <App />
</I18nProvider>
```

#### 2. Usar Traduções em Componentes

```tsx
import { useT } from '../i18n';

function MyComponent() {
  const t = useT();

  return (
    <div>
      <h1>{t.dashboard.title}</h1>
      <button>{t.common.save}</button>
      <p>{t.contacts.noContacts}</p>
    </div>
  );
}
```

#### 3. Trocar Idioma

Use o componente `<LanguageSelector />`:

```tsx
import { LanguageSelector } from './components/LanguageSelector';

<LanguageSelector />
```

### Idiomas Disponíveis

- 🇧🇷 **Português (BR)** - `pt-BR` (padrão)
- 🇺🇸 **English (US)** - `en-US`

### Adicionar Novas Traduções

1. Edite `web/src/i18n/pt-BR.ts`
2. Adicione a chave correspondente em `web/src/i18n/en-US.ts`
3. Use no componente: `t.seuModulo.suaChave`

---

## 🧪 Testando a Aplicação

### 1. Teste Manual Rápido

#### Backend
```bash
curl http://localhost:5000/healthz
# Deve retornar: {"status":"ok","timestamp":"..."}
```

#### Frontend
- Acesse http://localhost:5173
- Faça login (ou registre-se)
- Navegue pelas páginas
- Teste criar um contato, deal, conversation

### 2. Teste Automatizado de Endpoints

```bash
cd /home/user/completov2
node test-endpoints.js
```

**Resultado esperado:**
```
✓ POST /auth/login (200)
✓ GET /crm/contacts (200)
✓ GET /crm/deals (200)
✓ GET /omnichannel/conversations (200)
✓ GET /rbac/departments (200)
✓ GET /partnerships (200)
...
```

### 3. Checklist de Funcionalidades

- [ ] **Login/Register** funciona
- [ ] **Dashboard** mostra estatísticas
- [ ] **Contatos** - CRUD completo
- [ ] **Deals** - Criar deal com currency
- [ ] **Conversations** - Criar conversa
- [ ] **Knowledge** - Criar zettels
- [ ] **RBAC** - Criar departamentos e roles
- [ ] **Partnerships** - Criar parceria
- [ ] **WhatsApp** - Adicionar conta
- [ ] **AI Chat** - Enviar mensagem
- [ ] **Settings** - Ajustar fees
- [ ] **Trocar idioma** - pt-BR ↔ en-US

---

## 🐛 Solucionando Problemas

### ❌ "Can't reach database server"

**Problema:** PostgreSQL não está rodando

**Solução:**
```bash
# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl status postgresql

# MacOS
brew services start postgresql@14

# Windows
# Iniciar via Services.msc
```

### ❌ "table does not exist"

**Problema:** Tabelas não foram criadas no banco

**Solução:**
```bash
npx prisma db push
# OU
npx prisma migrate dev
```

Depois **REINICIE O BACKEND**:
```bash
# Ctrl+C para parar
npm run dev
```

### ❌ RBAC/Jobs/Services retornam 404

**Problema:** Módulos não foram registrados

**Solução:** Já corrigido! Os módulos agora estão em `src/app.ts`:
- rbacModule
- jobsModule
- servicesModule
- partnershipsModule
- settingsModule
- webhooksModule

Basta reiniciar o backend.

### ❌ "Cannot read properties of undefined (reading 'findMany')"

**Problema:** Prisma Client desatualizado

**Solução:**
```bash
npx prisma generate
# Reiniciar backend
```

### ❌ AI Chat não funciona

**Problema:** Falta configuração de API Key

**Solução:**
Edite `.env` e adicione:
```env
# Para OpenAI
OPENAI_API_KEY=sk-...

# OU para Ollama (local)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

### ❌ WhatsApp não conecta

**Problema:** Evolution API não está configurado

**Solução:**
1. Configure Evolution API separadamente
2. Adicione no `.env`:
```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your_key
```

---

## 📦 Scripts Úteis

```bash
# Backend
npm run dev          # Iniciar dev server
npm run build        # Build para produção
npm run start        # Iniciar produção
npm run test         # Rodar testes
npx prisma studio    # Visualizar banco de dados

# Frontend
cd web
npm run dev          # Iniciar dev server
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Lint código
```

---

## 🎯 Próximos Passos

Após configurar tudo:

1. ✅ **Testar todas as funcionalidades**
2. ✅ **Traduzir páginas restantes** (se houver)
3. ✅ **Configurar Evolution API** (para WhatsApp)
4. ✅ **Configurar OpenAI/Ollama** (para AI Chat)
5. ✅ **Deploy** (quando estiver pronto)

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do backend
2. Verifique console do navegador
3. Execute `node test-endpoints.js`
4. Leia a documentação em `IMPLEMENTACAO_COMPLETA.md`

---

## ✅ Tudo Funcionando!

Quando você ver:

**Backend:**
```
✅ Database connected
✅ System initialization completed successfully
Server running on port 5000
```

**Frontend:**
```
➜  Local:   http://localhost:5173/
```

**Testes:**
```
✓ GET /crm/contacts (200)
✓ GET /rbac/departments (200)
✓ GET /partnerships (200)
```

**🎉 Parabéns! Sua aplicação está 100% funcional!**

---

**Desenvolvido com ❤️ | Completov2 Platform**
**Versão:** 2.0.0
**Data:** 31 de Dezembro de 2025
