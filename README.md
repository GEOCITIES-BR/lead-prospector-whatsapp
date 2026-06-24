# Lead Prospector WhatsApp

> Plataforma SaaS Open Source para prospecção B2B ética via WhatsApp.
> Projeto oficial da GeoCities.

---

## Visão Geral

O **Lead Prospector WhatsApp** é uma plataforma completa para captura, enriquecimento e automação de comunicação com leads B2B via WhatsApp. Construída com Clean Architecture, TypeScript e design modular, permite deploy self-hosted com suporte a múltiplos provedores WhatsApp.

**Principais funcionalidades:**
- Captura de leads públicos (Google Business, LinkedIn)
- Enriquecimento e validação de dados
- Lead Scoring automatizado (0–100)
- Campanhas com sequências e follow-up
- Envio de mensagens via WhatsApp (WAHA)
- Integração com n8n
- Dashboard analítico
- LGPD / Opt-Out

---

## Arquitetura

```
┌─────────────────────────────────────────────┐
│                 API Layer                     │
│         Fastify Routes / Middlewares          │
├─────────────────────────────────────────────┤
│            Application Layer                  │
│        Use Cases / DTOs / Services            │
├─────────────────────────────────────────────┤
│              Domain Layer                     │
│    Entities / Value Objects / Aggregates      │
├─────────────────────────────────────────────┤
│              Infra Layer                      │
│   Database / Cache / Queue / Logger / Jobs    │
└─────────────────────────────────────────────┘
```

O WhatsApp é abstraído via interface (`WhatsAppProvider`), permitindo trocar o provedor sem impacto na regra de negócio.

---

## Tecnologias

| Camada       | Tecnologia                          |
|-------------|--------------------------------------|
| Runtime     | Node.js 20 LTS                      |
| Linguagem   | TypeScript (strict mode)             |
| Framework   | Fastify 5.x                         |
| ORM         | Prisma 5.x                          |
| Banco       | PostgreSQL 16 (Supabase compatível) |
| Scraping    | Puppeteer + Cheerio                 |
| WhatsApp    | WAHA (WhatsApp HTTP API)            |
| Automação   | n8n                                 |
| Filas       | BullMQ + Redis 7                    |
| Cache       | Redis 7                             |
| Logs        | Pino                                |
| Testes      | Vitest                              |
| Container   | Docker + Docker Compose             |
| CI/CD       | GitHub Actions                      |

---

## Requisitos

- Node.js 20+
- Docker e Docker Compose
- NPM 10+
- Git
- (Opcional) Conta Supabase para produção

---

## Instalação

```bash
# Clone o repositório
git clone https://github.com/geocities/lead-prospector-whatsapp.git
cd lead-prospector-whatsapp

# Instale as dependências
npm install

# Copie os arquivos de ambiente
cp .env.example .env

# Gere o Prisma Client
npx prisma generate
```

---

## Configuração

Edite o arquivo `.env` com suas configurações:

```env
# Servidor
NODE_ENV=development
PORT=3000

# Banco de Dados
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lead_prospector

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# WAHA WhatsApp
WAHA_API_URL=http://localhost:3002
WAHA_API_KEY=sua-chave-aqui

# n8n
N8N_WEBHOOK_URL=http://localhost:5678/webhook

# Logs
LOG_LEVEL=info
LOG_PRETTY=true
```

---

## Supabase (Produção)

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **Project Settings > Database** e copie a Connection String
3. Configure no `.env`:

```env
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres?sslmode=require
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Para desenvolvimento local, use o Docker Compose (já incluso).

---

## WAHA (WhatsApp HTTP API)

### Docker

```bash
docker run -d --name waha \
  -p 3002:3002 \
  -e WHATSAPP_API_KEY=sua-chave \
  -v waha_data:/app/.sections \
  devlike/whatsapp-http-api:latest
```

### Conectar WhatsApp

1. Acesse `http://localhost:3002/api/sessions`
2. Crie uma sessão: `POST /api/sessions` com `{ "name": "default" }`
3. Escaneie o QR Code com o WhatsApp
4. Status: `connected`

A plataforma gerencia sessões automaticamente via `WhatsAppSession` Service.

---

## Redis

### Docker

```bash
docker run -d --name redis \
  -p 6379:6379 \
  redis:7-alpine
```

Usado para:
- BullMQ (filas de processamento)
- Cache de sessões
- Rate limiting

---

## n8n

### Docker

```bash
docker run -d --name n8n \
  -p 5678:5678 \
  -e N8N_SECURE_COOKIE=false \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n:latest
```

