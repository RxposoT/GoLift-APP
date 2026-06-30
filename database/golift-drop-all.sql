-- ============================================================
-- GoLift — DROP ALL (limpeza total do schema)
-- Ordem inversa das dependências para evitar erros de FK
-- ============================================================

-- 1. TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. FUNCTIONS
DROP FUNCTION IF EXISTS public.get_corings(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.calculate_readiness(NUMERIC, INTEGER, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_user_streak(UUID);
DROP FUNCTION IF EXISTS public.get_user_records(UUID);

-- 3. RLS POLICIES (migration-002)
DROP POLICY IF EXISTS "Users insert own feedback" ON public.workout_feedback;
DROP POLICY IF EXISTS "Users view own feedback" ON public.workout_feedback;
DROP POLICY IF EXISTS "Users update own readiness" ON public.daily_readiness;
DROP POLICY IF EXISTS "Users insert own readiness" ON public.daily_readiness;
DROP POLICY IF EXISTS "Users view own readiness" ON public.daily_readiness;

-- 4. RLS POLICIES (schema base)
DROP POLICY IF EXISTS "Members send messages" ON public.community_messages;
DROP POLICY IF EXISTS "Members read messages" ON public.community_messages;
DROP POLICY IF EXISTS "Users leave communities" ON public.community_members;
DROP POLICY IF EXISTS "Users join communities" ON public.community_members;
DROP POLICY IF EXISTS "Members view members" ON public.community_members;
DROP POLICY IF EXISTS "Creator delete community" ON public.communities;
DROP POLICY IF EXISTS "Creator update community" ON public.communities;
DROP POLICY IF EXISTS "Users create communities" ON public.communities;
DROP POLICY IF EXISTS "Members view their communities" ON public.communities;
DROP POLICY IF EXISTS "Anyone can view verified communities" ON public.communities;
DROP POLICY IF EXISTS "Users access own sets" ON public.workout_sets;
DROP POLICY IF EXISTS "Users insert sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users view own sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users access own workout exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "Users delete own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users update own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users insert workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users view own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Insert profile on signup" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;

-- 5. TABLES (reverse dependency order)
DROP TABLE IF EXISTS public.workout_feedback CASCADE;
DROP TABLE IF EXISTS public.daily_readiness CASCADE;
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.daily_phrases CASCADE;
DROP TABLE IF EXISTS public.ai_plans CASCADE;
DROP TABLE IF EXISTS public.ai_reports CASCADE;
DROP TABLE IF EXISTS public.admin_workout_exercises CASCADE;
DROP TABLE IF EXISTS public.admin_workouts CASCADE;
DROP TABLE IF EXISTS public.community_messages CASCADE;
DROP TABLE IF EXISTS public.community_members CASCADE;
DROP TABLE IF EXISTS public.communities CASCADE;
DROP TABLE IF EXISTS public.workout_sets CASCADE;
DROP TABLE IF EXISTS public.workout_sessions CASCADE;
DROP TABLE IF EXISTS public.workout_exercises CASCADE;
DROP TABLE IF EXISTS public.workouts CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
