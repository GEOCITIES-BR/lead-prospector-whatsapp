#!/bin/bash
# Restore PostgreSQL database from backup
# Usage: ./scripts/restore.sh <backup_file> [environment]
set -e

if [ -z "$1" ]; then
  echo "Erro: informe o arquivo de backup (.dump)"
  echo "Uso: ./scripts/restore.sh docker/postgres/backup/lead_prospector_20250101_120000.dump [staging]"
  exit 1
fi

BACKUP_FILE="$1"
ENV=${2:-production}
CONTAINER="lead-prospector-postgres"
DB_NAME="${POSTGRES_DB:-lead_prospector}"
DB_USER="${POSTGRES_USER:-postgres}"

if [ "$ENV" = "staging" ]; then
  CONTAINER="lead-prospector-postgres-staging"
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Erro: arquivo não encontrado: $BACKUP_FILE"
  exit 1
fi

echo "=== Restore [$ENV] ==="
echo "Container: $CONTAINER"
echo "Backup:    $BACKUP_FILE"

# Copy backup into container
BACKUP_NAME=$(basename "$BACKUP_FILE")
docker cp "$BACKUP_FILE" "${CONTAINER}:/backup/${BACKUP_NAME}"

echo "Executando pg_restore..."
docker exec "$CONTAINER" pg_restore -U "$DB_USER" -d "$DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  "/backup/${BACKUP_NAME}"

echo "Restore concluído."
