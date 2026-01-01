# Completo V2 - Quick Start Guide

## 🚀 Como Iniciar o Projeto

Este guia vai te ajudar a colocar o Completo V2 rodando em poucos minutos.

### Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL 14+ rodando
- npm ou yarn

### 1. Configurar o Banco de Dados

Crie um banco de dados PostgreSQL:

```bash
# No PostgreSQL
createdb completov2

# Ou usando psql
psql -U postgres
CREATE DATABASE completov2;
\q
```

### 2. Configurar Variáveis de Ambiente

#### Backend (.env na raiz do projeto)

Crie o arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_URL="postgresql://postgres:senha@localhost:5432/completov2"

# Server
NODE_ENV=development
PORT=3000
API_VERSION=v1

# JWT
JWT_SECRET=sua_chave_secreta_muito_segura_aqui
JWT_REFRESH_SECRET=sua_chave_refresh_secreta_aqui

# File Upload
MAX_FILE_SIZE_MB=50

# Redis (opcional, para cache e filas)
REDIS_URL=redis://localhost:6379

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env no diretório web/)

Crie o arquivo `.env` no diretório `web/`:

```bash
cd web
cp .env.example .env
cd ..
```

O arquivo `.env` do frontend deve conter:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

**IMPORTANTE**: A URL deve incluir `/api/v1` no final. Sem isso, as chamadas à API falharão com erro 404.

### 3. Instalar Dependências

```bash
# Instalar dependências do backend
npm install

# Instalar dependências do frontend
cd web
npm install
cd ..
```

### 4. Executar Migrações do Banco de Dados

```bash
# Rodar migrações
npx prisma migrate dev

# Gerar Prisma Client
npx prisma generate
```

### 5. (Opcional) Popular Banco com Dados de Teste

```bash
# Seed do banco de dados
npx prisma db seed
```

### 6. Iniciar o Servidor

Você precisa de **2 terminais** rodando simultaneamente:

#### Terminal 1 - Backend

```bash
# Iniciar o servidor backend
npm run dev
```

Você deve ver:
```
✅ Server is running
📡 API: http://localhost:3000/api/v1
🔌 WebSocket: http://localhost:3000/ws
💚 Health: http://localhost:3000/healthz
```

#### Terminal 2 - Frontend

```bash
# Em outro terminal, iniciar o frontend
cd web
npm run dev
```

Você deve ver:
```
VITE v7.3.0  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 7. Acessar a Aplicação

Abra seu navegador em: **http://localhost:5173**

## 📝 Criar sua Primeira Conta

1. Clique em **"Sign up"** na página de login
2. Preencha os dados:
   - **Nome completo**: Seu nome
   - **Email**: seu@email.com
   - **Senha**: Mínimo 8 caracteres
   - **Nome da Empresa**: Nome da sua empresa
   - **Domínio da Empresa**: identificador-unico (só letras minúsculas, números e hífens)
3. Clique em **"Create Account"**
4. Você será redirecionado para o dashboard!

## 🔧 Comandos Úteis

### Backend

```bash
# Desenvolvimento com hot-reload
npm run dev

# Build para produção
npm run build

# Rodar em produção
npm start

# Rodar migrações
npx prisma migrate dev

# Abrir Prisma Studio (GUI do banco)
npx prisma studio

# Ver logs do Prisma
DATABASE_URL="..." npx prisma db pull
```

### Frontend

```bash
# Desenvolvimento com hot-reload
cd web
npm run dev

# Build para produção
npm run build

# Preview do build de produção
npm run preview

# Lint
npm run lint
```

## 🐛 Troubleshooting

### Erro: "Server not found" ou "Network error"

**Problema**: O backend não está rodando.

**Solução**:
1. Verifique se o terminal do backend está rodando
2. Acesse http://localhost:3000/healthz
3. Se não abrir, reinicie o backend com `npm run dev`

### Erro: "Database connection failed"

**Problema**: PostgreSQL não está acessível.

**Solução**:
1. Verifique se o PostgreSQL está rodando: `sudo service postgresql status`
2. Verifique a `DATABASE_URL` no arquivo `.env`
3. Teste a conexão: `psql -U postgres -d completov2`

### Erro: "Port 3000 is already in use"

**Solução**:
```bash
# Encontrar e matar o processo
lsof -ti:3000 | xargs kill -9

# Ou mudar a porta no .env
PORT=3001
```

### Erro: "Prisma Client not generated"

**Solução**:
```bash
npx prisma generate
```

### Tela branca no frontend

**Solução**:
1. Abra o console do navegador (F12)
2. Verifique se há erros
3. Verifique se o backend está respondendo
4. Limpe o localStorage: `localStorage.clear()` no console
5. Recarregue a página

### Erro de CORS

**Solução**:
Verifique se a `FRONTEND_URL` no `.env` do backend está correta:
```env
FRONTEND_URL=http://localhost:5173
```

## 📚 Próximos Passos

Agora que está tudo rodando, explore:

1. **Dashboard** - Visão geral do sistema
2. **Jobs (Vagas)** - Sistema de recrutamento e gestão de vagas
3. **Services (Serviços)** - Marketplace de serviços
4. **Partnerships (Parcerias)** - Rede de parcerias entre empresas
5. **Knowledge (Zettels)** - Base de conhecimento Zettelkasten
6. **Settings** - Configurações do sistema (apenas DEV/admin)

## 📖 Documentação Completa

Para documentação completa, veja:

- [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) - Visão geral do projeto
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - Arquitetura técnica
- [`docs/API_DOCS.md`](docs/API_DOCS.md) - Documentação da API
- [`docs/MODULE_DEVELOPMENT.md`](docs/MODULE_DEVELOPMENT.md) - Guia de desenvolvimento de módulos

## 🆘 Precisa de Ajuda?

- Abra uma issue no GitHub
- Consulte a documentação em `/docs`
- Verifique os logs do backend e frontend

## 🎉 Tudo Funcionando!

Se você chegou até aqui e está vendo o dashboard, parabéns! 🎊

O Completo V2 está rodando e pronto para uso.

Explore os módulos, crie vagas, registre serviços e forme parcerias!
