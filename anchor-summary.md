
```
## Goal
- Rebuild GoLift with a free/premium business model, AI-powered premium features (Gemini 2.0 Flash), Duolingo-style gamified UX, Whoop-like memory across workouts, and health app integration.

## Constraints & Preferences
- **Free plan**: exercise tracking (Hevy-like) + communities
- **Premium plan (€5-10/month)**: AI weekly report, AI workout plan (1 active, can regenerate), responsive post-workout feedback, real-time adaptive workouts
- **Only premium users access AI**; free users never touch Gemini
- **Duolingo-style UI**: streaks, XP, levels, animations, gamification, sound/haptics
- **Whoop-like memory**: app remembers user patterns and correlates sleep/readiness/pain with performance
- **iOS + Android** (Expo Go for now); Apple Health/Health Connect integration later
- **Total freedom to implement**, loops of verification and tuning

## Progress
### Done
- Full code analysis of original GoLift frontend and backend
- Created `src/lib/supabase.ts` with AsyncStorage persistence
- Installed `@supabase/supabase-js` and `posthog-react-native`
- Created `supabase-schema.sql` (15 tables + indexes + RLS + functions + trigger)
- Created backend (`server.js`, `package.json`, `.env.example`) — endpoints: health, daily-phrase, AI report/plan/import-day, Stripe checkout/portal/webhook/verify
- Rewrote all frontend API services (auth, user, exercises, workouts, metrics, communities, plano) for Supabase
- Rewrote `AuthContext.tsx` (supabase.auth.onAuthStateChange) and `CommunitiesContext.tsx` (Realtime channel)
- Removed obsolete files: `_request.ts`, `server-config.ts`, `storage.ts`, `admin.ts`, old cleartext plugin, admin screens
- Added PostHog Provider in `_layout.tsx`
- Updated `.env` with correct Supabase/PostHog/backend vars
- Migrated AI provider **Groq → Gemini 2.0 Flash** in backend/server.js (Groq fetch → `@google/generative-ai` SDK, `responseMimeType: 'application/json'`)
- Created `database/migration-002-feedback-readiness.sql`: `daily_readiness` table, `workout_feedback` table, profile extras (treino_dias_semana, xp, nivel, streak, etc.), `calculate_readiness()` function, `get_corings()` function, RLS policies
- Added `arquivado` column to `ai_plans` (support plan regeneration)
- Added backend routes:
  - `POST /api/ai/feedback/:userId` — saves feedback + Gemini-generated personalized response with pain pattern analysis
  - `POST /api/ai/adapt/:userId` — reads readiness + pain + today's workout → Gemini returns adapted workout (load reduction, exercise substitutions, day-off suggestion)
  - Updated plan generation prompt to use new profile columns (lesoes, preferencias_exercicios, treino_nivel, treino_equipamento, etc.)
- Updated plan generation to archive old plans on regeneration instead of blocking
- Created `src/components/PainBodyMap.tsx` — SVG body map (front + back) with 16 tappable zones, toggle selection, intensity indicator
- Created `src/app/workout/feedback.tsx` — post-workout feedback screen with emoji picker (sentir score), body map (pain zones), energy picker, step-by-step flow, and premium AI response display
- Created `src/app/checkin.tsx` — daily readiness check-in screen (sleep hours, sleep quality, energy, stress, pain body map, steps indicator)
- Created `src/components/StreakBar.tsx` — gamification bar with streak flame, XP progress bar, level display
- Added `planoApi.submitFeedback()` and `planoApi.adaptWorkout()` to frontend API service
- Updated `workout/[id].tsx` to capture session ID on save and navigate to feedback screen instead of summary
- Updated `(tabs)/index.tsx` (home) with:
  - Check-in prompt banner (if not done today) or "check-in feito" badge
  - StreakBar with XP + level from profile
  - Profile fetch for `xp`, `nivel`, `streak`

### In Progress
- (none)

### Blocked
- SQL migration (migration-002) needs to be executed in Supabase Studio
- `.env` needs `GEMINI_API_KEY` (user gets from aistudio.google.com)

## Key Decisions
- **Free/premium model**: Free = retention (tracking + social), Premium = revenue (AI features gated by subscription)
- **Gemini 2.0 Flash**: 1500 req/day free tier, negligible cost scaling, sufficient for all AI features
- **Duolingo gamification**: streaks, XP, levels, animations applied across all screens
- **Health integration (future)**: Apple Health + Health Connect for automatic sleep/HRV/energy → readiness score; Whoop API as optional premium add-on
- **Smart Load**: AI automatically adjusts today's workout based on readiness/dor/feedback without asking user; user can override
- **Post-workout feedback flow**: save session → feedback screen (body map + sliders) → AI response (premium) → summary screen
- **1 active plan**: regenerate archives old, creates new
- **Weekly report**: auto-generated Monday + on-demand regeneration
- **Check-in flow**: 5-step (sleep hours → sleep quality → energy → stress → pain body map), bottom "Continuar" button through steps, then "Guardar e Começar"
- **Cost analysis**: ~43 Gemini calls/user/month ≈ €0.016 cost; at €5-10/month subscription = 99.7% margin

## Next Steps
1. Execute SQL migration in Supabase Studio (migration-002)
2. Preencher `.env` com GEMINI_API_KEY (user obtains from aistudio.google.com)
3. Install missing deps in app: `npx expo install expo-haptics`
4. Verify types compile: `cd app && npx tsc --noEmit`
5. Run app and test the flows: check-in → workout → feedback → AI response
6. Create weekly report dashboard screen (auto-generated on Mondays)
7. Add health app integration (react-native-health for iOS, react-native-google-fit for Android)

## Relevant Files (new/updated today)
- `/home/tomas/GoLift/backend/server.js` — Gemini SDK + feedback + adapt routes
- `/home/tomas/GoLift/backend/package.json` — added `@google/generative-ai`
- `/home/tomas/GoLift/backend/.env.example` — GORQ_API_KEY → GEMINI_API_KEY
- `/home/tomas/GoLift/database/migration-002-feedback-readiness.sql` — new
- `/home/tomas/GoLift/app/src/components/PainBodyMap.tsx` — new
- `/home/tomas/GoLift/app/src/components/StreakBar.tsx` — new
- `/home/tomas/GoLift/app/src/app/workout/feedback.tsx` — new
- `/home/tomas/GoLift/app/src/app/checkin.tsx` — new
- `/home/tomas/GoLift/app/src/app/(tabs)/index.tsx` — updated (check-in prompt, StreakBar, profile fetch)
- `/home/tomas/GoLift/app/src/app/workout/[id].tsx` — updated (navigate to feedback after save)
- `/home/tomas/GoLift/app/src/services/api/plano.ts` — updated (submitFeedback, adaptWorkout)
```