<div align="center">
  <h1>Lead Prospector WhatsApp</h1>
  <p><strong>Plataforma SaaS Open Source para Prospecção B2B Ética via WhatsApp</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Node.js-20_LTS-339933?logo=node.js&logoColor=white" alt="Node.js">
    <img src="https://img.shields.io/badge/TypeScript-5-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white" alt="Fastify">
    <img src="https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white" alt="Prisma">
    <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React">
    <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white" alt="Docker">
    <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  </p>
  <p>
    <a href="#visão-geral">Visão Geral</a> •
    <a href="#arquitetura">Arquitetura</a> •
    <a href="#stack">Stack</a> •
    <a href="#instalação">Instalação</a> •
    <a href="#deploy">Deploy</a> •
    <a href="#api">API</a> •
    <a href="#licença">Licença</a>
  </p>
  <br>
</div>

---

## Visão Geral

**Lead Prospector WhatsApp** é uma plataforma completa para captura, enriquecimento e automação de comunicação com leads B2B via WhatsApp. Construída com Clean Architecture, TypeScript strict mode e design modular, permite deploy self-hosted com suporte a múltiplos provedores WhatsApp e multi-tenant nativo.

### 🔑 Funcionalidades Principais

| Módulo | Descrição |
|--------|-----------|
| **Scraping** | Captura de leads públicos via Google Business e LinkedIn com parsing inteligente |
| **Enriquecimento** | Validação de email/telefone, deduplicação, lead scoring automatizado (0–100) |
| **Campanhas** | Criação de campanhas com templates, filas BullMQ e agendamento |
| **WhatsApp** | Envio e recebimento via WAHA, com gerenciamento de sessões e QR Code |
| **Dashboard** | Métricas em tempo real com gráficos e indicadores de performance |
| **LGPD** | Consentimento, opt-out, anonimização e auditoria completa |
| **Multi-tenant** | Isolamento por tenant via AsyncLocalStorage |
| **Automação** | Integração com n8n para workflows low-code |
| **Auth** | Autenticação híbrida API Key + JWT com usuários no banco |
| **Frontend** | SPA React com Vite, Tailwind CSS e navegação por sidebar |

---

## Arquitetura

```
┌──────────────────────────────────────────────────┐
│                 Presentation Layer                 │
│         Fastify Routes / React SPA (web/)          │
├──────────────────────────────────────────────────┤
│              Application Layer                      │
│          Services / Use Cases / DTOs               │
├──────────────────────────────────────────────────┤
│                Domain Layer                         │
│       Entities / Types / Business Rules            │
├──────────────────────────────────────────────────┤
│                Infra Layer                          │
│   Prisma / Redis / BullMQ / WAHA / Pino Logger     │
└──────────────────────────────────────────────────┘
```

**Princípios:** SOLID, Clean Architecture, Dependency Injection, Repository Pattern, Provider Abstraction (WhatsApp interface plugável).

---

## Stack

<div align="center">

| Camada | Tecnologia | Propósito |
|--------|-----------|-----------|
| **Runtime** | Node.js 20 LTS | Plataforma de execução |
| **Linguagem** | TypeScript 5 (strict) | Tipagem estática |
| **API** | Fastify 5 | HTTP framework performático |
| **ORM** | Prisma 5 | Type-safe database access |
| **Banco** | PostgreSQL 16 | Dados relacionais |
| **Cache/Filas** | Redis 7 + BullMQ | Cache, rate limit, job queue |
| **WhatsApp** | WAHA HTTP API | Bridge WhatsApp |
| **Automação** | n8n | Workflows low-code |
| **Scraping** | Puppeteer + Cheerio | Extração de dados públicos |
| **Frontend** | React 19 + Vite + Tailwind | Interface administrativa |
| **Monitoramento** | Prometheus + Grafana | Métricas e dashboards |
| **Logs** | Pino | Logging estruturado |
| **Testes** | Vitest | Testes unitários e integração |
| **Container** | Docker + Compose | Ambiente reproduzível |
| **CI/CD** | GitHub Actions | Integração contínua |

</div>

---

## Instalação

### Pré-requisitos

- Node.js 20+, NPM 10+
- Docker & Docker Compose
- Git

### Setup rápido

