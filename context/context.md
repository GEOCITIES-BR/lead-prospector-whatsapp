# Contexto do Projeto — Lead Prospector WhatsApp

## Status Atual
**FASE 12 — Deploy** (concluída)

## Etapa Atual
Todas as fases do ROADMAP concluídas. Projeto pronto para uso em produção.

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
- [x] Interface genérica `Scraper<TInput, TOutput>` (`src/modules/scraping/scraper.interface.ts`)
- [x] RateLimiter com sliding window (`src/modules/scraping/rate-limiter.ts`)
- [x] Tipos, Parser, Scraper, Service, Router Google Business
- [x] Testes: 24 testes, 5 arquivos, 100% passando
- [x] TypeScript strict compilando sem erros

### FASE 4 — LinkedIn Scraper
- [x] Tipos específicos: `LinkedInSearchInput`, `LinkedInProfileResult`, `LinkedInScraperConfig`, `LinkedInCredentials` (`src/modules/scraping/linkedin/linkedin.types.ts`)
- [x] Session Manager: `LinkedInSessionManager` com login, cookies, check session (`src/modules/scraping/linkedin/linkedin.session.ts`)
- [x] Parser: `LinkedInParser` com parseSearchResults + parseHeadline (cargo/empresa) (`src/modules/scraping/linkedin/linkedin.parser.ts`)
- [x] Scraper: `LinkedInScraper` (Puppeteer + anti-detection: user-agent rotation, viewport, navigator.webdriver=false, languages, plugins)
  - Login opcional via credenciais
  - Auto-scroll com delay aleatório
  - Rate limiting + backoff exponencial
  - Validação de entrada
  - Deduplicação por perfil LinkedIn
- [x] Service: `LinkedInService` (orquestra scraper + save no banco com dedup por linkedin URL)
- [x] Rotas API: `POST /api/scrape/linkedin`, `POST /api/scrape/linkedin/login`, `GET /api/scrape/linkedin/status`
- [x] Registro no app Fastify (`src/api/app.ts`)
- [x] Testes: 17 testes (parser: 9, scraper: 8), totalizando 41 testes no projeto
- [x] TypeScript strict compilando sem erros

### FASE 5 — Enriquecimento & Lead Scoring
- [x] `EnrichmentLead`, `ValidationResult`, `ScoreConfig`, `DedupResult`, `BatchEnrichmentInput` types (`src/modules/enrichment/enrichment.types.ts`)
- [x] `EmailValidator` — syntax, disposable domain detection, TLD validation (`src/modules/enrichment/email-validator.ts`)
- [x] `PhoneValidator` — format normalization, BR mobile/fixo detection, formatação (`src/modules/enrichment/phone-validator.ts`)
- [x] `Deduplicator` — dedup por telefone (exato + overlap), email, LinkedIn URL, fuzzy nome (`src/modules/enrichment/deduplicator.ts`)
- [x] `LeadScorer` — completeness (30%), seniority keywords (CEO=20, diretor=15, etc), bonuses email/phone/linkedin/source, score 0-100 (`src/modules/enrichment/lead-scorer.ts`)
- [x] `EnrichmentService` — orquestra validação + dedup + score, atualiza lead no banco (`src/modules/enrichment/enrichment.service.ts`)
- [x] `EnrichmentRouter` — `POST /api/enrich/lead/:id`, `POST /api/enrich/batch`, `GET /api/dedup`, `GET /api/enrich/status`
- [x] Registro no app Fastify
- [x] Testes: 29 novos (email: 8, phone: 8, dedup: 6, scorer: 7), totalizando 70 testes no projeto
- [x] TypeScript strict compilando sem erros

### FASE 6 — WAHA Provider & WhatsApp Integration
- [x] `WahaSessionManager` — gerenciamento de sessões WAHA com persistência em DB (`src/providers/whatsapp/waha-session.ts`)
  - `start()` — cria sessão na WAHA + upsert no DB
  - `stop()` — deleta sessão na WAHA + atualiza DB
  - `getStatus()` — consulta status na WAHA + DB fallback
  - `getQrCode()` — obtém QR code + persiste no DB
  - Mapeamento de status WAHA (`WORKING`→connected, `SCAN_QR_CODE`→connecting, etc)