### Workflows inclusos

- `google-to-supabase.json` — Google Business → Supabase
- `supabase-to-score.json` — Supabase → Lead Scoring
- `score-to-whatsapp.json` — Score → WhatsApp
- `whatsapp-to-crm.json` — WhatsApp → CRM

---

## Banco de Dados

### Migrations

```bash
npm run prisma:migrate
```

### Models

- **Leads** — dados dos contatos com score e status
- **Campanhas** — templates e configurações de campanha
- **Mensagens** — histórico de envio com status
- **Conversões** — registro de conversões
- **WhatsAppSessions** — gerenciamento de sessões

---

## Docker

### Subir ambiente completo

```bash
docker compose up -d
```

### Serviços

| Serviço   | Porta | Descrição                    |
|-----------|-------|------------------------------|
| app       | 3000  | API Fastify                  |
| postgres  | 5432  | Banco de dados               |
| redis     | 6379  | Cache e filas                |
| waha      | 3002  | WhatsApp HTTP API            |

### Comandos úteis

```bash
# Iniciar
docker compose up -d

# Parar
docker compose down

# Ver logs
docker compose logs -f app

# Reconstruir
docker compose build

# Resetar banco
docker compose down -v
```

---

## Deploy

### Development

```bash
docker compose up -d
npm run prisma:migrate
npm run dev
```

### Staging / Production

```bash
# Build
docker compose build

# Deploy com Docker Compose
docker compose -f docker-compose.prod.yml up -d

# Migrations
docker compose exec app npx prisma migrate deploy
```

### Variáveis obrigatórias em produção

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_PASSWORD=senha-forte
WAHA_API_KEY=senha-forte
```

---

## Troubleshooting

### Erro de conexão com o banco

```bash
# Verifique se o PostgreSQL está rodando
docker compose ps postgres

# Logs do banco
docker compose logs postgres
```

### WAHA não conecta

```bash
# Verifique o status
curl http://localhost:3002/api/sessions

# Recrie a sessão
curl -X POST http://localhost:3002/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"name": "default"}'
```

### Redis não conecta

```bash
docker compose logs redis
docker compose restart redis
```

### Erro de permissão no Docker (Linux)

```bash
sudo usermod -aG docker $USER
# Logout e login novamente
```

---

## Segurança

### LGPD

- Coleta somente dados públicos
- Opt-Out automático ao receber solicitação
- Auditoria de todas as ações
- Logs sem dados sensíveis
- Anonimização sob demanda

### Boas práticas

- Nunca commitar `.env` ou segredos
- Usar `REDIS_PASSWORD` forte
- Configurar `CORS_ORIGIN` restrito
- Rate limiting em endpoints públicos
- Validação de entrada com Zod

---

## API Endpoints

### Health

```
GET /api/health
```

### Leads

```
GET    /api/leads        — Listar leads (paginado)
GET    /api/leads/:id    — Obter lead
POST   /api/leads        — Criar lead
PUT    /api/leads/:id    — Atualizar lead
DELETE /api/leads/:id    — Remover lead (soft delete)
```

### Campanhas

```
GET    /api/campaigns        — Listar campanhas
POST   /api/campaigns        — Criar campanha
POST   /api/campaigns/:id/start  — Iniciar campanha
```

### WhatsApp

```
GET    /api/whatsapp/sessions       — Listar sessões
POST   /api/whatsapp/sessions       — Criar sessão
GET    /api/whatsapp/sessions/:id/qrcode  — Obter QR Code
```

## Scripts NPM

| Script              | Descrição                    |
|--------------------|------------------------------|
| `npm run dev`      | Desenvolvimento com hot reload |
| `npm run build`    | Compilar TypeScript          |
| `npm start`        | Produção                     |
| `npm test`         | Rodar testes                 |
| `npm run lint`     | Verificar código             |
| `npm run format`   | Formatar código              |
| `npm run prisma:migrate` | Rodar migrations       |

---

## Contribuição

1. Fork o projeto
2. Crie sua branch (`git checkout -b feat/nova-funcionalidade`)
3. Commit (`git commit -m "feat: adiciona nova funcionalidade"`)
4. Push (`git push origin feat/nova-funcionalidade`)
5. Abra um Pull Request

### Padrão de commits

- `feat:` — nova funcionalidade
- `fix:` — correção
- `docs:` — documentação
- `test:` — testes
- `refactor:` — refatoração
- `chore:` — manutenção

---

## Licença

MIT — GeoCities

---

<div align="center">
  <strong>Feito com 💚 pela GeoCities</strong>
</div>
