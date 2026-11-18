#!/usr/bin/env bash
# Cria o historico de commits do app com voce como autor e o Claude como co-autor.
# Uso (Git Bash), dentro da pasta kairos-mobile:  bash commits.sh
set -e
T=$'\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01NsQFTaBDECP3tSks62p6Tj'
git init -b main
git add .gitignore package.json package-lock.json app.json tsconfig.json index.ts assets
git commit -m "chore: projeto Expo + TypeScript com dependencias${T}"
git add src/theme.ts
git commit -m "style: tokens de design KAIROS (preto, papel e amarelo)${T}"
git add src/api.ts
git commit -m "feat: camada de API, prioridade e mochila 0/1 local${T}"
git add src/store.tsx
git commit -m "feat: estado global com fallback offline e metricas de impacto${T}"
git add src/ui.tsx
git commit -m "feat: componentes de UI (anel, barra, segmented, tab bar)${T}"
git add src/screens/Welcome.tsx src/screens/Home.tsx
git commit -m "feat: telas de entrada por perfil e inicio${T}"
git add src/screens/Pedidos.tsx src/screens/Comunidades.tsx
git commit -m "feat: pedidos com rastreio e ranking de comunidades${T}"
git add src/screens/Entrega.tsx src/screens/Forms.tsx
git commit -m "feat: otimizacao de entrega, doacao e pedido de ajuda${T}"
git add src/screens/Perfil.tsx App.tsx
git commit -m "feat: perfil com conquistas, modo escuro e navegacao${T}"
git add README.md AGENTS.md commits.sh
git commit -m "docs: README com Ficha CitizenTech e cobertura da solucao${T}"
git log --oneline
