#!/usr/bin/env bash
# Aplica as migrações de backend/supabase/migrations num projeto Supabase com a CLI oficial (gratuita).
# Não cria conta nem projeto. Precisa da string de conexão do banco (Painel → Connect → Session pooler),
# lida da variável SUPABASE_DB_URL. O valor nunca é impresso.
#   SUPABASE_DB_URL='postgresql://...' ./scripts/aplicar-migracoes.sh            # simulação (padrão)
#   SUPABASE_DB_URL='postgresql://...' ./scripts/aplicar-migracoes.sh --aplicar  # aplica de verdade
set -euo pipefail
cd "$(dirname "$0")/.."
VERSAO_CLI="${VERSAO_CLI:-latest}"   # fixe uma versão exata (ex.: VERSAO_CLI=2.x.y) para repetir o resultado

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "Defina SUPABASE_DB_URL (string de conexão do banco). Nada foi feito." >&2; exit 1
fi
echo "Rodando os testes do banco (PGlite) antes…"
npm test --silent

echo "Migrações locais:"; ls -1 supabase/migrations
if [[ "${1:-}" == "--aplicar" ]]; then
  read -r -p "Aplicar essas migrações no projeto remoto? Digite APLICAR: " ok
  [[ "$ok" == "APLICAR" ]] || { echo "Cancelado."; exit 1; }
  npx --yes "supabase@${VERSAO_CLI}" db push --db-url "$SUPABASE_DB_URL" --include-all
else
  npx --yes "supabase@${VERSAO_CLI}" db push --db-url "$SUPABASE_DB_URL" --include-all --dry-run
  echo "Simulação concluída. Para aplicar: ./scripts/aplicar-migracoes.sh --aplicar"
fi
