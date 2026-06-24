#!/bin/bash
# Seed do banco de dados
set -e

echo "=== Lead Prospector — Seed ==="

echo "1. Rodando migrations..."
npx prisma migrate deploy

echo "2. Seed..."
npx prisma db seed

echo "Seed concluído."
