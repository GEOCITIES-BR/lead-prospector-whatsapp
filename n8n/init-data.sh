#!/bin/bash
# Inicializa n8n com workflows pré-configurados
# Executar dentro do container n8n: docker exec lead-prospector-n8n bash /init-data.sh

set -e

N8N_DIR="/home/node/.n8n"
WORKFLOW_DIR="/workflows"

echo "Importando workflows n8n..."

for wf in "$WORKFLOW_DIR"/*.json; do
  name=$(basename "$wf")
  echo "  Importando $name..."
  # n8n import:workflow --input="$wf"
  # Descomente a linha acima quando o n8n suportar import via CLI
  # Workaround: copiar para o diretório de dados do n8n
  cp "$wf" "$N8N_DIR/workflows/"
done

echo "Importação concluída."
