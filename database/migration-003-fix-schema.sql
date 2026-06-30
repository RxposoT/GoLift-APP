-- ============================================================
-- GoLift — Migration 003: Fix schema (drop English → create PT)
-- Limpa o schema existente e recria com nomes portugueses
-- ============================================================

-- ============ DROP EXISTING (ENGLISH) TABLES ============
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.community_messages CASCADE;
DROP TABLE IF EXISTS public.community_members CASCADE;
DROP TABLE IF EXISTS public.communities CASCADE;
DROP TABLE IF EXISTS public.session_sets CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.workout_exercises CASCADE;
DROP TABLE IF EXISTS public.workouts CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;

-- ai_plans and ai_reports might have Portuguese names already
DROP TABLE IF EXISTS public.ai_plans CASCADE;
DROP TABLE IF EXISTS public.ai_reports CASCADE;
DROP TABLE IF EXISTS public.daily_phrases CASCADE;
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.admin_workout_exercises CASCADE;
DROP TABLE IF EXISTS public.admin_workouts CASCADE;

-- Drop profiles last (depended by many)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============ DROP EXISTING FUNCTIONS ============
DROP FUNCTION IF EXISTS public.get_user_records(UUID);
DROP FUNCTION IF EXISTS public.get_user_streak(UUID);
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.calculate_readiness(NUMERIC, INTEGER, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_corings(UUID, INTEGER);

-- ============ DROP EXISTING TRIGGER ============
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================
-- CREATE ALL TABLES (Portuguese naming)
-- ============================================================

-- 1. Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  tipo INTEGER DEFAULT 0,
  idade INTEGER,
  peso NUMERIC(5,1),
  altura NUMERIC(5,1),
  objetivo TEXT,
  peso_alvo NUMERIC(5,1),
  plano TEXT DEFAULT 'free' CHECK (plano IN ('free', 'pago')),
  plano_ativo_ate TIMESTAMPTZ,
  stripe_customer_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Exercises
CREATE TABLE public.exercises (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  video TEXT,
  grupo_tipo TEXT,
  sub_tipo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Workouts
CREATE TABLE public.workouts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  data_treino DATE DEFAULT CURRENT_DATE,
  is_ia INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Workout Exercises (junction)
CREATE TABLE public.workout_exercises (
  id BIGSERIAL PRIMARY KEY,
  workout_id BIGINT NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id BIGINT NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  ordem INTEGER DEFAULT 0,
  UNIQUE(workout_id, exercise_id)
);

-- 5. Workout Sessions
CREATE TABLE public.workout_sessions (
  id BIGSERIAL PRIMARY KEY,
  workout_id BIGINT NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data_inicio TIMESTAMPTZ DEFAULT NOW(),
  data_fim TIMESTAMPTZ,
  duracao_segundos INTEGER DEFAULT 0
);

-- 6. Workout Sets
CREATE TABLE public.workout_sets (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id BIGINT NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  numero_serie INTEGER NOT NULL,
  repeticoes INTEGER DEFAULT 0,
  peso NUMERIC(6,1) DEFAULT 0,
  data_serie TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Communities
CREATE TABLE public.communities (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  criador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pais TEXT,
  linguas TEXT,
  categoria TEXT,
  privada INTEGER DEFAULT 0,
  verificada INTEGER DEFAULT 0,
  imagem_url TEXT,
  criada_em TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Community Members
CREATE TABLE public.community_members (
  id BIGSERIAL PRIMARY KEY,
  comunidade_id BIGINT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  juntou_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comunidade_id, user_id)
);

-- 9. Community Messages
CREATE TABLE public.community_messages (
  id BIGSERIAL PRIMARY KEY,
  comunidade_id BIGINT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mensagem TEXT NOT NULL,
  criada_em TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Admin Workouts
CREATE TABLE public.admin_workouts (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ
);

-- 11. Admin Workout Exercises
CREATE TABLE public.admin_workout_exercises (
  id BIGSERIAL PRIMARY KEY,
  admin_workout_id BIGINT NOT NULL REFERENCES public.admin_workouts(id) ON DELETE CASCADE,
  exercise_id BIGINT NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  ordem INTEGER DEFAULT 0
);

-- 12. AI Reports
CREATE TABLE public.ai_reports (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  semana_inicio TEXT NOT NULL,
  conteudo JSONB NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, semana_inicio)
);

-- 13. AI Plans
CREATE TABLE public.ai_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mes TEXT NOT NULL,
  conteudo JSONB NOT NULL,
  parametros JSONB,
  descanso_segundos INTEGER DEFAULT 90,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mes)
);

-- Add arquivado column (for regeneration support)
ALTER TABLE public.ai_plans
  ADD COLUMN IF NOT EXISTS arquivado BOOLEAN DEFAULT FALSE;

-- 14. Daily Phrases
CREATE TABLE public.daily_phrases (
  id BIGSERIAL PRIMARY KEY,
  data DATE NOT NULL UNIQUE,
  frase TEXT NOT NULL,
  criada_em TIMESTAMPTZ DEFAULT NOW()
);

-- 15. User Subscriptions (Stripe tracking)
CREATE TABLE public.user_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MIGRATION 002: Daily Readiness + Workout Feedback
-- ============================================================

-- 16. Daily Readiness
CREATE TABLE IF NOT EXISTS public.daily_readiness (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  sono_horas NUMERIC(3,1),
  sono_qualidade INTEGER CHECK (sono_qualidade BETWEEN 1 AND 5),
  stress INTEGER CHECK (stress BETWEEN 1 AND 5),
  energia INTEGER CHECK (energia BETWEEN 1 AND 5),
  musculo_dolorido TEXT[],
  prontidao_score INTEGER CHECK (prontidao_score BETWEEN 1 AND 10),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, data)
);

