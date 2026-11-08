# GoLift — Project Context

## Design System

Before any design/UI work, read:
- `PRODUCT.md` — product register, users, brand personality, design principles
- `DESIGN.md` — full design system documentation (colors, typography, components, elevation, motion, do's/don'ts)
- `.impeccable/design.json` — machine-readable design system metadata

## Conventions

- **Language**: Portuguese (PT-PT). All UI strings in Portuguese.
- **Framework**: React Native with Expo, Expo Router (file-based routing), NativeWind/Tailwind, TypeScript.
- **UI components**: Custom component library at `app/src/components/ui/`. Always use `Text`, `Button`, `Card`, `Input`, `EmptyState` from this library instead of raw RN components.
- **Typography**: Use the `variant` prop on `Text` (display, title1, title2, title3, headline, body, callout, subhead, footnote, caption). Avoid inline fontSize/fontWeight.
- **Colors**: All colors defined in `app/src/styles/themes.ts`. Dark/light mode through `useTheme()` and `useThemePreference()`. Use tokens, never raw hex values (badges and IMC health bars are documented exceptions).
- **Design register**: product (app UI with auth, forms, dashboards, navigation shell).
- **Brand**: Sleek · Modern · Premium. Apple Fitness+ inspired. Blue accent on dark mode canvas.
- **Testing**: Jest tests in `app/__tests__/`. Run with `cd app && npx jest`.

## Architecture

- `app/src/app/` — Expo Router screens (file-based routing)
- `app/src/components/` — Reusable UI and feature components
- `app/src/contexts/` — React contexts (Auth, Theme, Communities, etc.)
- `app/src/services/` — API services (Supabase client, caching)
- `app/src/styles/` — Theme definitions, design tokens, global CSS
- `app/src/hooks/` — Custom React hooks
- `app/src/utils/` — Utility functions

## Workflow obrigatório

- Ler `docs/WORKFLOW.md` antes de desenvolver.
- Implementar exclusivamente numa worktree ligada à tarefa e branch de feature correspondente.
- O checkout principal é referência de produção. Commits em main, develop, release/* e HEAD destacado são bloqueados pelos hooks.
- Uma tarefa aprovada, uma branch, uma worktree, um agente autor e um PR. A0 coordena até três especialistas ativos e reserva ficheiros partilhados.
- Usar Conventional Commits por alteração funcional coerente, até 300 linhas manuais alteradas e 10 ficheiros. PRs até 500 linhas e 15 ficheiros. Dividir entregas grandes antes de implementar.
- Ficheiros gerados e binários continuam sujeitos a revisão explícita. A exceção agregada de release aplica-se à promoção de features revistas.
- Instalar hooks com `node scripts/worktree.mjs hooks`. Criar features com o helper após atualizar origin/develop.
- Preservar commits pequenos através de merge commits. Branches publicadas recebem commits adicionais, sem reescrever o histórico partilhado.
- Outro agente revê o SHA atual. A0 verifica o relatório completo e a CI antes de integrar em develop. Cada novo head exige nova revisão.
- Main e deployment de produção exigem aprovação explícita do utilizador e cumprimento dos gates GitHub. Reportar gates bloqueados por falta de identidade elegível.
- Um autor por migração. Contratos partilhados e respetivos consumidores seguem a ordem de dependências aprovada no SDD.
