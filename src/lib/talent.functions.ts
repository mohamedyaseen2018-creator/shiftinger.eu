import { createServerFn } from "@tanstack/react-start";

/**
 * Public listing of workers who opted in to be visible in Find Talent.
 * Returns a safe projection of verified + visible worker profiles, merged
 * with the WhatsApp number the worker chose to share. Uses the admin client
 * because `worker_contacts` is owner/admin-only under RLS, and a visible
 * worker has explicitly consented to share their contact on their post.
 */
export const listVisibleWorkers = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: profiles, error } = await supabaseAdmin
    .from("worker_profiles")
    .select(
      "id, user_id, name, city, nationality, main_role, main_role_years, sub_roles, languages, atividade, bio, min_rate, looking_for, available_days, time_slots, verified, rating, rating_count, shifts_completed, avatar_url, portfolio_url",
    )
    .eq("verified", true)
    .eq("availability_visible", true);

  if (error) throw new Error(error.message);

  const rows = profiles ?? [];
  const ids = rows.map((r) => r.user_id);

  const phoneById = new Map<string, string>();
  if (ids.length) {
    const { data: contacts } = await supabaseAdmin
      .from("worker_contacts")
      .select("user_id, phone")
      .in("user_id", ids);
    for (const c of contacts ?? []) phoneById.set(c.user_id, c.phone ?? "");
  }

  return rows.map((r) => ({ ...r, phone: phoneById.get(r.user_id) ?? "" }));
});