-- 17. Workout Feedback
CREATE TABLE IF NOT EXISTS public.workout_feedback (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sentir_score INTEGER CHECK (sentir_score BETWEEN 1 AND 5),
  dor_zones TEXT[],
  dor_intensidade INTEGER CHECK (dor_intensidade BETWEEN 1 AND 5),
  energia_treino INTEGER CHECK (energia_treino BETWEEN 1 AND 5),
  comparacao TEXT CHECK (comparacao IN ('melhor', 'igual', 'pior')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id)
);

-- Profile extras (gamification + AI plan questionnaire)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS treino_dias_semana INTEGER,
  ADD COLUMN IF NOT EXISTS treino_duracao INTEGER,
  ADD COLUMN IF NOT EXISTS treino_equipamento TEXT,
  ADD COLUMN IF NOT EXISTS treino_nivel TEXT,
  ADD COLUMN IF NOT EXISTS treino_split TEXT,
  ADD COLUMN IF NOT EXISTS lesoes TEXT,
  ADD COLUMN IF NOT EXISTS preferencias_exercicios TEXT[],
  ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nivel INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_max INTEGER DEFAULT 0;

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_workouts_user ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_workout ON public.workout_sessions(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_session ON public.workout_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON public.workout_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community ON public.community_members(comunidade_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_community ON public.community_messages(comunidade_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_user ON public.ai_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_plans_user ON public.ai_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_readiness_user_date ON public.daily_readiness(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_workout_feedback_user ON public.workout_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_feedback_session ON public.workout_feedback(session_id);

-- ============ ROW LEVEL SECURITY ============
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_feedback ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR (SELECT tipo FROM public.profiles WHERE id = auth.uid()) = 1);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Insert profile on signup" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Workouts
CREATE POLICY "Users view own workouts" ON public.workouts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert workouts" ON public.workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own workouts" ON public.workouts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own workouts" ON public.workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Workout Exercises
CREATE POLICY "Users access own workout exercises" ON public.workout_exercises
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workouts WHERE id = workout_id AND user_id = auth.uid())
  );

-- Workout Sessions
CREATE POLICY "Users view own sessions" ON public.workout_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert sessions" ON public.workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Workout Sets
CREATE POLICY "Users access own sets" ON public.workout_sets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workout_sessions WHERE id = session_id AND user_id = auth.uid())
  );