- [x] `MessageService` — envio de mensagens com persistência e tracking (`src/modules/message/message.service.ts`)
  - `send()` — valida lead, formata phone, cria msg no DB, envia via provider, atualiza status
  - Suporte a texto e imagem
  - Atualiza lead para `contacted` após envio bem-sucedido
  - Tratamento de erro com fallback para atualização de msg
- [x] WhatsApp Router (`src/modules/message/whatsapp.router.ts`):
  - `POST /api/whatsapp/send` — enviar mensagem
  - `POST /api/whatsapp/session/start` — iniciar sessão
  - `POST /api/whatsapp/session/stop` — encerrar sessão
  - `GET /api/whatsapp/session/status` — status da sessão
  - `GET /api/whatsapp/session/qrcode` — QR code
  - `GET /api/whatsapp/status` — health check
- [x] `WahaWhatsAppProvider` já existente — refatorado e integrado ao fluxo
- [x] Registro no app Fastify
- [x] Testes: 6 novos (message service com mocks), totalizando 76 testes no projeto
- [x] TypeScript strict compilando sem erros

### FASE 7 — Sistema de Templates
- [x] Modelo `Template` adicionado ao Prisma schema (`id, nome, conteudo, variaveis[]`) com relação `Campaign.templateId`
- [x] `TemplateService` — CRUD completo + extração automática de variáveis + interpolação + preview + apply com lead data (`src/modules/template/template.service.ts`)
  - `create()` — valida, extrai `{{variaveis}}` do conteúdo, salva
  - `update()` — atualiza parcialmente, mescla variáveis
  - `delete()` + `getById()` + `list()` — paginado
  - `preview()` — substitui `{{variavel}}` por dados, remove não substituídas
  - `applyTemplate()` — busca template + lead, faz merge com dados do lead
- [x] Rotas API (`src/modules/template/template.router.ts`):
  - `POST /api/templates` — criar
  - `GET /api/templates` — listar (paginado)
  - `GET /api/templates/:id` — obter por ID
  - `PUT /api/templates/:id` — atualizar
  - `DELETE /api/templates/:id` — deletar
  - `POST /api/templates/preview` — preview de conteúdo com dados
  - `POST /api/templates/apply` — aplicar template em lead real
- [x] Seed atualizado — cria template + campanha com templateId
- [x] Registro no app Fastify
- [x] Testes: 16 novos (extract, preview, create, list, getById, apply), totalizando 92 testes
- [x] TypeScript strict compilando sem erros

### FASE 8 — Campanhas & Scheduling
- [x] Modelo `CampaignLead` adicionado ao Prisma schema (junction table: leadId + campaignId, status, scheduledAt, sentAt, erro)
- [x] Enum `CampaignLeadStatus` (pending, scheduled, sent, failed, opted_out)
- [x] Relações atualizadas: `Lead.campanhas`, `Campaign.leads`, `CampaignLead.lead`, `CampaignLead.campaign`
- [x] `CampaignTypes` — `CreateCampaignInput`, `UpdateCampaignInput`, `CampaignConfig`, `DEFAULT_CAMPAIGN_CONFIG` (`src/modules/campaign/campaign.types.ts`)
- [x] `CampaignService` — CRUD completo + gerenciamento de leads na campanha + execução de disparo (`src/modules/campaign/campaign.service.ts`)
  - `create()` — valida nome + templateId, cria campanha
  - `update()` / `delete()` / `getById()` / `list()`
  - `addLeads()` — adiciona leads, skip duplicados
  - `removeLead()` — remove lead da campanha
  - `listLeads()` — lista leads da campanha com status
  - `execute()` — dispara template para leads pendentes via MessageService (até 50)
  - `schedule()` — agenda leads para data futura
