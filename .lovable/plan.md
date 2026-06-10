# Worker Card — Stable Row Layout

## Goal
Reorder the worker card rows and make every row always render (with placeholders when data is missing) so all cards in the grid have identical structure — the viewer's eyes always find the same info in the same place.

## New Row Order

1. **Avatar + Name + Verified** (unchanged)
2. **Main role line + Rating** — the role badge row now also shows the rating inline:
   - With rating: `★ 4.8 / 5 · 12 shifts`
   - Without rating (or under 3 shifts): a muted placeholder like `★ — / 5 · New` so the line never disappears and the row height stays the same
3. **Location line** — `📍 Lisbon, Portugal` (city only; falls back to `Portugal`)
4. **Shift preference line** — "Single shifts" / "Part-time" badges move here from the name row. If the worker selected neither, show a muted `—` placeholder chip so the row keeps its height
5. **Experience + secondary roles** (unchanged)
6. **Availability days + time slots** (unchanged)
7. **Nationality + Languages line** — nationality flag + name followed by language chips (nationality moves here from the old rating/city line). Placeholder `—` when missing
8. **Atividade + Immediate start** (unchanged)
9. **Footer: rate + WhatsApp / View Profile** (unchanged)

## Consistency rules
- Rows 2–4 and 7 always render — missing data shows a subtle muted placeholder instead of collapsing, so card heights and row positions match across the grid.
- Placeholders use low-contrast styling (`text-ink/30`) so they don't draw attention but preserve spacing.

## Technical details
- Single file change: `src/components/features/WorkerCard.tsx`
- Remove the `showRating` conditional hiding; replace with always-rendered rating that switches between real value and placeholder
- Move `lookingFor` badges out of row 2 into their own row; move `nationality` into the languages row (now after availability)
- No backend, data, or other component changes
