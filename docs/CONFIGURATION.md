# Configuração — Lead Prospector WhatsApp

## Variáveis de Ambiente

### Servidor

| Variável    | Padrão         | Descrição               |
|-------------|----------------|------------------------|
| NODE_ENV    | development    | Modo de execução       |
| PORT        | 3000           | Porta do servidor      |
| HOST        | 0.0.0.0        | Host do servidor       |

### Banco de Dados

| Variável       | Padrão | Descrição              |
|---------------|--------|------------------------|
| DATABASE_URL  | —      | Connection string PostgreSQL |

### Redis

| Variável      | Padrão     | Descrição      |
|--------------|-----------|----------------|
| REDIS_HOST   | localhost | Host do Redis  |
| REDIS_PORT   | 6379      | Porta do Redis |
| REDIS_PASSWORD | —       | Senha do Redis |

### WAHA WhatsApp

| Variável      | Padrão                | Descrição           |
|--------------|----------------------|---------------------|
| WAHA_API_URL | http://localhost:3002 | URL da API WAHA    |
| WAHA_API_KEY | —                    | Chave de API WAHA  |

### n8n

| Variável        | Padrão                      | Descrição         |
|----------------|----------------------------|-------------------|
| N8N_WEBHOOK_URL | http://localhost:5678/webhook | URL do webhook n8n |
| N8N_API_KEY    | —                          | Chave de API n8n  |

### Scraping

| Variável                | Padrão | Descrição              |
|------------------------|--------|------------------------|
| SCRAPER_RATE_LIMIT_MS | 1000   | Delay entre requisições |
| SCRAPER_MAX_RETRIES   | 3      | Máximo de tentativas   |
| SCRAPER_TIMEOUT_MS    | 30000  | Timeout em ms          |

### Lead Scoring

| Variável               | Padrão | Descrição                |
|-----------------------|--------|--------------------------|
| SCORE_WEIGHT_LINKEDIN | 20     | Peso do LinkedIn no score |
| SCORE_WEIGHT_COMPANY  | 15     | Peso da empresa no score  |
| SCORE_WEIGHT_EMAIL    | 10     | Peso do email no score    |
| SCORE_WEIGHT_WEBSITE  | 5      | Peso do website no score  |
| SCORE_WEIGHT_PHONE    | 5      | Peso do telefone no score |

### Logs

| Variável   | Padrão | Descrição              |
|-----------|--------|------------------------|
| LOG_LEVEL | info   | Nível de log (debug, info, warn, error) |
| LOG_PRETTY | false | Formatação colorida    |

## Arquivos de Configuração

- `.env` — Configuração principal (não versionado)
- `.env.example` — Template com valores padrão
- `.env.local.example` — Configuração para desenvolvimento local
- `.env.production.example` — Configuração para produção
- `config/env.schema.ts` — Schema Zod de validação
- `config/validate-env.ts` — Validador de ambiente

## Validação

```bash
npm run validate:env
```
