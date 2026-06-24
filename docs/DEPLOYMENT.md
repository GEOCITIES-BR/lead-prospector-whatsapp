# Deploy — Lead Prospector WhatsApp

## Ambientes

### Desenvolvimento

```bash
docker compose up -d
npm run dev
```

- Hot reload via tsx watch
- Banco local via Docker
- Logs detalhados

### Staging

```bash
cp .env.production.example .env
# Edite .env com credenciais de staging
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

### Produção

```bash
cp .env.production.example .env
# Edite .env com credenciais reais
docker compose -f docker-compose.prod.yml up -d
```

## Docker Compose Produção

### docker-compose.prod.yml

```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: production
    env_file: .env
    depends_on:
      - postgres
      - redis
    restart: always

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    env_file: .env
    restart: always

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: always

  waha:
    image: devlike/whatsapp-http-api:latest
    ports:
      - '3002:3002'
    env_file: .env
    volumes:
      - waha_data:/app/.sections
    restart: always
```

## Migrations

```bash
# Desenvolvimento
npm run prisma:migrate

# Produção
docker compose exec app npx prisma migrate deploy
```

## Backup

```bash
# PostgreSQL
docker compose exec postgres pg_dump -U postgres lead_prospector > backup.sql

# Redis
docker compose exec redis redis-cli SAVE
```

## Monitoramento

```bash
# Logs da aplicação
docker compose logs -f app

# Health check
curl http://localhost:3000/api/health

# Métricas (quando disponível)
curl http://localhost:3000/api/metrics
```
