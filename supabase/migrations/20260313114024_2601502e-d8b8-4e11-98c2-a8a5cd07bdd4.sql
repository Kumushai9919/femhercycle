
-- Table to track per-user daily AI usage
CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  request_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, usage_date)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage
CREATE POLICY "Users can read own usage" ON public.ai_usage
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert own usage
CREATE POLICY "Users can insert own usage" ON public.ai_usage
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update own usage
CREATE POLICY "Users can update own usage" ON public.ai_usage
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Function to check and increment usage (returns remaining count or -1 if limit exceeded)
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(_user_id uuid, _daily_limit integer DEFAULT 3)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_count integer;
BEGIN
  -- Upsert: insert or get existing
  INSERT INTO ai_usage (user_id, usage_date, request_count)
  VALUES (_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  -- Get current count
  SELECT request_count INTO _current_count
  FROM ai_usage
  WHERE user_id = _user_id AND usage_date = CURRENT_DATE;

  -- Check limit
  IF _current_count >= _daily_limit THEN
    RETURN -1;
  END IF;

  -- Increment
  UPDATE ai_usage
  SET request_count = request_count + 1
  WHERE user_id = _user_id AND usage_date = CURRENT_DATE;

  RETURN _daily_limit - _current_count - 1;
END;
$$;