```bash
# Clone
git clone https://github.com/GEOCITIES-BR/lead-prospector-whatsapp.git
cd lead-prospector-whatsapp

# Dependências
npm install

# Ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Prisma
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

# Desenvolvimento
npm run dev
```

Acesse **http://localhost:3000/health** — backend pronto.  
Login padrão: `admin@leadprospector.app` / `admin`

### Frontend

```bash
cd web
npm install
npm run dev
```

Acesse **http://localhost:5173** — interface administrativa.

### Conexão Frontend ↔ Backend

#### Cenário 1 — Local (npm run dev)

```
Browser → localhost:5173
  → Vite proxy: /api/* → http://localhost:3000
  → axios baseURL: /api
  → Sem CORS (proxy resolve na mesma origem)
```

#### Cenário 2 — Docker dev (docker compose up)

```
Browser → localhost:5173 (container web)
  → Vite proxy: /api/* → http://app:3000 (DNS interno Docker)
  → docker-compose.yml seta VITE_PROXY_TARGET=http://app:3000
  → Zero configuração manual
```

#### Cenário 3 — Produção / VPS (docker compose -f docker-compose.prod.yml)

```
Browser → http://seudominio.com
  → nginx serve arquivos estáticos (dist/)
  → nginx proxy: /api/* → http://app:3000
  → SPA routing: try_files $uri /index.html
```

Em qualquer cenário, `web/src/lib/api.ts` (axios) injeta o token JWT automaticamente e redireciona para `/login` em caso de 401. O backend permite a origem via `CORS_ORIGIN` no `.env`.

---

## Docker

### Desenvolvimento

```bash
docker compose up -d
```

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| `app` | 3000 | API Fastify |
| `web` | 5173 | Frontend React (Vite dev, proxy /api → app:3000) |
| `postgres` | 5432 | Banco de dados |
| `redis` | 6379 | Cache e filas |
| `waha` | 3002 | WhatsApp HTTP API |

### Produção / VPS

```bash
docker compose -f docker/docker-compose.prod.yml up -d
docker compose exec app npx prisma migrate deploy
```

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| `app` | 3000 | API Fastify |
| `web` | 80 | Frontend React (nginx, estático, proxy /api → app) |
| `postgres` | 5432 | Banco (apenas localhost) |
| `redis` | 6379 | Cache |
| `waha` | 3002 | WhatsApp (apenas localhost) |
| `n8n` | 5678 | Automação (apenas localhost) |

### Staging

```bash
docker compose -f docker/docker-compose.staging.yml up -d
```

### Comandos úteis

```bash
docker compose logs -f app   # Logs da aplicação
docker compose down          # Parar serviços
docker compose build         # Reconstruir imagens
docker compose down -v       # Reset completo (DADOS SERÃO PERDIDOS)
```

### Variáveis obrigatórias

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=senha-forte-aleatoria
REDIS_PASSWORD=senha-forte
WAHA_API_KEY=senha-forte
AUTH_EMAIL=admin@seudominio.com
AUTH_PASSWORD=senha-segura
CORS_ORIGIN=http://seudominio.com
```

### Scripts auxiliares

| Script | Descrição |
|--------|-----------|
| `scripts/deploy.sh` | Deploy automatizado com rollback |
| `scripts/backup.sh` | Backup do banco PostgreSQL (retenção 7 dias) |
| `scripts/restore.sh` | Restauração de backup |
| `scripts/seed-admin.ts` | Cria/atualiza usuário admin |
| `scripts/generate-api-key.ts` | Gera chave de API |
| `scripts/seed-api-key.ts` | Persiste chave de API no banco |
| `scripts/monitoring-setup.sh` | Configura Prometheus + Grafana |

---

## API

### Endpoints públicos

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/lgpd/opt-out` | Solicitar opt-out |
| `POST` | `/api/lgpd/consent` | Registrar consentimento |
| `GET` | `/api/metrics` | Métricas Prometheus |

### Autenticação

```bash
# Login → JWT
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@leadprospector.app","password":"admin"}'

# Rotas protegidas — use Bearer ou X-API-Key
curl http://localhost:3000/api/leads \
  -H "Authorization: Bearer <seu-jwt>"

curl http://localhost:3000/api/leads \
  -H "X-API-Key: lp_<sua-chave>"
```

### Endpoints protegidos

