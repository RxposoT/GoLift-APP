-- ============================================================
-- GoLift — Migration 005: Push Notification Tokens
-- ============================================================

-- 16. Push Tokens
CREATE TABLE public.push_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Index
CREATE INDEX idx_push_tokens_user ON public.push_tokens(user_id);

-- Row Level Security
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Users manage their own push tokens
CREATE POLICY "Users insert own push tokens" ON public.push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own push tokens" ON public.push_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users delete own push tokens" ON public.push_tokens
  FOR DELETE USING (auth.uid() = user_id);
