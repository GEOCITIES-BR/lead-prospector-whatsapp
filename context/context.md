# Contexto do Projeto — Lead Prospector WhatsApp

## Status Atual
**Pós-roadmap — melhorias concluídas** (estável, pronto para produção)

## Etapa Atual
Todas as fases do ROADMAP + 5 melhorias pós-roadmap concluídas. Projeto em estado de manutenção/operação.

## Concluído

### FASE 0 — Arquitetura
- [x] Estrutura de diretórios criada
- [x] context/context.md, ROADMAP.md, ARCHITECTURE.md criados
- [x] .env.example, .env.*.example, .gitignore
- [x] Zod schema + validador de ambiente
- [x] Tipos compartilhados, erros, utilitários
- [x] WhatsAppProvider interface + MockProvider
- [x] ADRs registrados

### FASE 1 — Fundação
- [x] Node.js 20 + TypeScript strict mode + Fastify 5
- [x] Prisma ORM (5 modelos), Docker Compose, Dockerfile
- [x] ESLint, Prettier, Husky, GitHub Actions
- [x] tsconfig strict, vitest configurado
- [x] 7 testes iniciais passando

### FASE 2 — Banco de Dados
- [x] Schema Prisma: Lead, Campaign, Message, Conversao, WhatsAppSession
- [x] Prisma Client gerado, seed criado
- [x] Infra: prisma-client singleton, redis-client, logger (Pino)

### FASE 3 — Google Business Scraper
- [x] Interface genérica `Scraper<TInput, TOutput>`
- [x] RateLimiter com sliding window
- [x] Tipos, Parser, Scraper, Service, Router Google Business
- [x] 24 testes

### FASE 4 — LinkedIn Scraper
- [x] Tipos específicos, Session Manager, Parser, Scraper (Puppeteer + anti-detection)
- [x] LinkedInService + rotas
- [x] 17 testes

### FASE 5 — Enriquecimento & Lead Scoring
- [x] EmailValidator, PhoneValidator, Deduplicator, LeadScorer
- [x] EnrichmentService + rotas
- [x] 29 testes

### FASE 6 — WAHA Provider & WhatsApp Integration
- [x] WahaSessionManager, MessageService, WhatsApp Router
- [x] 6 testes

### FASE 7 — Sistema de Templates
- [x] Modelo Template, TemplateService (CRUD + preview + apply)
- [x] Rotas + seed atualizado
- [x] 16 testes

### FASE 8 — Campanhas & Scheduling
- [x] Modelo CampaignLead, CampaignService (CRUD + leads + execute + schedule)
- [x] Rotas completas
- [x] 13 testes

### FASE 9 — Integração n8n
- [x] N8nService (5 handlers + webhooks), rotas, tipos
- [x] 11 testes

### FASE 10 — Dashboard
- [x] DashboardService (7 agregações), rotas
- [x] 9 testes

### LGPD + Opt-Out
- [x] Modelo ConsentLog, LgpdService (opt-out, consent, delete, export, history)
- [x] Rotas públicas (opt-out, consent) e protegidas (delete, export, history)
- [x] Bloqueio de envio para leads opt-out
- [x] 15 testes

### n8n Workflows (importáveis)
- [x] 5 workflows JSON validados

### FASE 12 — Deploy
- [x] Dockerfiles dev/prod com HEALTHCHECK, docker-compose dev/prod/staging/monitoring
- [x] Scripts: deploy, backup, restore, monitoring-setup, seed
- [x] CI via GitHub Actions, .dockerignore, ARCHITECTURE.md com runbooks

### Multi-tenant (pós-roadmap)
- [x] Modelo `Tenant` no Prisma schema + `tenantId` em Lead, Campaign, Template, Message, ApiKey
- [x] `TenantContext` via AsyncLocalStorage (`getCurrentTenantId()` fallback `'default'`)
- [x] `TenantService` (create, list, getById, getBySlug)
- [x] `TenantRouter` (POST/GET /api/tenants, GET /api/tenants/:id)
- [x] 10 serviços alterados para chamar `getCurrentTenantId()`
- [x] `prisma/seed.ts` — upsert tenant 'default' antes dos seeds

### Autenticação (API Key + JWT híbrido)
- [x] Modelo `ApiKey` no Prisma schema + generated
- [x] `AuthService`: login (DB + fallback env vars), signJwt/verifyJwt (jsonwebtoken), create/list/revoke ApiKey, validateApiKey, authenticate híbrido
- [x] `AuthRouter`: POST /api/auth/login, POST/GET /api/auth/api-keys, DELETE /api/auth/api-keys/:id
- [x] Global `preHandler` em app.ts — auth em todas rotas exceto públicas (health, lgpd/opt-out, lgpd/consent, metrics)
- [x] Modelo `User` no Prisma + seed admin (`admin@leadprospector.app` / `admin`)
- [x] Scripts: `scripts/seed-admin.ts`, `scripts/generate-api-key.ts`, `scripts/seed-api-key.ts`
- [x] Env vars: JWT_SECRET, AUTH_EMAIL, AUTH_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD

