// ============================================================================
// Site content server functions.
//
// getSiteContent  — PUBLIC read of all editable copy (used by the website).
// consoleSaveSiteContent — admin-gated write of one or more content keys.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ALL_CONTENT_KEYS } from "@/data/siteContent";

// ── READ: all overrides (public) ─────────────────────────────────────────────
export const getSiteContent = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("site_content").select("key, value");
  const overrides: Record<string, string> = {};
  (data ?? []).forEach((r) => {
    overrides[r.key] = r.value ?? "";
  });
  return { overrides };
});

// ── WRITE: save content keys (admin only) ────────────────────────────────────
export const consoleSaveSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        entries: z
          .array(
            z.object({
              key: z.string().min(1).max(120),
              value: z.string().max(4000),
            }),
          )
          .min(1)
          .max(200),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) throw new Error("Could not verify permissions.");
    if (!isAdmin) throw new Error("Not authorised. Admin access required.");

    // Only allow known content keys.
    const allowed = new Set(ALL_CONTENT_KEYS);
    const rows = data.entries
      .filter((e) => allowed.has(e.key))
      .map((e) => ({ key: e.key, value: e.value }));
    if (rows.length === 0) return { ok: true };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_content").upsert(rows, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