| Módulo | Endpoints |
|--------|-----------|
| **Leads** | `GET/POST /api/leads`, `GET/PUT/DELETE /api/leads/:id` |
| **Campanhas** | `GET/POST /api/campaigns`, `POST /api/campaigns/:id/start` |
| **Templates** | `GET/POST /api/templates`, `GET/PUT/DELETE /api/templates/:id` |
| **WhatsApp** | `POST /api/whatsapp/send`, `POST /api/whatsapp/session/start`, `POST /api/whatsapp/session/stop`, `GET /api/whatsapp/session/status`, `GET /api/whatsapp/session/qrcode` |
| **Dashboard** | `GET /api/dashboard/overview`, `/leads/sources`, `/leads/status`, `/leads/scores`, `/campaigns/performance`, `/messages/timeline`, `/leads/recent` |
| **Enriquecimento** | `POST /api/enrich/lead/:id`, `POST /api/enrich/batch`, `GET /api/dedup` |
| **LGPD** | `POST /api/lgpd/opt-out`, `POST /api/lgpd/consent`, `DELETE /api/lgpd/lead/:id`, `GET /api/lgpd/lead/:id/export`, `GET /api/lgpd/lead/:id/consent-history` |
| **Auth** | `POST /api/auth/login`, `GET/POST/DELETE /api/auth/api-keys` |
| **Tenants** | `GET/POST /api/tenants`, `GET /api/tenants/:id` |

---

## Monitoramento

### Prometheus + Grafana

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3001 (admin/admin)
- **Dashboard:** Configurado automaticamente via provisioning

Métricas disponíveis: requisições por segundo, latência (P50/P95/P99), taxa de erro, uso de memória/CPU, filas BullMQ, status WAHA.

---

## Segurança & LGPD

- ✅ Consentimento explícito com log de auditoria
- ✅ Opt-out imediato com bloqueio permanente
- ✅ Anonimização de dados sob demanda
- ✅ Coleta restrita a dados públicos
- ✅ Rate limiting (100 req/min por IP)
- ✅ Validação de entrada com Zod
- ✅ CORS restrito configurável
- ✅ Auth híbrida (API Key + JWT)
- ✅ Multi-tenant com isolamento de dados

---

## Testes

```bash
# Unitários (152 testes, 18 suites)
npm test

# Integração (requer banco PostgreSQL rodando)
npx vitest run --config vitest.integration.ts

# Cobertura
npx vitest run --coverage
```

CI via GitHub Actions executa lint, typecheck e testes a cada push.

---

## Estrutura do Projeto

```
├── config/              # Validação de ambiente (Zod)
├── docker/              # Dockerfiles, Compose, Prometheus, Grafana
├── docs/                # Documentação detalhada
├── n8n-workflows/       # Workflows n8n pré-construídos
├── prisma/              # Schema e seed
├── scripts/             # Deploy, backup, restore, admin
├── src/
│   ├── api/             # Fastify server, middlewares, rotas
│   ├── infra/           # Database, cache, logger
│   ├── integrations/    # WAHA client
│   ├── modules/         # Módulos funcionais (DDD)
│   │   ├── auth/        # Autenticação (JWT + API Key)
│   │   ├── campaign/    # Campanhas
│   │   ├── dashboard/   # Métricas
│   │   ├── enrichment/  # Scoring, validação, dedup
│   │   ├── lgpd/        # LGPD, consentimento, opt-out
│   │   ├── message/     # Mensagens WhatsApp
│   │   ├── n8n/         # Webhooks n8n
│   │   ├── scraping/    # Google Business, LinkedIn
│   │   ├── template/    # Templates de mensagens
│   │   └── tenant/      # Multi-tenant
│   └── shared/          # Erros, tipos, utils
├── tests/               # Testes unitários e integração
└── web/                 # Frontend React + Vite + Tailwind
```

---

## Contribuição

1. Fork o projeto
2. Crie sua branch: `git checkout -b feat/nova-funcionalidade`
3. Commit semântico: `git commit -m "feat: adiciona ..."`
4. Push: `git push origin feat/nova-funcionalidade`
5. Abra um Pull Request

**Padrão:** `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`

---

## Licença

MIT © [GeoCities](https://github.com/GEOCITIES-BR)

---

<div align="center">
  <sub>Feito com 💚 pela <strong>GeoCities</strong></sub>
  <br>
  <sub>Lead Prospector WhatsApp v1.0.0</sub>
</div>