- [x] Rotas API (`src/modules/campaign/campaign.router.ts`):
  - `POST /api/campaigns` — criar
  - `GET /api/campaigns` — listar
  - `GET /api/campaigns/:id` — obter com template + contagens
  - `PUT /api/campaigns/:id` — atualizar
  - `DELETE /api/campaigns/:id` — deletar (limpa relations)
  - `POST /api/campaigns/:id/leads` — adicionar leads
  - `GET /api/campaigns/:id/leads` — listar leads da campanha
  - `DELETE /api/campaigns/:id/leads/:leadId` — remover lead
  - `POST /api/campaigns/:id/schedule` — agendar
  - `POST /api/campaigns/:id/execute` — executar disparo
- [x] Registro no app Fastify
- [x] Testes: 13 novos (create, getById, list, addLeads, delete, schedule), totalizando 105 testes
- [x] TypeScript strict compilando sem erros

### FASE 9 — Integração n8n
- [x] `N8nService` — handlers para ações via webhook (`src/modules/n8n/n8n.service.ts`)
  - `handleSendMessage()` — envia mensagem via MessageService
  - `handleScrapeGoogle()` — dispara scraping Google Business
  - `handleScrapeLinkedin()` — dispara scraping LinkedIn
  - `handleEnrichLead()` — enriquece lead com score + validações
  - `handleCreateLead()` — cria lead a partir de dados do n8n
  - `configureWahaWebhooks()` — configura webhooks WAHA para apontar ao n8n
- [x] Rotas API (`src/modules/n8n/n8n.router.ts`):
  - `POST /api/n8n/send-message` — enviar mensagem
  - `POST /api/n8n/scrape-google` — scraping Google
  - `POST /api/n8n/scrape-linkedin` — scraping LinkedIn
  - `POST /api/n8n/enrich-lead` — enriquecer lead
  - `POST /api/n8n/create-lead` — criar lead
  - `POST /api/n8n/configure-webhooks` — configurar webhooks WAHA
  - `POST /api/n8n/webhooks/waha` — receptor de webhooks WAHA
  - `GET /api/n8n/status` — health check do módulo
- [x] Tipos: `N8nSendMessagePayload`, `N8nScrapeGooglePayload`, `N8nScrapeLinkedinPayload`, `N8nEnrichLeadPayload`, `N8nCreateLeadPayload`, `N8nWebhookConfig`, `N8nEvent`, `N8N_EVENTS` (`src/modules/n8n/n8n.types.ts`)
- [x] Registro no app Fastify
- [x] Testes: 11 novos, totalizando 116 testes (15 arquivos)
- [x] TypeScript strict compilando sem erros

### FASE 10 — Dashboard
- [x] Tipos: `DashboardOverview`, `LeadSourceItem`, `LeadStatusItem`, `ScoreDistribution`, `LeadScoreData`, `CampaignPerformanceItem`, `MessageTimelineItem` (`src/modules/dashboard/dashboard.types.ts`)
- [x] `DashboardService` — 7 métodos de agregação (`src/modules/dashboard/dashboard.service.ts`):
  - `getOverview()` — totalLeads, totalCampanhas, totalMensagens, totalTemplates, leadsContacted, leadsPendentes, taxaConversao
  - `getLeadSources()` — distribuição por origem (raw SQL)
  - `getLeadStatus()` — distribuição por status (raw SQL)
  - `getLeadScores()` — média, min, max + distribuição em faixas 0-25/26-50/51-75/76-100 (raw SQL)
  - `getCampaignPerformance()` — por campanha: total, enviados, falhos, pendentes, taxaSucesso (raw SQL)
  - `getMessageTimeline(days)` — mensagens por dia nos últimos N dias (raw SQL)
  - `getRecentLeads(limit)` — últimos leads criados
