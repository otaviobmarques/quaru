# Quaru — app de treinos

O **Quaru** é um app de treinos de academia (Expo / React Native + TypeScript), desenvolvido pela **Domma Tecnologia**. Funciona no Android e na web (PWA) e roda em **modo local** por padrão; a sincronização com Supabase é opcional.

Site (versão web publicada): https://otaviobmarques.github.io/quaru/

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `mobile/` | App Expo (src/, __tests__/, assets/, public/, scripts/, plugins/, modules/) |
| `backend/` | Esquema e migrações Supabase, scripts e testes (vitest) |
| `docs/` | Especificação, ADRs, diagramas, modelo de ameaças, pesquisa, fontes/licenças; `README-tecnico.md` |
| `design/` | Telas finais v3.2 (`telas-v3.2/`, com `tokens-v3.2.md`), identidade visual, imagens v0.4.3, copy (RedBox) |
| `scripts/` | Capturas de tela, servidores locais, verificação web, atalho `pos-export-web.mjs` |
| `capturas/` | Capturas de tela do app |
| `.github/workflows/` | Deploy no GitHub Pages |
| raiz | `package.json` (atalhos para mobile/), `openapi.yaml`, CHANGELOG, glossário, avisos de terceiros, scripts de captura/verificação web |

**Mídia de exercícios:** as 876 animações WebP (2.619 arquivos, com variantes) ficam em `mobile/public/exercicios/` (uma única cópia) e são publicadas em `/quaru/exercicios/`.

**Publicação:** a cada push na `main`, `.github/workflows/deploy-pages.yml` roda `npm ci`, exporta a web, roda o pós-export (`mobile/scripts/pos-export-web.mjs`) e publica com GitHub Pages (em Settings → Pages, a origem precisa ser **GitHub Actions**).

## Como rodar

```bash
cd mobile
npm install
cp .env.example .env   # opcional; sem valores = modo local
npx expo start
npm test
```

Exportação web (GitHub Pages, baseUrl `/quaru`): com `experiments.baseUrl: "/quaru"` no `app.json`,

```bash
npx expo export --platform web
```

O resultado fica em `mobile/dist/`.

Backend: `cd backend && npm install && npm test`.

## Variáveis de ambiente

Veja `mobile/.env.example` (sem valores):

- `EXPO_PUBLIC_SUPABASE_URL` — URL do projeto Supabase (`https://<projeto>.supabase.co`)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — chave **anon** (pública, protegida por RLS). Nunca use a service_role no app.

Sem as duas, o app fica no modo local. Nunca faça commit de `.env`.

## Créditos

- Desenvolvimento: **Domma Tecnologia**
- Design (telas, identidade, tokens): **RedBox**
- Catálogo de exercícios: **Free Exercise DB** (domínio público / Unlicense)
- Fotos: **Pexels** e **Pixabay**, conforme as licenças registradas em `THIRD_PARTY_NOTICES.md` e `docs/fontes/`