-- Communities
CREATE POLICY "Anyone can view verified communities" ON public.communities
  FOR SELECT USING (verificada = 1);
CREATE POLICY "Members view their communities" ON public.communities
  FOR SELECT USING (
    verificada = 1 OR criador_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.community_members WHERE comunidade_id = id AND user_id = auth.uid())
  );
CREATE POLICY "Users create communities" ON public.communities
  FOR INSERT WITH CHECK (auth.uid() = criador_id);
CREATE POLICY "Creator update community" ON public.communities
  FOR UPDATE USING (criador_id = auth.uid());
CREATE POLICY "Creator delete community" ON public.communities
  FOR DELETE USING (criador_id = auth.uid());

-- Community Members
CREATE POLICY "Members view members" ON public.community_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.community_members WHERE comunidade_id = comunidade_id AND user_id = auth.uid())
    OR auth.uid() IN (SELECT criador_id FROM public.communities WHERE id = comunidade_id)
  );
CREATE POLICY "Users join communities" ON public.community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users leave communities" ON public.community_members
  FOR DELETE USING (auth.uid() = user_id);

-- Community Messages
CREATE POLICY "Members read messages" ON public.community_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.community_members WHERE comunidade_id = comunidade_id AND user_id = auth.uid())
  );
CREATE POLICY "Members send messages" ON public.community_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.community_members WHERE comunidade_id = comunidade_id AND user_id = auth.uid())
  );

-- Daily Readiness
CREATE POLICY "Users view own readiness" ON public.daily_readiness
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own readiness" ON public.daily_readiness
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own readiness" ON public.daily_readiness
  FOR UPDATE USING (auth.uid() = user_id);

-- Workout Feedback
CREATE POLICY "Users view own feedback" ON public.workout_feedback
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own feedback" ON public.workout_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ FUNCTIONS ============

