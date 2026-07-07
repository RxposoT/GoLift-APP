# Migration 004: Weight History Table
# Adiciona tabela para sincronizar histórico de peso semanal com o backend

CREATE TABLE IF NOT EXISTS public.weight_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week TEXT NOT NULL,
  weight NUMERIC(5,1) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_weight_history_user ON public.weight_history(user_id, week DESC);

-- RLS
ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own weight history" ON public.weight_history;
CREATE POLICY "Users view own weight history" ON public.weight_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own weight history" ON public.weight_history;
CREATE POLICY "Users insert own weight history" ON public.weight_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own weight history" ON public.weight_history;
CREATE POLICY "Users update own weight history" ON public.weight_history
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own weight history" ON public.weight_history;
CREATE POLICY "Users delete own weight history" ON public.weight_history
  FOR DELETE USING (auth.uid() = user_id);