- [x] Rotas API (`src/modules/dashboard/dashboard.router.ts`):
  - `GET /api/dashboard/overview` — visão geral
  - `GET /api/dashboard/leads/sources` — fontes dos leads
  - `GET /api/dashboard/leads/status` — status dos leads
  - `GET /api/dashboard/leads/scores` — distribuição de scores
  - `GET /api/dashboard/campaigns/performance` — performance de campanhas
  - `GET /api/dashboard/messages/timeline` — timeline de mensagens (query: ?days=7)
  - `GET /api/dashboard/leads/recent` — leads recentes (query: ?limit=5)
- [x] Registro no app Fastify
- [x] Testes: 9 novos, totalizando 124 testes (16 arquivos)
- [x] TypeScript strict compilando sem erros

### LGPD + Opt-Out
- [x] Modelo `ConsentLog` adicionado ao Prisma schema (`id, leadId, tipo, descricao, ip, createdAt`) + relação em Lead
- [x] `LgpdService` (`src/modules/lgpd/lgpd.service.ts`):
  - `optOut()` — busca lead por telefone ou email, atualiza status para `opt_out`, cancela campanhas pendentes, registra log
  - `registerConsent()` — registra consentimento (status `validated`) ou revogação (status `opt_out`)
  - `deleteLead()` — right to deletion: remove lead + mensagens + consentimento + conversões + campanhas (transaction)
  - `exportLead()` — right to portability: retorna lead + mensagens + consentimento
  - `getConsentHistory()` — retorna log de consentimento do lead
- [x] Rotas API (`src/modules/lgpd/lgpd.router.ts`):
  - `POST /api/lgpd/opt-out` — opt-out por telefone ou email
  - `POST /api/lgpd/consent` — registrar consentimento (captura IP automaticamente)
  - `DELETE /api/lgpd/lead/:id` — right to deletion
  - `GET /api/lgpd/lead/:id/export` — right to portability
  - `GET /api/lgpd/lead/:id/consent-history` — histórico de consentimento
- [x] `MessageService.send()` atualizado — bloqueia envio se lead.status === `opt_out`
- [x] Registro no app Fastify
- [x] Testes: 15 novos (LGPD: 11, opt-out no message: 1, mock: 2), totalizando 138 testes (17 arquivos)
- [x] TypeScript strict compilando sem erros

### n8n Workflows (importáveis)
- [x] `n8n-workflows/01-google-scraper-to-whatsapp.json` — Google Maps → Enriquecer → IF score > 50 → WhatsApp
- [x] `n8n-workflows/02-linkedin-scraper-to-whatsapp.json` — LinkedIn → Enriquecer → IF score > 60 → WhatsApp
- [x] `n8n-workflows/03-webhook-create-lead.json` — Webhook externo → Criar Lead → Enriquecer → Responder
- [x] `n8n-workflows/04-campaign-executor.json` — Schedule (1h) → Listar campanhas ativas → Executar
- [x] `n8n-workflows/05-waha-inbound-webhook.json` — Webhook WAHA → IF texto → Responder automaticamente
- [x] Todos os JSONs validados (5/5 válidos)

### FASE 12 — Deploy
- [x] `.dockerignore` criado
- [x] Root `Dockerfile` removido (duplicado de `docker/Dockerfile.prod`)
- [x] `docker/Dockerfile.dev` atualizado com HEALTHCHECK
- [x] `docker/Dockerfile.prod` atualizado com HEALTHCHECK + curl
- [x] `docker-compose.yml` — dev stack completo (PG, Redis, WAHA, hot reload)
- [x] `docker/docker-compose.prod.yml` — produção (app, PG, Redis, WAHA, n8n, logging, restart)
- [x] `docker/docker-compose.staging.yml` — staging com portas alternadas
- [x] `docker/docker-compose.monitoring.yml` — backup + watchtower opcionais
- [x] `docker/.env.staging.example` — env template staging
- [x] `docker/.env.production.example` — env template produção
- [x] `docker/postgres/init/00-extensions.sql` — init script (uuid-ossp, pgcrypto)
- [x] `scripts/deploy.sh` — deploy automatizado (build, migrate, up, healthcheck)
- [x] `scripts/backup.sh` — pg_dump com retenção configurável
- [x] `scripts/restore.sh` — pg_restore a partir de arquivo .dump
- [x] `scripts/monitoring-setup.sh` — guia de monitoramento
- [x] `.github/workflows/ci.yml` — CI + Docker build/push para ghcr.io
- [x] `ARCHITECTURE.md` — runbooks de deploy, backup, restore, monitoramento
- [x] TypeScript strict compila sem erros
- [x] 138 testes passando

