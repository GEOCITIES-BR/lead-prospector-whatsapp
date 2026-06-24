#!/bin/bash
# Setup monitoring infrastructure
# Usage: ./scripts/monitoring-setup.sh [production|staging]
set -e

ENV=${1:-production}

if [ "$ENV" = "staging" ]; then
  echo "Copie docker/.env.staging.example para .env.staging e configure"
else
  echo "Copie docker/.env.production.example para .env.production e configure"
fi

echo ""
echo "Para ativar monitoramento:"
echo "  docker compose -f docker/docker-compose.${ENV}.yml -f docker/docker-compose.monitoring.yml up -d"
echo ""
echo "Para ver logs do app:"
echo "  docker compose -f docker/docker-compose.${ENV}.yml logs -f app"
echo ""
echo "Para backup manual:"
echo "  ./scripts/backup.sh ${ENV}"
echo ""
echo "Para restore:"
echo "  ./scripts/restore.sh docker/postgres/backup/<arquivo>.dump ${ENV}"
