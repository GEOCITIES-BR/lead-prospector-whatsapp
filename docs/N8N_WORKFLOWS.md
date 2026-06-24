# Workflows n8n — Lead Prospector WhatsApp

## Visão Geral

Workflows pré-construídos para automação visual com n8n.

## Workflows Inclusos

### 1. Google → Supabase

**Trigger:** Webhook
**Ação:** Salvar leads do Google Business no banco

```json
{
  "name": "Google to Supabase",
  "nodes": [
    { "name": "Webhook", "type": "n8n-nodes-base.webhook" },
    { "name": "Transform", "type": "n8n-nodes-base.set" },
    { "name": "Supabase Insert", "type": "n8n-nodes-base.supabase" }
  ]
}
```

### 2. Supabase → Score

**Trigger:** Schedule (a cada 5 min)
**Ação:** Calcular score de novos leads

```json
{
  "name": "Supabase to Score",
  "nodes": [
    { "name": "Schedule", "type": "n8n-nodes-base.scheduleTrigger" },
    { "name": "Supabase Get", "type": "n8n-nodes-base.supabase" },
    { "name": "Score Calculation", "type": "n8n-nodes-base.function" },
    { "name": "Supabase Update", "type": "n8n-nodes-base.supabase" }
  ]
}
```

### 3. Score → WhatsApp

**Trigger:** Supabase Webhook
**Ação:** Enviar mensagem para leads com score alto

```json
{
  "name": "Score to WhatsApp",
  "nodes": [
    { "name": "Webhook", "type": "n8n-nodes-base.webhook" },
    { "name": "Filter Score", "type": "n8n-nodes-base.filter" },
    { "name": "HTTP Request", "type": "n8n-nodes-base.httpRequest" }
  ]
}
```

### 4. WhatsApp → CRM

**Trigger:** Webhook da plataforma
**Ação:** Atualizar CRM externo quando lead responder

## Configuração

1. Importe os workflows da pasta `n8n/workflows/`
2. Configure as credenciais:
   - Supabase (URL + API Key)
   - HTTP Request (URL da plataforma)
3. Ative os workflows

## Webhooks da Plataforma

| Endpoint | Evento | Descrição |
|----------|--------|-----------|
| POST /api/webhooks/n8n/lead-created | Lead criado | Disparado após scraping |
| POST /api/webhooks/n8n/lead-scored | Lead pontuado | Após cálculo de score |
| POST /api/webhooks/n8n/message-sent | Mensagem enviada | Após envio WhatsApp |
| POST /api/webhooks/n8n/message-received | Mensagem recebida | Lead respondeu |