### Estrutura de diretórios preenchida
- [x] `docker/` — `Dockerfile.dev`, `Dockerfile.prod`, `docker-compose.override.yml.sample`, `docker-compose.prod.yml`
- [x] `n8n/` — `docker-compose.n8n.yml`, `init-data.sh`, `.env.example`
- [x] `scripts/` — `setup.sh`, `start-dev.sh`, `seed.sh`

## Pendências

### Próximos passos
- Nenhum — todas as fases do ROADMAP concluídas.

## Decisões Técnicas

### ADR-006: Interface genérica de Scraper
**Contexto:** Múltiplas fontes de dados (Google, LinkedIn) precisam de interface comum.
**Decisão:** Interface genérica `Scraper<TInput, TOutput>` com método `scrape()` e `validate()`.
**Consequências:** Cada fonte implementa a mesma interface; resultados padronizados.

### ADR-007: Rate Limiter com Sliding Window
**Contexto:** Scraping ético requer controle de taxa.
**Decisão:** Sliding window baseada em timestamps, não intervalos fixos.
**Consequências:** Previne rajadas, distribui requisições uniformemente.

### ADR-008: Parsing via JSON-LD + HTML
**Contexto:** Google Maps fornece dados em múltiplos formatos.
**Decisão:** Extrair JSON-LD (estruturado) + fallback para HTML (Cheerio).
**Consequências:** Mais dados capturados, redundância de fontes.

### ADR-009: Deduplicação híbrida
**Contexto:** Scraping pode encontrar o mesmo lead em múltiplas fontes.
**Decisão:** Dedup por nome (runtime) e por telefone (banco).
**Consequências:** Menos duplicatas, performance aceitável.

### ADR-010: Anti-detection via múltiplas técnicas
**Contexto:** LinkedIn possui anti-bot agressivo.
**Decisão:** Combinar rotação de user-agent, viewport fixo, override de navigator.webdriver, headers Accept-Language, delays aleatórios.
**Consequências:** Maior taxa de sucesso em scrapings autenticados.

### ADR-011: Scoring baseado em regras configuráveis
**Contexto:** Leads precisam ser priorizados por qualidade.
**Decisão:** Sistema de score 0-100 baseado em: completude dos dados (30%), senioridade do cargo (keywords: CEO=20, diretor=15, etc), validade de email/telefone, presença de LinkedIn, bônus por fonte de origem.
**Consequências:** Score reproduzível, ajustável via ScoreConfig, sem dependência de ML.

## Problemas Encontrados

1. **Cheerio v1 API changes** — `Cheerio<Element>` não expõe `.each()` ou `.toArray()` nos types. Solução: usar `.length` + índice numérico (`ArrayLike<T>`).
2. **RateLimiter lógica de primeira requisição** — O `requestCount >= maxRequests` após o incremento travava a primeira chamada. Solução: sliding window com filtro de timestamps.
3. **`maxResults: 0` falsy** — `if (input.maxResults && ...)` tratava 0 como undefined. Solução: `input.maxResults !== undefined`.
4. **DOM lib ausente** — tsconfig usa `lib: ["ES2022"]` (Node.js), sem tipos DOM. `window` e `navigator` em `page.evaluate` causam erro TS. Solução: `globalThis as Record<string, any>`.

## Próximos Passos

Projeto completo. Próximos passos sugeridos (fora do ROADMAP original):
- Adicionar autenticação (API key / JWT) nas rotas
- Frontend web (React/Vue)
- Pipeline de testes de integração com banco real
- Monitoramento avançado (Prometheus + Grafana)
- Onboarding multi-tenant
