
CREATE OR REPLACE FUNCTION public.accept_invite(_token text, _partner_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _token_row share_tokens%ROWTYPE;
BEGIN
  -- Find and validate token
  SELECT * INTO _token_row FROM share_tokens WHERE token = _token AND is_active = true AND partner_id IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or already used invite token';
  END IF;

  -- Prevent self-invite
  IF _token_row.owner_id = _partner_id THEN
    RAISE EXCEPTION 'Cannot invite yourself';
  END IF;

  -- Update partner profile role
  UPDATE profiles SET role = 'partner' WHERE id = _partner_id;

  -- Create partner access
  INSERT INTO partner_access (owner_id, partner_id, token_id)
  VALUES (_token_row.owner_id, _partner_id, _token_row.id)
  ON CONFLICT (owner_id, partner_id) DO UPDATE SET is_active = true, token_id = _token_row.id;

  -- Mark token as used
  UPDATE share_tokens SET partner_id = _partner_id, accepted_at = now() WHERE id = _token_row.id;

  RETURN _token_row.owner_id;
END;
$$;
