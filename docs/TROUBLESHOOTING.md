# Troubleshooting — Lead Prospector WhatsApp

## Problemas Comuns

### Servidor não inicia

**Sintoma:** `npm run dev` falha

**Causas possíveis:**
- Porta 3000 em uso
- Variáveis de ambiente não configuradas
- Prisma Client não gerado

**Soluções:**

```bash
# Verificar porta em uso
netstat -ano | findstr :3000

# Gerar Prisma Client
npx prisma generate

# Validar ambiente
npm run validate:env
```

### Erro de conexão com banco

**Sintoma:** `Can't reach database server`

**Causas possíveis:**
- PostgreSQL não rodando
- DATABASE_URL incorreta

**Soluções:**

```bash
# Verificar container
docker compose ps postgres

# Verificar logs
docker compose logs postgres

# Testar conexão manual
npx prisma db push
```

### WAHA não conecta

**Sintoma:** QR Code não aparece

**Causas possíveis:**
- WAHA não está rodando
- Sessão não criada

**Soluções:**

```bash
# Verificar WAHA
curl http://localhost:3002/api/sessions

# Criar sessão manualmente
curl -X POST http://localhost:3002/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"name": "default"}'

# Verificar logs
docker compose logs waha
```

### Redis não conecta

**Sintoma:** BullMQ parou de processar

**Soluções:**

```bash
docker compose logs redis
docker compose restart redis
```

### Erros TypeScript

**Sintoma:** `tsc` falha com erros

**Soluções:**

```bash
# Verificar erros
npx tsc --noEmit

# Limpar cache
npx tsc --build --clean
```

### Testes falhando

**Sintoma:** `vitest` reporta erros

**Soluções:**

```bash
# Rodar testes específicos
npx vitest run tests/unit/mock-provider.test.ts

# Ver cobertura
npm run test:coverage
```

## Logs

```bash
# Logs da aplicação
docker compose logs -f app

# Logs do banco
docker compose logs -f postgres

# Logs do Redis
docker compose logs -f redis

# Logs do WAHA
docker compose logs -f waha
```

## Reset Completo

```bash
# Para tudo e remove volumes
docker compose down -v

# Remove node_modules
rm -rf node_modules

# Reinstala
npm install
npx prisma generate

# Sobe novamente
docker compose up -d
```
