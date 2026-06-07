import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Public listing of workers who opted in to be visible in Find Talent.
 * Returns ONLY a safe projection of verified + visible worker profiles.
 * Phone numbers are NEVER included here — not for anonymous callers and not
 * for authenticated ones. Contact numbers are revealed one-at-a-time through
 * the protected `getWorkerContact` function below, so they never travel in a
 * bulk response that a scraper could harvest.
 */
export const listVisibleWorkers = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: profiles, error } = await supabaseAdmin
    .from("worker_profiles")
    .select(
      "id, user_id, name, city, nationality, main_role, main_role_years, sub_roles, languages, atividade, bio, min_rate, looking_for, available_days, time_slots, verified, rating, rating_count, shifts_completed, avatar_url, portfolio_url, availability_visible",
    )
    .eq("verified", true)
    .eq("availability_visible", true);

  if (error) throw new Error(error.message);

  return profiles ?? [];
});

/**
 * Protected, on-demand contact reveal. Only an authenticated business (or
 * admin) may resolve a single visible worker's WhatsApp number. Each reveal
 * is logged to `contact_reveals` so we know which business contacted which
 * worker and when. Returns 401-style errors as thrown errors.
 */
export const getWorkerContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { workerId: string }) => {
    if (!data || typeof data.workerId !== "string" || data.workerId.length < 10) {
      throw new Error("Invalid worker id");
    }
    return { workerId: data.workerId };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Caller must be a verified business (workers cannot harvest contacts).
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", userId)
      .maybeSingle();

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (profile?.account_type !== "business" && !isAdmin) {
      throw new Error("Only businesses can reveal worker contact details");
    }

    // 2. Worker must be verified + visible before we expose a number.
    const { data: worker } = await supabaseAdmin
      .from("worker_profiles")
      .select("user_id, verified, availability_visible")
      .eq("user_id", data.workerId)
      .maybeSingle();

    if (!worker || !worker.verified || !worker.availability_visible) {
      throw new Error("Worker is not available for contact");
    }

    // 3. Fetch only the phone field (worker_contacts is owner/admin-only RLS).
    const { data: contact } = await supabaseAdmin
      .from("worker_contacts")
      .select("phone")
      .eq("user_id", data.workerId)
      .maybeSingle();

    const phone = contact?.phone ?? "";
    if (!phone) {
      throw new Error("This worker has not shared a contact number");
    }

    // 4. Log the reveal (analytics + abuse trail).
    await supabaseAdmin
      .from("contact_reveals")
      .insert({ business_id: userId, worker_id: data.workerId });

    const digits = phone.replace(/\D/g, "");
    return {
      phone,
      whatsappUrl: digits ? `https://wa.me/${digits}` : null,
    };
  });
