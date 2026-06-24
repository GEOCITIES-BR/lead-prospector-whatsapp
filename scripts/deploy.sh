#!/bin/bash
# Deploy Lead Prospector to target environment
# Usage: ./scripts/deploy.sh <staging|production>
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Uso: $0 <staging|production>"
  exit 1
fi

ENV="$1"
COMPOSE_FILE=""
ENV_FILE=""

case "$ENV" in
  staging)
    COMPOSE_FILE="docker/docker-compose.staging.yml"
    ENV_FILE=".env.staging"
    ;;
  production)
    COMPOSE_FILE="docker/docker-compose.prod.yml"
    ENV_FILE=".env.production"
    ;;
  *)
    echo "Ambiente inválido: $ENV (use staging ou production)"
    exit 1
    ;;
esac

if [ ! -f "$ENV_FILE" ]; then
  echo "Erro: arquivo $ENV_FILE não encontrado."
  echo "Copie de docker/.env.${ENV}.example e preencha as variáveis."
  exit 1
fi

echo "=== Deploy [$ENV] ==="
echo "Compose: $COMPOSE_FILE"
echo "Env:     $ENV_FILE"

echo "1. Build das imagens..."
docker compose -f "$COMPOSE_FILE" build --pull

echo "2. Parando serviços existentes..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans

echo "3. Iniciando banco e dependências..."
docker compose -f "$COMPOSE_FILE" up -d postgres redis

echo "4. Aguardando PostgreSQL..."
until docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
  sleep 2
done

echo "5. Rodando migrations..."
docker compose -f "$COMPOSE_FILE" run --rm app npx prisma migrate deploy

echo "6. Iniciando todos os serviços..."
docker compose -f "$COMPOSE_FILE" up -d

echo "7. Health check..."
for i in $(seq 1 12); do
  if docker compose -f "$COMPOSE_FILE" exec -T app wget -q -O- http://localhost:3000/health > /dev/null 2>&1; then
    echo "App saudável!"
    break
  fi
  echo "Aguardando app... ($i/12)"
  sleep 5
done

echo "Deploy [$ENV] concluído com sucesso!"
