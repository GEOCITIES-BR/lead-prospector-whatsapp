# ROADMAP — Lead Prospector WhatsApp

> Projeto oficial da GeoCities.
> Plataforma SaaS Open Source para prospecção B2B ética via WhatsApp.

---

## FASE 0 — Arquitetura (ATUAL)

**Objetivo:** Definir arquitetura completa do sistema.

**Entregáveis:**
- Estrutura do projeto
- ADRs (Architecture Decision Records)
- Diagramas de arquitetura
- Contexto inicial (context.md)
- Documentação de arquitetura (ARCHITECTURE.md)

---

## FASE 1 — Fundação

**Objetivo:** Inicializar stack base do projeto.

**Entregáveis:**
- Node.js + TypeScript + Fastify
- Prisma ORM + Supabase PostgreSQL
- Docker + Docker Compose
- ESLint + Prettier + Husky
- GitHub Actions (CI)

---

## FASE 2 — Banco de Dados

**Objetivo:** Criar schema e migrations.

**Entregáveis:**
- Modelo relacional completo (leads, campanhas, mensagens, conversões, sessões)
- Migrations Prisma
- Seeds para desenvolvimento

---

## FASE 3 — Google Business Scraper

**Objetivo:** Capturar leads públicos do Google Business.

**Entregáveis:**
- Módulo de scraping Google Business
- Captura de nome, telefone, website, endereço, categoria
- Rate limiting e proteção
- Armazenamento no banco

---

## FASE 4 — LinkedIn Scraper

**Objetivo:** Capturar dados públicos do LinkedIn.

**Entregáveis:**
- Módulo de scraping LinkedIn
- Captura de nome, cargo, empresa, perfil
- Limites éticos e proteção contra bloqueio
- Armazenamento no banco

---

## FASE 5 — Enriquecimento

**Objetivo:** Validar, deduplicar e pontuar leads.

**Entregáveis:**
- Validação de dados (telefone, email)
- Deduplicação automática
- Lead Scoring (score 0–100)
- Pipeline de enriquecimento

---

## FASE 6 — WAHA WhatsApp

**Objetivo:** Integrar envio de mensagens via WAHA.

**Entregáveis:**
- Abstração WhatsAppProvider
- Implementação WAHA Provider
- Gerenciamento de sessões (QR Code)
- Envio de texto e imagem
- Webhooks de recebimento
- MockProvider para testes

---

## FASE 7 — Templates

**Objetivo:** Sistema de templates com variáveis dinâmicas.

**Entregáveis:**
- Templates com variáveis {{nome}}, {{empresa}}, etc.
- Personalização por lead
- Preview de mensagens

---

## FASE 8 — Campanhas

**Objetivo:** Automação de campanhas com sequências.

**Entregáveis:**
- CRUD de campanhas
- Sequências de mensagens
- Follow-up automático
- Agendamento
- Gatilhos condicionais

---

## FASE 9 — n8n

**Objetivo:** Integração com n8n para workflows visuais.

**Entregáveis:**
- Workflows pré-construídos
- Google → Supabase
- Supabase → Score
- Score → WhatsApp
- WhatsApp → CRM
- Webhooks para n8n

---

## FASE 10 — Dashboard

**Objetivo:** Métricas e analytics.

**Entregáveis:**
- Total de leads
- Taxa de abertura
- Taxa de resposta
- Conversões
- Gráficos e relatórios
- Filtros por período

---

## FASE 11 — Segurança

**Objetivo:** Compliance e proteção de dados.

**Entregáveis:**
- LGPD compliance
- Opt-Out automático
- Auditoria de ações
- Logs estruturados
- Rate limiting global
- Sanitização de dados

---

## FASE 12 — Deploy

**Objetivo:** Pipeline de deploy completo.

**Entregáveis:**
- Ambiente dev (Docker Compose)
- Ambiente staging
- Ambiente production
- Scripts de migração
- Backup automático
- Monitoramento

---

> **Avançar para próxima fase somente após conclusão completa da fase atual.**