### Frontend (React + Vite + Tailwind)
- [x] Scaffold em `web/` com Vite 8, React 19, TypeScript, Tailwind v4
- [x] AuthContext (login + token no localStorage), axios com interceptors (Bearer + 401 redirect)
- [x] Páginas: Login, Dashboard (cards), Leads (tabela), Campaigns, Templates, Messages
- [x] Layout com sidebar de navegação + botão Sair
- [x] `vite.config.ts` com proxy `/api` configurável via `VITE_PROXY_TARGET`
- [x] `Dockerfile.dev` (Vite dev server) + `Dockerfile.prod` (nginx multi-stage)
- [x] `nginx.conf` — proxy reverso `/api` → `app:3000`, SPA fallback
- [x] `docker-compose.yml` — serviço `web` com `VITE_PROXY_TARGET=http://app:3000`
- [x] `docker/docker-compose.prod.yml` — serviço `web` (nginx, porta 80)

### Testes de Integração
- [x] `vitest.integration.ts` — config separada
- [x] `tests/integration/setup.ts` — setupTestDB (prisma db push --force-reset) + teardown
- [x] 3 suítes: health, api-auth, lgpd

### Monitoramento (Prometheus + Grafana)
- [x] Plugin `fastify-metrics` registrado com endpoint `/metrics`
- [x] `docker/prometheus/prometheus.yml` — scrape app:3000 a cada 15s
- [x] `docker/grafana/` — datasources.yml, dashboard.yml, dashboards/lead-prospector.json
- [x] `docker/docker-compose.monitoring.yml` — Prometheus (9090) + Grafana (3001)

### Conexão Frontend ↔ Backend (3 cenários)
- [x] Local (`npm run dev`): Vite proxy → localhost:3000
- [x] Docker dev (`docker compose up`): Vite proxy → app:3000 (DNS interno)
- [x] Produção/VPS (docker-compose.prod.yml): nginx serve estáticos + proxy /api → app:3000

### Outros
- [x] README redesenhado (estiloso + corporativo, badges, tabelas)
- [x] tsconfig.json inclui `tests/`, `scripts/`, `vitest.*.ts`
- [x] `.eslintrc.json` ignorePatterns inclui `web/`
- [x] 152 testes unitários, TypeScript strict zero erros, frontend build OK

## Pendências
- CI workflow não enviado ao GitHub (token sem escopo `workflow`)

## Decisões Técnicas

### ADR-006 a ADR-011 — (mantidos do roadmap anterior)

### ADR-012: Auth híbrido sem Fastify plugin
**Contexto:** Necessário autenticar rotas via API Key (scripts/n8n) e JWT (frontend).
**Decisão:** `jsonwebtoken` + validação manual no preHandler. `@fastify/jwt` removido.
**Consequências:** Menos acoplamento ao ciclo de vida do Fastify, implementação explícita.

### ADR-013: Multi-tenant com AsyncLocalStorage
**Contexto:** Dados precisam ser isolados por tenant sem poluir assinaturas de método.
**Decisão:** `AsyncLocalStorage` nativo do Node.js. Tenant resolvido no contexto da requisição, fallback `'default'` para scripts/seed.
**Consequências:** Zero invasão em serviços, isolamento por request.

### ADR-014: Frontend em diretório separado com proxy Vite
**Contexto:** SPA precisa consumir API em dev (sem CORS) e em prod (com proxy reverso).
**Decisão:** `web/` com Vite proxy configurável via `VITE_PROXY_TARGET`. Dockerfile.prod com nginx multi-stage.
**Consequências:** Três cenários funcionam sem alteração de código (local, Docker dev, VPS).

### ADR-015: Login híbrido (DB + env var fallback)
**Contexto:** Usuário admin precisa existir no banco, mas setup inicial não deve depender de seed.
**Decisão:** AuthService.login() busca usuário no banco primeiro; se não encontrado, fallback para AUTH_EMAIL/AUTH_PASSWORD.
**Consequências:** Compatibilidade retroativa, seed opcional, admin funcional desde o primeiro deploy.

## Problemas Encontrados

1. **`verifyPassword` destructuring bug** — `const [, algo, ...]` pulava o primeiro elemento, invertendo os campos. Solução: `const [algo, ...]`.
2. **`react-router-dom` v7 incompatível** — npm install corrompido (faltavam `.d.ts`). Solução: `rimraf node_modules package-lock.json && npm install`.
3. **GitHub push sem escopo `workflow`** — CI workflow rejeitado. Solução: remover do commit inicial, adicionar em commit separado; pendente autorização do escopo.

## Próximos Passos
- Autorizar escopo `workflow` no GitHub (`gh auth refresh --hostname github.com --scopes workflow`) e fazer push do CI
- Pipeline de CI/CD completo com deploy automatizado
- Testes de integração em ambiente Docker
- Onboarding multi-tenant via UI
