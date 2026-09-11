# Registration & Dashboard Upload Features

Adds business/worker verification uploads, a business phone field, social links, avatar uploads on both dashboards, and an admin-verified HACCP badge.

## Backend (one migration + 2 storage buckets)

### Storage buckets
- `avatars` (public) — business logos & worker profile photos (publicly displayed). RLS: owner can write/update/delete their own `{userId}/...` files; public read.
- `business-docs` (private) — business verification documents. RLS: owner + admin read/write only. (Worker ID & HACCP keep using the existing private `worker-docs` bucket.)

### Schema changes (migration)
- `business_profiles`: add `facebook_url`, `instagram_url`, `tiktok_url`, `google_maps_url` (text). Column grants exclude these from anon where appropriate.
- `worker_profiles`: add `haccp_verified boolean default false` (drives the public badge; only admins set it true).
- `worker_documents`: add `id_document_type text`, `haccp_document_url text`.
- New table `business_documents` (`user_id`, `doc_type`, `document_url`) with owner+admin RLS and grants.
- Update `worker_profiles_public` view / `listVisibleWorkers` projection to include `haccp_verified` + `avatar_url`.

## Business registration (`onboarding.tsx` → BusinessForm, Step 0)
1. **Business phone** — `tel` input, value pre-filled `"+351 "`, placeholder `"+351 9XX XXX XXX"`, after Business type, before City/Neighbourhood. Saved to `business_contacts.phone`.
2. **Verify your business** section — two radio-style cards (NIF document / Alvará). Selected card reveals a file upload (PDF/JPG/PNG, max 5 MB) → `business-docs` bucket, recorded in `business_documents`.
3. **Your online presence** — 4 optional URL inputs (Facebook, Instagram, TikTok, Google Maps + helper text) → `business_profiles`.
4. **Next validation** — on leaving Step 0, if no document AND no social/maps link, show an inline amber, non-blocking warning above the Next button. Does not hard-block.

## Worker registration (`onboarding.tsx` → WorkerForm, Documents step)
5. **Confirm your identity** — 4 radio-style document-type cards (CC / Passaporte / Título de Residência / Carta de Condução). Selecting one reveals a single front-side upload (JPG/PNG/PDF, 5 MB) → `worker-docs`, with the teal privacy notice. Saves `id_document_type` + `id_document_url`.
6. **Food hygiene certificate** (optional) — single upload (JPG/PNG/PDF, 5 MB) → `worker-docs`, saved to `haccp_document_url`.

## HACCP badge
- Small pill: shield-check icon, "HACCP certified", teal palette (`#E1F5EE` bg, `#085041` text, `#5DCAA5` border).
- Shown on `WorkerCard` and in `WorkerProfileModal` only when `haccp_verified` is true.
- `WorkerProfile` type gains a `haccp` boolean; talent data mapping reads `haccp_verified`.

## Dashboards (avatar uploads)
7. **Business dashboard / profile area** — circular logo/photo upload (JPG/PNG, max 2 MB) to `avatars`, store URL in `business_profiles.avatar_url`. Store/building placeholder icon when empty.
8. **Worker dashboard / profile area** — circular profile-photo upload (JPG/PNG, max 2 MB) to `avatars`, store URL in `worker_profiles.avatar_url`. User placeholder icon when empty.

Avatar upload UI is added at the top of the profile editors in `profile.tsx` (the dashboards link here as the profile area), giving both account types an immediate edit surface.

## Admin HACCP verification
- The console Workers drawer gets a control to mark `haccp_verified` true/false, so the badge only appears after admin approval (matching the existing verified-badge pattern).

## Notes
- All uploads validate size/type client-side before upload and show the specified hints.
- Reuses existing teal/gold design tokens and form primitives; no new color literals except the HACCP badge palette specified by you.
