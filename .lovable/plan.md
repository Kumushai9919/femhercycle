

# HerCycle — Implementation Plan

## Prerequisites

Before any code can be written, we need backend infrastructure:

1. **Connect Supabase** — The project has no Supabase connection. We need to connect one for auth, database, and edge functions.
2. **AI Provider** — The prompt requests Anthropic Claude, but Lovable AI (already configured via `LOVABLE_API_KEY`) provides equivalent models without needing an additional API key. I recommend using **Lovable AI with `google/gemini-3-flash-preview`** instead of Claude — same quality, zero setup. If you strongly prefer Claude, you'll need to add an `ANTHROPIC_API_KEY` secret after connecting Supabase.
3. **Google OAuth** — After Supabase is connected, Google OAuth must be configured in the Supabase dashboard (Google Cloud Console client ID/secret → Supabase Auth → Providers → Google).

## Build Phases (10 steps)

### Phase 1: Infrastructure & Schema
- Connect Supabase
- Create all 6 tables (`profiles`, `cycle_logs`, `cycle_settings`, `share_tokens`, `partner_access`, `ai_routines`) with RLS policies
- Create `handle_new_user` trigger on `auth.users` to auto-create profile
- Use a `has_role` security definer function to avoid RLS recursion on profiles

### Phase 2: Design System & Layout Shell
- Add Google Fonts (Cormorant Garamond + DM Sans) to `index.html`
- Add custom Tailwind colors (blush, rose, deep-rose, plum, lavender, mist, cream, charcoal) + phase colors
- Create `MobileLayout` wrapper (max-w-[430px], centered, shadow)
- Create `BottomNav` component (owner: 5 tabs, partner: 3 tabs) with frosted glass effect
- Create shared components: `PhaseChip`, `AiBadge`, `PhaseCard`

### Phase 3: Landing Page + Auth
- Landing page (`/`) with gradient bg, HerCycle branding, Google OAuth button (Korean text)
- Auth context/hook using `onAuthStateChange` + `getSession`
- Auto-redirect: logged-in owner → `/dashboard`, partner → `/partner/[owner_id]`
- Protected route wrapper

### Phase 4: Owner Dashboard (`/dashboard`)
- Phase calculation utility (from `cycle_settings`: menstruation/follicular/ovulation/luteal)
- Hero greeting card with current phase
- Quick stats grid (cycle length, next period, today's mood/energy)
- Seed data utility: on first login, populate 14 days of `cycle_logs` + `cycle_settings`
- AI insight card (placeholder initially, wired in Phase 10)

### Phase 5: Calendar (`/calendar`)
- Custom month calendar grid with phase-colored days
- Month navigation
- Tap day → bottom sheet (phase info + suggestions)
- Phase legend

### Phase 6: Daily Log (`/log`)
- Mood selector (5 emojis), symptom chips, energy slider, note textarea
- Upsert to `cycle_logs` on save
- Recent logs list (last 5)
- All Korean labels

### Phase 7: Settings (`/settings`)
- Profile section (avatar, name)
- Cycle setup (date picker, sliders for cycle/period length)
- Partner sharing: generate invite link, copy button, privacy toggles
- Sign out

### Phase 8: Invite Page (`/invite/:token`)
- Public page: fetch token, show owner name, Google sign-in button
- On auth: create partner profile, link via `partner_access`, update `share_tokens`
- Redirect to partner dashboard

### Phase 9: Partner Views
- `/partner/:ownerId` — Phase card, abstracted mood/energy, support tips, upcoming events
- `/partner/:ownerId/calendar` — Same calendar, partner-framed day suggestions
- `/partner/:ownerId/routine` — Routine cards with "how to help" tips
- 3-tab bottom nav (no Log tab)

### Phase 10: AI Routines (Edge Function)
- Edge function `generate-routine`: receives phase + recent logs, calls Lovable AI, returns 5 routine objects in Korean, caches in `ai_routines`
- Owner `/routine` page: tab filter, routine cards with AI badge
- Wire AI insight card on dashboard
- Partner support tips via same edge function with partner-specific prompt

## Technical Details

- **Phase calculation** is a pure function shared across components — no DB query needed beyond `cycle_settings`
- **RLS**: `cycle_logs` uses `auth.uid() = user_id` for all operations; no partner access policy at all. `share_tokens` has a public SELECT policy filtered by `token` column for invite acceptance.
- **AI caching**: keyed on `(user_id, phase, log_date)` — skip API call if cache hit exists
- **Edge function** uses Lovable AI gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) with tool calling for structured JSON output
- **Fonts** loaded via `<link>` tags in `index.html`

## First Step

I need to connect Supabase to the project before any implementation can begin.

