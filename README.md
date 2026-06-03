# Shiftinger

Privacy-first flexible-work marketplace connecting hospitality workers with businesses across Portugal. Built with **TanStack Start** (React 19 + Vite) and **Lovable Cloud** (Supabase: Postgres, Auth, Realtime).

The codebase is standard and **fully portable** — it can be exported to GitHub and pointed at any Supabase instance (or self-hosted Supabase) with only environment-variable changes. No proprietary lock-in.

---

## Quick start (local / self-hosted)

```bash
bun install        # or npm install
bun dev            # start the dev server
bun run build      # production build
```

### Environment variables

Create a `.env` with:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | client | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client | Supabase anon/publishable key |
| `SUPABASE_URL` | server (SSR) | same URL, server side |
| `SUPABASE_PUBLISHABLE_KEY` | server (SSR) | same anon key, server side |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | admin operations (never exposed to browser) |

On Lovable Cloud these are injected automatically. When migrating, copy them from your own Supabase project settings.

---

## Architecture

- **Frontend**: file-based routes in `src/routes/`. Public pages at top level; authenticated pages under `src/routes/_authenticated/` (client-rendered gate that redirects to `/auth`).
- **Auth**: email/password with email-confirmation link + Google sign-in. One email = one role (worker OR business), enforced at signup.
- **Data access**: the browser Supabase client (`src/integrations/supabase/client.ts`) with **Row-Level Security** enforcing all access rules. Sensitive multi-step actions use Postgres `SECURITY DEFINER` RPCs.
- **Matching engine**: `src/lib/matching.ts` — scores a worker against a job (role, languages, pay, atividade, work type), returning a 0–100 score and a green/red criteria breakdown. Used identically on worker and business sides.

---

## Database structure

All tables live in the `public` schema with RLS enabled and explicit GRANTs.

| Table | Purpose |
| --- | --- |
| `profiles` | Core account: `email`, `account_type` (worker/business), `full_name`, `status` |
| `worker_profiles` | Worker details, skills, languages, availability, WhatsApp, rating, `verified` |
| `business_profiles` | Business details, category, city, rating, `verified`, `is_early_bird` |
| `business_locations` | Exact address — revealed to a worker only after the business agrees |
| `jobs` | Shifts posted by businesses (role, schedule, pay, spots, requirements) |
| `applications` | Worker applications with `match_score` + `matched_criteria` |
| `conversations` | Private chat opened after both confirm; tracks agree/end flags |
| `messages` | Chat messages (Realtime-enabled) |
| `reviews` | Closing rating + comment from both sides |
| `registration_counters` | First 500 workers / first 100 businesses free tracking |
| `user_roles` | Admin/moderator roles (kept separate from profiles for security) |

### Account status flow

```
incomplete  →  pending_review  →  approved
   (signup)     (profile done)     (admin approves; can apply/post)
                                 ↘  rejected
blocked  ←  ignored closing a finished job (cannot post/apply until resolved)
```

### Job lifecycle

```
apply → business confirm + worker confirm → chat opens
   → both "agree to work" (business sends location) → work happens
   → both "end job" → both leave review → job closed, ratings updated
```

---

## Key server-side functions (RPCs)

Defined as Postgres `SECURITY DEFINER` functions, each authorizing via `auth.uid()`:

- `confirm_application(app_id)` — opens a conversation when both sides confirm.
- `set_agreement(conversation_id, send_location)` — agree to work; reveal address.
- `end_job(conversation_id)` — mark finished.
- `submit_review(conversation_id, rating, comment)` — averages ratings, closes job when both review.
- `has_pending_review(user)` — blocks posting/applying for users who ignore reviews.
- `has_role(user, role)` — admin checks inside RLS policies.

---

## Admin access

Roles are stored in `user_roles`. To grant admin (run once against your DB):

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<the-user-uuid>', 'admin')
ON CONFLICT DO NOTHING;
```

Admins then see the **Admin** button in the dashboard to approve/reject pending accounts at `/admin`.

---

## Deployment & migration to your own hosting

The app is a standard TanStack Start project — deploy the build output to any Node/edge host (Cloudflare, Vercel, your own server).

To migrate the backend off Lovable Cloud:
1. Create a Supabase project (cloud or self-hosted).
2. Apply the SQL migrations (the schema, RLS, GRANTs, RPCs, triggers documented above) to the new database.
3. Point the environment variables at the new project.
4. Configure Auth providers (email confirmation + Google) in the new project.

No Lovable-specific runtime dependency is required for the app to function — the only Lovable-specific helper is the Google OAuth broker (`src/integrations/lovable/`), which can be swapped for `supabase.auth.signInWithOAuth('google', …)` with your own Google OAuth credentials when self-hosting.
