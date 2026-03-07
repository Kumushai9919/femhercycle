
CREATE OR REPLACE FUNCTION public.get_invite_owner_name(_token text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.full_name
  FROM share_tokens st
  JOIN profiles p ON p.id = st.owner_id
  WHERE st.token = _token AND st.is_active = true
  LIMIT 1;
$$;
