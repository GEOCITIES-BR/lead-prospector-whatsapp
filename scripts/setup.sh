#!/bin/bash
# Setup inicial do Lead Prospector
set -e

echo "=== Lead Prospector — Setup ==="

echo "1. Instalando dependências..."
npm ci

echo "2. Gerando Prisma Client..."
npx prisma generate

echo "3. Compilando TypeScript..."
npm run build

echo "4. Verificando typecheck..."
npx tsc --noEmit

echo "5. Rodando testes..."
npm test

echo ""
echo "Setup concluído! Para iniciar o ambiente de desenvolvimento:"
echo "  docker compose up -d"
echo "  npx tsx src/api/server.ts"
