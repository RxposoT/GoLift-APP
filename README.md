# GoLift 💪

Aplicação completa de fitness com **React Native (Expo)** + **backend Node.js/Express** + **Supabase**.

Acompanhamento de treinos, planos com IA, métricas de progresso, comunidades com chat em tempo real, gamificação, notificações push e modo offline.

---

## Funcionalidades

| Feature | Estado |
|---------|--------|
| Auth & Onboarding (email + social) | ✅ |
| Timer de treino com controlos | ✅ |
| Biblioteca de exercícios CRUD | ✅ |
| Treino ativo (séries, reps, peso) | ✅ |
| Métricas & Progresso (gráficos, calendário, recordes) | ✅ |
| Plano de treino com IA (Google Gemini) | ✅ |
| Relatório IA de desempenho | ✅ |
| Comunidades com chat em tempo real | ✅ |
| Perfil & Gamificação (níveis, streaks) | ✅ |
| Notificações Push (Expo + Edge Functions) | ✅ |
| Offline-First (cache + sync queue) | ✅ |
| Modo escuro/claro | ✅ |
| CI/CD (GitHub Actions + EAS Build) | ✅ |
| Testes unitários (Jest + RTN) | ✅ |

## Stack

### Frontend (`app/`)

- **React Native** 0.81.5 — **Expo** ~54
- **TypeScript** — **Expo Router** (file-based routing)
- **NativeWind** (Tailwind CSS para RN)
- **Expo Vector Icons** — **Reanimated** — **Gestures**
- **react-native-svg** (gráficos)
- **PostHog** (analytics)

### Backend (`backend/`)

- **Node.js** — **Express** 5
- **Supabase** (PostgreSQL + Auth + RealTime)
- **Stripe** (subscrições/pagamentos)
- **Google Gemini AI** (planos + relatórios)
- **Helmet** + **express-rate-limit** (segurança)

### Base de Dados (`database/`)

- **PostgreSQL** via Supabase
- Migrations versionadas (`migration-*`)
- Edge Functions para notificações push

---

## Estrutura do Projeto

```
GoLift/
├── app/                    # App React Native (Expo)
│   ├── src/
│   │   ├── app/            # Rotas (file-based)
│   │   ├── components/     # UI + feature components
│   │   ├── contexts/       # React Contexts (Auth, Theme, etc.)
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API, cache, queries
│   │   ├── styles/         # Design system (themes, tokens)
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Helpers
│   ├── __tests__/          # Testes Jest
│   └── eas.json            # EAS Build config
├── backend/                # API Node.js + Express
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   └── server.js
├── database/               # Migrations SQL
├── supabase/               # Edge Functions
├── .github/workflows/      # CI/CD
├── DESIGN.md               # Design system
├── PRODUCT.md              # Product register
└── PLAN.md                 # Development plan
```

---

## Começar a usar

### Pré-requisitos

- Node.js 18+
- npm / yarn
- Expo CLI
- Conta Supabase (gratuita)
- Chave API Google Gemini

### Frontend

```bash
cd app
npm install
npx expo start
```

### Backend

```bash
cd backend
npm install
cp .env.example .env   # configurar variáveis
npm run dev
```

### Variáveis de Ambiente (Backend)

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_KEY` | Service role key |
| `GEMINI_API_KEY` | Chave Google Gemini AI |
| `STRIPE_SECRET_KEY` | Chave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | Webhook Stripe |

---

## Design System

O GoLift segue um design system próprio documentado em [`DESIGN.md`](./DESIGN.md):

- **Modo escuro** como padrão (canvas `#080808`, azul `#0A84FF`)
- **Tipografia** com 11 níveis (Display a Caption)
- **Componentes UI** customizados (`app/src/components/ui/`)
- **Paletas** de cores para health, badges, charts

---

## Testes

```bash
cd app
npx jest              # correr todos os testes
npx jest --watch      # modo watch
```

31 testes distribuídos por 5 suites (Auth, Comunidades, Métricas, API helpers).

---

## License

MIT
