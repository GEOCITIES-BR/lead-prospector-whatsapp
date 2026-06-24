# Arquitetura — Lead Prospector WhatsApp

> Projeto oficial da GeoCities.

---

## Visão Geral

Sistema SaaS Open Source para prospecção B2B ética via WhatsApp com:
- Scraping de leads públicos (Google Business, LinkedIn)
- Enriquecimento e validação de dados
- Lead Scoring automatizado
- Campanhas multicanais via WhatsApp
- Integração com n8n
- Dashboard analítico
- Deploy self-hosted

---

## Clean Architecture

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

### Dependências

- **API Layer** → Application Layer
- **Application Layer** → Domain Layer
- **Domain Layer** → (nenhuma dependência externa)
- **Infra Layer** → implementa interfaces do domínio

---

## Stack Tecnológica

| Camada       | Tecnologia                          |
|-------------|--------------------------------------|
| Runtime     | Node.js 20 LTS                      |
| Linguagem   | TypeScript (strict mode)             |
| Framework   | Fastify                              |
| ORM         | Prisma                               |
| Banco       | PostgreSQL (Supabase)                |
| Scraping    | Puppeteer + Cheerio                  |
| WhatsApp    | WAHA (WhatsApp HTTP API)             |
| Automação   | n8n                                  |
| Filas       | BullMQ + Redis                       |
| Logs        | Pino                                 |
| Cache       | Redis                                |
| Testes      | Vitest                               |
| Container   | Docker + Docker Compose              |
| CI/CD       | GitHub Actions                       |

---

## Abstração WhatsApp

```typescript
export interface WhatsAppProvider {
  sendText(phone: string, message: string): Promise<SendResult>;
  sendImage(phone: string, imageUrl: string, caption?: string): Promise<SendResult>;
  getSessionStatus(): Promise<SessionStatus>;
  getQRCode(): Promise<string>;
}
```

**Implementações:**
- `waha.provider.ts` — produção
- `mock.provider.ts` — testes

---

## Fluxo de Dados

```
Google Business ─┐
                 ├──→ Scraper Module ──→ Lead Entity ──→ Database
LinkedIn ────────┘
                              │
                              ↓
                     Enrichment Pipeline
                    (validação, dedup, score)
                              │
                              ↓
                     Campaign Engine
                    (templates, sequências)
                              │
                              ↓
                   ┌── WhatsApp Provider ──→ WAHA ──→ WhatsApp
                   │
                   └── n8n Webhook ──→ CRM Externo
```

---

## Modelo de Dados (Conceitual)

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   Leads     │────→│  Messages    │────→│  Campaigns     │
├─────────────┤     ├──────────────┤     ├────────────────┤
│ id          │     │ id           │     │ id             │
│ nome        │     │ lead_id      │     │ nome           │
│ empresa     │     │ campanha_id  │     │ template       │
│ cargo       │     │ conteudo     │     │ status         │
│ telefone    │     │ status       │     │ created_at     │
│ email       │     │ enviada_em   │     │ updated_at     │
│ linkedin    │     │ lida_em      │     └────────────────┘
│ website     │     └──────────────┘
│ origem      │
│ score       │     ┌────────────────┐
│ status      │     │ Conversoes     │
│ created_at  │     ├────────────────┤
│ updated_at  │     │ id             │
└─────────────┘     │ lead_id        │
                    │ valor          │
┌─────────────┐     │ data           │
│ Sessões WAHA│     └────────────────┘
├─────────────┤
│ id          │     ┌────────────────┐
│ session_name│     │ Automações n8n │
│ phone       │     ├────────────────┤
│ status      │     │ id             │
│ qrcode      │     │ nome           │
│ created_at  │     │ workflow_json  │
│ updated_at  │     │ ativo          │
└─────────────┘     └────────────────┘
```

---

## Princípios de Design

1. **Clean Architecture** — baixo acoplamento, alta coesão
2. **SOLID** — cada classe tem uma responsabilidade
3. **Provider Pattern** — WhatsApp abstraído via interface
4. **Repository Pattern** — acesso a dados via interfaces
5. **DTO Pattern** — dados trafegam como objetos tipados
6. **Error Handling** — try-catch em toda operação assíncrona
7. **Logs Estruturados** — Pino com contexto enriquecido
8. **Validação** — Zod para schemas de entrada
9. **Rate Limiting** — proteção contra abuso
10. **LGPD** — opt-out, auditoria, anonimização
