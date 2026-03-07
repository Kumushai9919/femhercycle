
-- Create app_role type for future use
-- We store role as text in profiles for simplicity

-- 1. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'partner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Cycle logs (owner only)
CREATE TABLE public.cycle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  cycle_day INTEGER,
  phase TEXT CHECK (phase IN ('menstruation', 'follicular', 'ovulation', 'luteal')),
  mood TEXT CHECK (mood IN ('Low', 'Okay', 'Good', 'Great', 'Amazing')),
  energy_level INTEGER CHECK (energy_level >= 0 AND energy_level <= 100),
  symptoms TEXT[],
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);
ALTER TABLE public.cycle_logs ENABLE ROW LEVEL SECURITY;

-- 3. Cycle settings
CREATE TABLE public.cycle_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  cycle_length INTEGER NOT NULL DEFAULT 28,
  period_length INTEGER NOT NULL DEFAULT 5,
  last_period_start DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cycle_settings ENABLE ROW LEVEL SECURITY;

-- 4. Share tokens
CREATE TABLE public.share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  partner_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  show_phase BOOLEAN NOT NULL DEFAULT true,
  show_mood BOOLEAN NOT NULL DEFAULT true,
  show_energy BOOLEAN NOT NULL DEFAULT true,
  show_calendar BOOLEAN NOT NULL DEFAULT true,
  show_routine BOOLEAN NOT NULL DEFAULT true,
  show_predicted_dates BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);
ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;

-- 5. Partner access
CREATE TABLE public.partner_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_id UUID NOT NULL REFERENCES public.share_tokens(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id, partner_id)
);
ALTER TABLE public.partner_access ENABLE ROW LEVEL SECURITY;

-- 6. AI routines cache
CREATE TABLE public.ai_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  log_date DATE NOT NULL,
  routines JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, phase, log_date)
);
ALTER TABLE public.ai_routines ENABLE ROW LEVEL SECURITY;

-- ==================
-- SECURITY DEFINER FUNCTIONS (to avoid RLS recursion)
-- ==================

-- Function to get user role without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id;
$$;

-- Function to check if user is partner of owner
CREATE OR REPLACE FUNCTION public.is_partner_of(_partner_id UUID, _owner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partner_access
    WHERE partner_id = _partner_id
      AND owner_id = _owner_id
      AND is_active = true
  );
$$;

-- Function to get the owner_id for a partner
CREATE OR REPLACE FUNCTION public.get_partner_owner_id(_partner_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT owner_id FROM public.partner_access
  WHERE partner_id = _partner_id AND is_active = true
  LIMIT 1;
$$;

-- ==================
-- RLS POLICIES
-- ==================

-- PROFILES: users read own; partners can read owner's name/avatar
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Partners can read linked owner profile"
  ON public.profiles FOR SELECT
  USING (public.is_partner_of(auth.uid(), id));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- CYCLE_LOGS: owner only, no partner access at all
CREATE POLICY "Owner can select own logs"
  ON public.cycle_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert own logs"
  ON public.cycle_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update own logs"
  ON public.cycle_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can delete own logs"
  ON public.cycle_logs FOR DELETE
  USING (auth.uid() = user_id);

-- CYCLE_SETTINGS: owner only
CREATE POLICY "Owner can select own settings"
  ON public.cycle_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert own settings"
  ON public.cycle_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update own settings"
  ON public.cycle_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- SHARE_TOKENS: owner can CRUD; anyone can read by token (for invite acceptance)
CREATE POLICY "Owner can manage own tokens"
  ON public.share_tokens FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Anyone can read token by value"
  ON public.share_tokens FOR SELECT
  USING (true);

-- PARTNER_ACCESS: owner and linked partner can read
CREATE POLICY "Owner can manage partner access"
  ON public.partner_access FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Partner can read own access"
  ON public.partner_access FOR SELECT
  USING (auth.uid() = partner_id);

-- AI_ROUTINES: owner only
CREATE POLICY "Owner can select own routines"
  ON public.ai_routines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert own routines"
  ON public.ai_routines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==================
-- TRIGGER: Auto-create profile on signup
-- ==================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    'owner'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
