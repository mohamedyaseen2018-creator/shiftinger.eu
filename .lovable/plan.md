# For Workers page + "How it works" steps + pricing teaser

## Goal
Create a new **For Workers** page that mirrors the existing **For Business** page, add a visual step-by-step "How it works" section (with screenshots) to **both** pages, and add a pricing section that is visibly blurred with a "Coming soon" overlay on both.

## 1. New route: `/for-workers`
- New file `src/routes/for-workers.tsx`, structured like `for-businesses.tsx` (hero + steps + features + pricing), using `SiteLayout`.
- Own `head()` metadata: title "For workers — Shiftinger", worker-focused description, og:title/og:description.
- Hero: worker-oriented headline + subtitle, primary CTA → `/register`, secondary CTA → `/jobs`. A small stats grid (e.g. shifts available, businesses hiring, avg pay, fast confirmation).

## 2. "How it works" step section (both pages)
A new section on each page showing the journey as numbered steps. Each step has: a number, a title, a **screenshot image**, and **up to 4 short bullet points**. Steps are tailored per audience.

**For Workers steps**
1. Sign up & fill the form — pick worker role, basic details, verify email
2. Build your profile — add skills/experience, languages, ID verification, set rates
3. Apply for jobs / post availability — browse shifts, one-tap apply, publish your availability so businesses reach out
4. Get noticed & check applications — track application status, see who viewed you
5. Get contacted & accepted — chat opens on mutual match, confirm within the window, exchange contacts
6. Complete & get rated — work the shift, receive a rating, build reputation

**For Business steps**
1. Sign up & fill the form — pick business account, company basics, verify email
2. Build your company profile — add venue details, logo, location
3. Post jobs / reach out to talent — create a shift in minutes or browse and invite workers directly
4. Check applications — see skill-matched candidates ranked, filter by verification/Atividade
5. Contact & accept the perfect one — open chat, accept the best fit, worker confirms
6. Rate the worker — leave a rating after the shift to strengthen the community

Each step renders in an alternating image/text layout. Bullet lists capped at 4 items.

## 3. Screenshots (AI-generated placeholders)
Generate clean placeholder mockup images (saved to `src/assets/`) representing each screen — e.g. signup form, profile builder, jobs list/apply, applications dashboard, chat/accept, rating. Reuse the same images across both pages where the screen is shared (signup, chat/accept, rating) to limit asset count (~6–7 images total). These are placeholders the user can later swap for real captures.

## 4. Pricing section (blurred "Coming soon")
- Add a Pricing section near the bottom of **both** pages.
- Render representative plan cards (e.g. Free / Pro / Featured listings) but apply a heavy blur (`blur-sm`/`blur`) to the cards and overlay a centered "Pricing — coming soon" badge so prices are obscured but the section communicates that paid tiers are planned.
- No real prices or checkout — purely a teaser.

## 5. Navigation & footer
- Navbar (`src/components/site/Navbar.tsx`): add a **For Workers** link (`/for-workers`) next to **For Business**, in both desktop and mobile menus.
- Footer (`src/components/site/Footer.tsx`): add "For Workers" to the Workers column.

## Technical details
- Use existing design tokens (`ink`, `canvas`, `gold`, `teal`) and the same card/section styling already used in `for-businesses.tsx`; no new dependencies.
- Step and feature content can be defined as local arrays in each route file (matching the existing `STEPS`/`FEATURE_CARDS`/`STATS` pattern). Hardcoded copy is fine; no new `siteContent` keys required.
- Images imported as ES6 asset imports from `src/assets/`.
- No backend, schema, or business-logic changes — frontend/presentation only.

## Out of scope
- Real pricing/checkout (kept hidden behind the blur for now).
- Editable-via-console content keys for the new copy (can be added later if needed).
