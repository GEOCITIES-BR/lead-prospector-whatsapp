# Lead Prospector WhatsApp — Arquitetura e Runbooks

## Stack

| Camada       | Tecnologia                          |
|-------------|-------------------------------------|
| Runtime     | Node.js 20 + TypeScript (strict)   |
| Framework   | Fastify 5                           |
| ORM         | Prisma 5 + PostgreSQL 16            |
| Cache/Queue | Redis 7 + BullMQ                    |
| WhatsApp    | WAHA (WhatsApp HTTP API)            |
| Automação   | n8n                                 |
| Scraping    | Puppeteer + Cheerio                 |
| Testes      | Vitest                              |
| Infra       | Docker Compose                      |

## Ambientes

### Dev (localhost)
```bash
# Iniciar stack completa
docker compose up -d

# Rodar migrations + seed
npx prisma migrate dev
npx prisma db seed

# Logs do app
docker compose logs -f app
```

### Staging
```bash
# Preparar env
cp docker/.env.staging.example .env.staging
# Editar .env.staging com credenciais

# Deploy
./scripts/deploy.sh staging

# Logs
docker compose -f docker/docker-compose.staging.yml logs -f app
```

### Production
```bash
# Preparar env
cp docker/.env.production.example .env.production
# Editar .env.production com credenciais

# Deploy
./scripts/deploy.sh production

# Logs
docker compose -f docker/docker-compose.prod.yml logs -f app
```

## Scripts

| Script                    | Função                                    |
|---------------------------|-------------------------------------------|
| `scripts/setup.sh`        | Setup inicial (deps, build, test)         |
| `scripts/start-dev.sh`    | Inicia dev stack + migrations + seed      |
| `scripts/seed.sh`         | Aplica migrations + seed                  |
| `scripts/deploy.sh`       | Deploy completo (build, migrate, up)      |
| `scripts/backup.sh`       | Backup PostgreSQL (pg_dump custom format) |
| `scripts/restore.sh`      | Restore PostgreSQL                        |
| `scripts/monitoring-setup.sh` | Ativa monitoramento opcional          |

## Backup & Restore

### Backup manual
```bash
./scripts/backup.sh production
# Arquivo em docker/postgres/backup/lead_prospector_20250101_120000.dump
```

### Backup automático (cron 3h diário)
```bash
docker compose -f docker/docker-compose.prod.yml -f docker/docker-compose.monitoring.yml up -d backup
```

### Restore
```bash
./scripts/restore.sh docker/postgres/backup/lead_prospector_20250101_120000.dump production
```

## Monitoramento

Opcional, via `docker/docker-compose.monitoring.yml`:
- **watchtower**: auto-update de imagens a cada 1h
- **backup**: pg_dump automático às 3h diárias

Healthcheck do app: `GET /health` (retorna `{ status: "ok", uptime, timestamp }`)

## CI/CD

GitHub Actions em `.github/workflows/ci.yml`:
- **lint**: ESLint + Prettier check
- **typecheck**: `tsc --noEmit`
- **test**: Vitest com PostgreSQL service
- **docker**: Build + push para ghcr.io (apenas main)

## Segurança

- ✅ Helmet (security headers)
- ✅ Rate limiting (100 req/min/IP)
- ✅ CORS restrito (configurável via `CORS_ORIGIN`)
- ✅ Erros internos ocultos em production
- ✅ LGPD: opt-out, consentimento, direito de exclusão/portabilidade
- ✅ Sem secrets no código (`.env` gitignored)
- ❌ Autenticação via API key não implementada (rede interna Docker)

## n8n Workflows

5 workflows importáveis em `n8n-workflows/`:
1. Google Maps → WhatsApp
2. LinkedIn → WhatsApp
3. Webhook → Criar Lead
4. Campaign Executor (schedule 1h)
5. WAHA Inbound Webhook

Importar via UI do n8n: **Workflows → Import from File**.