-- Get user records (max weight per exercise)
CREATE OR REPLACE FUNCTION public.get_user_records(p_user_id UUID)
RETURNS TABLE(
  exercise_id BIGINT,
  exercise_name TEXT,
  peso NUMERIC,
  repeticoes INTEGER,
  data_serie TIMESTAMPTZ
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    ws.exercise_id,
    e.nome AS exercise_name,
    MAX(ws.peso) AS peso,
    (SELECT repeticoes FROM public.workout_sets ws2
     WHERE ws2.exercise_id = ws.exercise_id AND ws2.peso = MAX(ws.peso)
     AND ws2.session_id IN (SELECT id FROM public.workout_sessions WHERE user_id = p_user_id)
     LIMIT 1) AS repeticoes,
    MAX(ws.data_serie) AS data_serie
  FROM public.workout_sets ws
  JOIN public.workout_sessions sess ON ws.session_id = sess.id
  JOIN public.exercises e ON ws.exercise_id = e.id
  WHERE sess.user_id = p_user_id AND ws.peso > 0
  GROUP BY ws.exercise_id, e.nome
  ORDER BY MAX(ws.peso) DESC
  LIMIT 20;
$$;

-- Get streak
CREATE OR REPLACE FUNCTION public.get_user_streak(p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_streak INTEGER := 0;
  v_max_streak INTEGER := 0;
  v_temp_streak INTEGER := 0;
  v_dates DATE[];
  v_today DATE := CURRENT_DATE;
  v_diff INTEGER;
BEGIN
  SELECT ARRAY_AGG(DISTINCT sess.data_fim::DATE ORDER BY sess.data_fim::DATE DESC)
  INTO v_dates
  FROM public.workout_sessions sess
  WHERE sess.user_id = p_user_id AND sess.data_fim IS NOT NULL;

  IF v_dates IS NULL OR array_length(v_dates, 1) = 0 THEN
    RETURN jsonb_build_object('streak', 0, 'maxStreak', 0);
  END IF;

  v_diff := v_today - v_dates[1];
  IF v_diff <= 1 THEN
    v_current_streak := 1;
    FOR i IN 2..array_length(v_dates, 1) LOOP
      IF v_dates[i-1] - v_dates[i] = 1 THEN
        v_current_streak := v_current_streak + 1;
      ELSE
        EXIT;
      END IF;
    END LOOP;
  END IF;

  v_temp_streak := 1;
  v_max_streak := 1;
  FOR i IN 2..array_length(v_dates, 1) LOOP
    IF v_dates[i-1] - v_dates[i] = 1 THEN
      v_temp_streak := v_temp_streak + 1;
      IF v_temp_streak > v_max_streak THEN
        v_max_streak := v_temp_streak;
      END IF;
    ELSE
      v_temp_streak := 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('streak', v_current_streak, 'maxStreak', v_max_streak);
END;
$$;

-- Calculate readiness score
CREATE OR REPLACE FUNCTION public.calculate_readiness(
  p_sono_horas NUMERIC,
  p_sono_qualidade INTEGER,
  p_energia INTEGER,
  p_stress INTEGER,
  p_dor INTEGER DEFAULT 0
) RETURNS INTEGER LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  v_score NUMERIC;
BEGIN
  v_score := (
    COALESCE(p_sono_qualidade, 3) * 2.0 +
    COALESCE(p_energia, 3) * 2.0 +
    LEAST(COALESCE(p_sono_horas, 7) / 8.0 * 2.0, 2.0) +
    (6 - COALESCE(p_stress, 3)) * 2.0 +
    (6 - COALESCE(p_dor, 0)) * 2.0
  ) / 1.0;
  RETURN GREATEST(1, LEAST(ROUND(v_score)::INTEGER, 10));
END;
$$;

-- Get user corings for adaptive insights
CREATE OR REPLACE FUNCTION public.get_corings(p_user_id UUID, p_dias INTEGER DEFAULT 30)
RETURNS TABLE(
  data DATE,
  prontidao_score INTEGER,
  sono_horas NUMERIC,
  volume_total NUMERIC,
  sentir_medio NUMERIC,
  dor_count BIGINT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COALESCE(r.data, f.data) AS data,
    r.prontidao_score,
    r.sono_horas,
    f.volume_total,
    f.sentir_medio,
    f.dor_count
  FROM (
    SELECT data, prontidao_score, sono_horas
    FROM public.daily_readiness
    WHERE user_id = p_user_id
      AND data >= CURRENT_DATE - p_dias
  ) r
  FULL JOIN (
    SELECT
      ws.data_fim::DATE AS data,
      SUM(ws2.peso * ws2.repeticoes) AS volume_total,
      AVG(wf.sentir_score)::NUMERIC(3,1) AS sentir_medio,
      COUNT(*) FILTER (WHERE wf.dor_zones IS NOT NULL AND array_length(wf.dor_zones, 1) > 0) AS dor_count
    FROM public.workout_sessions ws
    LEFT JOIN public.workout_feedback wf ON wf.session_id = ws.id
    LEFT JOIN public.workout_sets ws2 ON ws2.session_id = ws.id
    WHERE ws.user_id = p_user_id
      AND ws.data_fim >= CURRENT_DATE - p_dias
    GROUP BY ws.data_fim::DATE
  ) f ON r.data = f.data
  ORDER BY COALESCE(r.data, f.data) DESC;
$$;

-- ============ TRIGGER: Auto-create profile on user signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, tipo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'tipo')::INTEGER, 0)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
