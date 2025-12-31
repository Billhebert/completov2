# 🐳 Setup com Docker - SUPER FÁCIL!

## 📋 Pré-requisitos (Windows)

### 1. Instalar Docker Desktop
1. Baixe: https://www.docker.com/products/docker-desktop/
2. Instale o Docker Desktop
3. Reinicie o computador se pedido
4. Abra Docker Desktop (deve aparecer um ícone de baleia)
5. ✅ Verifique se está rodando (baleia no systray)

---

## 🚀 Setup COMPLETO em 3 Comandos!

### Opção A - Desenvolvimento (COM hot-reload)

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd completov2

# 2. Suba TUDO com Docker (PostgreSQL + Backend + Frontend)
docker-compose -f docker-compose.dev.yml up --build

# 3. Aguarde e acesse:
# http://localhost:5173 (Frontend)
# http://localhost:5000 (Backend API)
```

**Pronto! ✅ Tudo rodando!**

---

### Opção B - Apenas Infraestrutura (Banco de Dados)

Se você quer rodar backend e frontend manualmente:

```bash
# 1. Subir apenas PostgreSQL, Redis, etc
docker-compose up -d

# 2. Instalar dependências localmente
npm install
cd web && npm install && cd ..

# 3. Configurar .env
copy .env.example .env

# 4. Criar tabelas
npx prisma generate
npx prisma db push

# 5. Rodar backend (terminal 1)
npm run dev

# 6. Rodar frontend (terminal 2)
cd web
npm run dev
```

---

## 📦 O que o Docker vai criar:

```
✅ PostgreSQL   → localhost:5432  (Banco de dados)
✅ Redis        → localhost:6379  (Cache)
✅ Qdrant       → localhost:6333  (Vector DB para AI)
✅ MinIO        → localhost:9000  (Storage)
                  localhost:9001  (MinIO Console)
✅ Backend      → localhost:5000  (API)
✅ Frontend     → localhost:5173  (Interface)
```

---

## 🎯 Comandos Úteis

### Ver logs em tempo real:
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

### Ver apenas logs do backend:
```bash
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Parar tudo:
```bash
docker-compose -f docker-compose.dev.yml down
```

### Parar e apagar dados (⚠️ cuidado!):
```bash
docker-compose -f docker-compose.dev.yml down -v
```

### Reiniciar apenas um serviço:
```bash
docker-compose -f docker-compose.dev.yml restart backend
```

### Executar comandos dentro do container:
```bash
# Prisma migrate
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# Acessar PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d omni_platform

# Shell do backend
docker-compose -f docker-compose.dev.yml exec backend sh
```

---

## 🔄 Primeiro Uso (Setup Inicial)

### 1. Subir containers:
```bash
docker-compose -f docker-compose.dev.yml up -d postgres redis qdrant minio
```

### 2. Aguardar PostgreSQL ficar pronto:
```bash
docker-compose -f docker-compose.dev.yml logs postgres
# Aguarde ver: "database system is ready to accept connections"
```

### 3. Aplicar migrations:
```bash
docker-compose -f docker-compose.dev.yml exec backend npx prisma db push
```

### 4. Subir backend e frontend:
```bash
docker-compose -f docker-compose.dev.yml up backend frontend
```

---

## 🐛 Troubleshooting

### ❌ "Cannot connect to Docker daemon"
- Abra Docker Desktop
- Aguarde iniciar completamente
- Verifique ícone da baleia no systray

### ❌ "Port already in use"
```bash
# Parar containers antigos
docker-compose -f docker-compose.dev.yml down

# Ver o que está usando a porta
netstat -ano | findstr :5000
netstat -ano | findstr :5432

# Matar processo (substitua PID)
taskkill /PID <numero> /F
```

### ❌ "No space left on device"
```bash
# Limpar imagens antigas
docker system prune -a

# Remover volumes não usados
docker volume prune
```

### ❌ Backend não conecta no banco
```bash
# Verificar se postgres está rodando
docker-compose -f docker-compose.dev.yml ps

# Ver logs do postgres
docker-compose -f docker-compose.dev.yml logs postgres

# Recriar containers
docker-compose -f docker-compose.dev.yml up -d --force-recreate postgres
```

### ❌ "Module not found" no container
```bash
# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build

# Ou forçar rebuild
docker-compose -f docker-compose.dev.yml build --no-cache backend
```

---

## 💡 Dicas

### Hot Reload Funcionando?
✅ Sim! Quando você editar arquivos, o container vai recarregar automaticamente.

### Como acessar pgAdmin?
```bash
# Adicione ao docker-compose.dev.yml:
  pgadmin:
    image: dpage/pgadmin4
    container_name: completov2-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    networks:
      - completov2
```

Depois: http://localhost:5050

### Como ver o banco?
```bash
# Via terminal
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d omni_platform

# Ver tabelas
\dt

# Ver dados
SELECT * FROM "User";

# Sair
\q
```

### Como executar testes?
```bash
docker-compose -f docker-compose.dev.yml exec backend npm test
```

---

## 🎨 Diferentes Ambientes

### Desenvolvimento (com hot-reload):
```bash
docker-compose -f docker-compose.dev.yml up
```

### Produção:
```bash
docker-compose -f docker-compose.production.yml up -d
```

### Apenas infraestrutura:
```bash
docker-compose up -d
```

---

## ✅ Checklist Rápido

1. [ ] Docker Desktop instalado e rodando
2. [ ] Repositório clonado
3. [ ] Executou `docker-compose -f docker-compose.dev.yml up --build`
4. [ ] Aguardou todos os containers iniciarem
5. [ ] Acessou http://localhost:5173
6. [ ] Consegue fazer login

---

## 🚀 Workflow Diário

```bash
# Manhã - Iniciar projeto
docker-compose -f docker-compose.dev.yml up

# Durante o dia - Editar código
# (hot-reload automático!)

# Final do dia - Parar tudo
docker-compose -f docker-compose.dev.yml down

# Ou deixar rodando em background
docker-compose -f docker-compose.dev.yml up -d
```

---

## 📊 Comparação

| Método | Vantagens | Desvantagens |
|--------|-----------|--------------|
| **Docker Completo** | ✅ Setup em 1 comando<br>✅ Tudo isolado<br>✅ Mesmas versões sempre | ⚠️ Usa mais RAM<br>⚠️ Build inicial lento |
| **Docker Apenas DB** | ✅ Rápido<br>✅ Fácil debugar | ⚠️ Precisa instalar Node local |
| **Manual** | ✅ Total controle | ⚠️ Instalar tudo<br>⚠️ Configurar tudo |

---

## 🎉 Recomendação

**Para Windows:** Use **Docker Completo** (Opção A)
- ✅ Não precisa instalar PostgreSQL
- ✅ Não precisa instalar Redis
- ✅ Não precisa configurar nada
- ✅ Funciona em qualquer PC
- ✅ Um comando e pronto!

---

**Pronto para começar?**

```bash
docker-compose -f docker-compose.dev.yml up --build
```

**🎊 Aguarde 2-3 minutos e acesse: http://localhost:5173**

---

**Perguntas? Me avise! 😊**
