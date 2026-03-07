
-- Allow partners to read linked owner's cycle_settings
CREATE POLICY "Partner can read owner settings"
ON public.cycle_settings
FOR SELECT
TO authenticated
USING (public.is_partner_of(auth.uid(), user_id));

-- Allow partners to read linked owner's cycle_logs (for calendar/dashboard)
CREATE POLICY "Partner can read owner logs"
ON public.cycle_logs
FOR SELECT
TO authenticated
USING (public.is_partner_of(auth.uid(), user_id));
