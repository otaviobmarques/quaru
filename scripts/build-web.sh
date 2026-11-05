#!/usr/bin/env bash
# Monta a versão web completa do Quaru (app + painel admin + área do treinador) em mobile/dist.
# Usado pela Vercel (app.quaru.com.br, na raiz) e pelo GitHub Pages (endereço antigo, em /quaru).
# Variáveis (todas com padrão): EXPO_PUBLIC_BASE_URL ("" na Vercel, "/quaru" no Pages), URL_APP,
# EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY (valores PÚBLICOS; a service_role nunca entra aqui).
set -euo pipefail
cd "$(dirname "$0")/../mobile"
export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://gnmbrcdqljhtoxxkuekz.supabase.co}"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdubWJyY2RxbGpodG94eGt1ZWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NTY1MjQsImV4cCI6MjEwOTEzMjUyNH0.K3dqSYthWnC2NhLQ6TAVQJhXkwJB2vPZu-ps72Ud2YA}"
export URL_APP="${URL_APP:-https://app.quaru.com.br/}"
rm -rf dist
node scripts/gerar-novidades.mjs
npx expo export --platform web --output-dir dist
node scripts/pos-export-web.mjs dist
mkdir -p dist/exercicios
cp -rn public/exercicios/. dist/exercicios/ || true
touch dist/.nojekyll
mkdir -p dist/admin dist/treinador
cp -r ../admin/. dist/admin/
node ../scripts/gerar-catalogo-treinador.mjs
cp -r ../treinador/. dist/treinador/
node -e "const v={supabaseUrl:process.env.EXPO_PUBLIC_SUPABASE_URL,supabaseAnonKey:process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,urlApp:process.env.URL_APP};const t='window.QUARU_ADMIN = '+JSON.stringify(v)+';\n';require('fs').writeFileSync('dist/admin/config.js',t);require('fs').writeFileSync('dist/treinador/config.js',t)"
test -f dist/index.html && test -f dist/admin/index.html && test -f dist/treinador/index.html && test -f dist/treinador/catalogo.json
echo "build web ok: base='${EXPO_PUBLIC_BASE_URL-/quaru}' url=${URL_APP}"
