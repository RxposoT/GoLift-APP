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
