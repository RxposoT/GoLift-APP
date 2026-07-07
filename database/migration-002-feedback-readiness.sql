-- ============================================================
-- GoLift — Migration 002: Daily Readiness + Workout Feedback
-- Executar após schema base (`supabase-schema.sql`)
-- ============================================================

-- 1) Daily Readiness
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

-- 2) Workout Feedback
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

-- 3) Extras de perfil (questionário + gamificação)
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

-- 4) Índices
CREATE INDEX IF NOT EXISTS idx_daily_readiness_user_date
  ON public.daily_readiness(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_workout_feedback_user
  ON public.workout_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_feedback_session
  ON public.workout_feedback(session_id);

-- 5) RLS
ALTER TABLE public.daily_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own readiness" ON public.daily_readiness;
CREATE POLICY "Users view own readiness" ON public.daily_readiness
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own readiness" ON public.daily_readiness;
CREATE POLICY "Users insert own readiness" ON public.daily_readiness
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own readiness" ON public.daily_readiness;
CREATE POLICY "Users update own readiness" ON public.daily_readiness
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own feedback" ON public.workout_feedback;
CREATE POLICY "Users view own feedback" ON public.workout_feedback
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own feedback" ON public.workout_feedback;
CREATE POLICY "Users insert own feedback" ON public.workout_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6) Funções auxiliares de prontidão/adaptação
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
