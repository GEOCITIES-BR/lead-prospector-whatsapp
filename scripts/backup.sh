#!/bin/bash
# Backup PostgreSQL database
# Usage: ./scripts/backup.sh [environment] [retention_days]
set -e

ENV=${1:-production}
RETENTION=${2:-7}
BACKUP_DIR="./docker/postgres/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="${POSTGRES_DB:-lead_prospector}"
DB_USER="${POSTGRES_USER:-postgres}"
CONTAINER="lead-prospector-postgres"

if [ "$ENV" = "staging" ]; then
  CONTAINER="lead-prospector-postgres-staging"
fi

echo "=== Backup [$ENV] ==="
echo "Container: $CONTAINER"
echo "Database:  $DB_NAME"
echo "Retention: $RETENTION dias"

mkdir -p "$BACKUP_DIR"

echo "Executando pg_dump..."
docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" \
  --no-owner \
  --no-acl \
  --format=custom \
  --file="/backup/${DB_NAME}_${TIMESTAMP}.dump"

echo "Backup criado: ${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.dump"

echo "Removendo backups mais antigos que ${RETENTION} dias..."
find "$BACKUP_DIR" -name "${DB_NAME}_*.dump" -mtime "+$RETENTION" -delete

echo "Backup concluído."
