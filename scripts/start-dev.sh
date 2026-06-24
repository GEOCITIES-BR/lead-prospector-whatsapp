#!/bin/bash
# Inicia ambiente de desenvolvimento completo
set -e

echo "=== Lead Prospector — Dev ==="

echo "1. Iniciando dependências (PostgreSQL, Redis, WAHA)..."
docker compose up -d postgres redis waha

echo "2. Aguardando PostgreSQL..."
until docker compose exec postgres pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done

echo "3. Rodando migrations..."
npx prisma migrate dev

echo "4. Seed..."
npx prisma db seed

echo "5. Iniciando servidor..."
npx tsx watch src/api/server.ts
