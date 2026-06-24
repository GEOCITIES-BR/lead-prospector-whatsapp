# Guia de Instalação — Lead Prospector WhatsApp

## Pré-requisitos

- **Node.js** 20.x ou superior
- **Docker** e **Docker Compose**
- **Git**
- **NPM** 10.x ou superior

## Passo a Passo

### 1. Clone o repositório

```bash
git clone https://github.com/geocities/lead-prospector-whatsapp.git
cd lead-prospector-whatsapp
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações (veja CONFIGURATION.md).

### 3. Instale as dependências

```bash
npm install
```

### 4. Configure o banco de dados

```bash
docker compose up -d postgres
npx prisma generate
npx prisma db push
```

### 5. Inicie o Redis e WAHA

```bash
docker compose up -d redis waha
```

### 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000/api/health` para verificar.

## Verificação

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z","uptime":123.45,"version":"0.1.0"}
```
