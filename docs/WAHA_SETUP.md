# Configuração WAHA — Lead Prospector WhatsApp

## O que é WAHA?

**WAHA** (WhatsApp HTTP API) é um servidor que expõe uma API REST para interagir com o WhatsApp Web. Ele gerencia sessões, QR Codes, envio e recebimento de mensagens.

## Instalação

### Docker

```bash
docker run -d --name waha \
  -p 3002:3002 \
  -e WHATSAPP_API_KEY=sua-chave-aqui \
  -v waha_data:/app/.sections \
  devlike/whatsapp-http-api:latest
```

### Docker Compose (já incluso no projeto)

```bash
docker compose up -d waha
```

## Configuração

### Variáveis WAHA

```env
WAHA_API_URL=http://localhost:3002
WAHA_API_KEY=sua-chave-aqui
```

## Gerenciamento de Sessões

### Criar sessão

```bash
curl -X POST http://localhost:3002/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"name": "default"}'
```

### Listar sessões

```bash
curl http://localhost:3002/api/sessions
```

### Obter QR Code

```bash
curl http://localhost:3002/api/sessions/default/qr
```

### Deletar sessão

```bash
curl -X DELETE http://localhost:3002/api/sessions/default
```

## Envio de Mensagens

### Texto

```bash
curl -X POST http://localhost:3002/api/sendText \
  -H "Content-Type: application/json" \
  -d '{
    "session": "default",
    "chatId": "5511999999999@c.us",
    "text": "Olá, tudo bem?"
  }'
```

### Imagem

```bash
curl -X POST http://localhost:3002/api/sendImage \
  -H "Content-Type: application/json" \
  -d '{
    "session": "default",
    "chatId": "5511999999999@c.us",
    "image": "https://exemplo.com/imagem.jpg",
    "caption": "Veja só!"
  }'
```

## Webhooks

Configure webhooks no WAHA para receber notificações de mensagens recebidas:

```bash
curl -X POST http://localhost:3002/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://app:3000/api/whatsapp/webhook",
    "events": ["message"]
  }'
```

## Integração com a Plataforma

A plataforma abstrai o WAHA via `WhatsAppProvider`. Para usar em produção:

```typescript
import { WahaWhatsAppProvider } from './src/integrations/waha/waha.provider';

const provider = new WahaWhatsAppProvider({
  apiUrl: process.env.WAHA_API_URL,
  apiKey: process.env.WAHA_API_KEY,
  sessionName: 'default',
});
```

Para testes, use `MockWhatsAppProvider`.
