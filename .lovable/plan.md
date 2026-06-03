# Shiftinger — Rebuild Plan

Rebuild the ShiftBridge concept as **Shiftinger**: a privacy-first, Portugal-focused flexible-work marketplace connecting hospitality workers (immigrants, students, career-changers) with businesses. Same brand DNA, a cleaner more minimal layout, and a real backend (Lovable Cloud).

## Brand carried over (kept verbatim)
- **Colors:** teal `#006C6B` (light `#00847F`, dark `#003D3B`), gold `#C9A84C`, dark `#1A1A1A`, off-white `#F7F5F0`.
- **Fonts:** DM Serif Display (headings) + DM Sans (body).
- **Concept:** skill-based matching with match %, masked identities, location revealed only after agreement, verified accounts, atividade-aware.
- **Name change:** every "ShiftBridge" → "Shiftinger".

## Backend (Lovable Cloud)
Auth: Google sign-in + email/password with **email confirmation link**. One email = **one role only** (worker OR business, enforced at signup). Core tables: `profiles` (role, status, email), `worker_profiles`, `business_profiles`, `jobs`, `applications`, `availability`, `conversations`, `messages`, `reviews`, `registration_counters`, plus a `user_roles` table for admin. RLS on everything; WhatsApp number exposed only to paid/early-bird businesses.

## Phasing (you review after each phase)

### Phase 1 — Minimal redesign + auth + registration  ← starts now
1. **Layout selection first:** I generate 3 rendered minimal homepage/layout directions (locked palette + fonts) and you pick one.
2. Enable Lovable Cloud; build auth (Google + email/password + confirmation link).
3. Registration: pick role → signup → verify email → role-specific profile form → submit → **"We'll review and confirm within 48 hours"** message.
4. **Free-tier counters:** "First 500 workers free" / "First 100 businesses free". Live counts shown in the registration UI and incremented on signup; one email cannot register as both roles.
5. Enhanced form data: **all nationalities**, **all Portuguese cities**, role icons reflecting job type (barista = coffee cup, etc.).
6. **Pricing page hidden** (route + nav removed, kept in code for later).
7. Public pages rebuilt minimal: Home, Find Work (jobs), Find Talent, For Businesses.

### Phase 2 — Profiles, dashboards & admin approval
- **Manual admin approval:** admin dashboard lists pending users; approve/reject. On approval the user receives a "you're verified" email linking to their profile (workers → fill profile/availability/apply; businesses → post jobs/browse workers).
- Worker profile: full editable profile (all fields they filled), bio, work-type preference, availability with WhatsApp number + open/close toggle for messages, logout.
- Worker availability shows in **Find a Talent** (WhatsApp visible only to paid/early-bird businesses).
- Business profile + dashboard skeleton.

### Phase 3 — Jobs, applications & matching
- Businesses post/edit jobs (icons per role); workers browse & apply.
- **Matching bar:** matched criteria green, unmatched red, with a match % — same logic on both worker and owner sides.
- Dashboards: applied / working / rejected / earned.

### Phase 4 — Chat, agree-to-work, location reveal & reviews
- Chat opens **only after confirmation** (both sides).
- After chat opens both mark **"agree to work"**; owner clicks **"agree & send business location"** → exact location revealed to worker.
- On completion both click **End** + leave a **rating & review** to close the job.
- Anyone who ignores (doesn't review/close) is **blocked from posting/applying** until resolved.

## Minimal layout direction
Lighter than the original: more whitespace, restrained motion, simpler nav, fewer gradients, content-forward sections. Exact composition decided by the direction you pick in Phase 1, step 1.

## Technical notes
- Stack: TanStack Start + Tailwind v4 (tokens in `src/styles.css`), Lovable Cloud (Supabase) for auth/data, server functions for data access.
- Email (verification + approval notifications) via Lovable Email; needs a sender domain set up when we reach those steps.
- Matching computed server-side from worker roles/availability vs job requirements.

After you approve, I'll begin Phase 1 by generating the 3 minimal layout directions for you to choose from.