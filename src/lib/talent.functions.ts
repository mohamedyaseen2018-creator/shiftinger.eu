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
    if (!data || typeof data.workerId !== "string" || !UUID_RE.test(data.workerId)) {
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function maskName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => (w[0] ? w[0].toUpperCase() + "." : ""))
    .join(" ");
}

/**
 * Public profile details for the Worker Profile modal: completed shift
 * history and reviews. Privacy rules enforced server-side:
 * - business names are masked to initials (never full names)
 * - no payment amounts, no contact info, no business ids are returned
 * Only verified + visible workers can be looked up.
 */
export const getWorkerPublicDetails = createServerFn({ method: "POST" })
  .inputValidator((data: { workerId: string }) => {
    if (!data || typeof data.workerId !== "string" || !UUID_RE.test(data.workerId)) {
      throw new Error("Invalid worker id");
    }
    return { workerId: data.workerId };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: worker } = await supabaseAdmin
      .from("worker_profiles")
      .select("user_id, verified, availability_visible")
      .eq("user_id", data.workerId)
      .maybeSingle();

    if (!worker || !worker.verified || !worker.availability_visible) {
      throw new Error("Worker not available");
    }

    const [{ data: apps }, { data: reviews }] = await Promise.all([
      supabaseAdmin
        .from("applications")
        .select("id, job_id, owner_id, updated_at")
        .eq("worker_id", data.workerId)
        .eq("status", "completed")
        .order("updated_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("reviews")
        .select("rating, comment, created_at, reviewer_id")
        .eq("reviewee_id", data.workerId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const jobIds = [...new Set((apps ?? []).map((a) => a.job_id as string))];
    const { data: jobs } = jobIds.length
      ? await supabaseAdmin.from("jobs").select("id, role, date, start_time, end_time").in("id", jobIds)
      : { data: [] as { id: string; role: string; date: string | null; start_time: string | null; end_time: string | null }[] };
    const jobById = new Map((jobs ?? []).map((j) => [j.id as string, j]));

    const bizIds = [
      ...new Set([
        ...(apps ?? []).map((a) => a.owner_id as string),
        ...(reviews ?? []).map((r) => r.reviewer_id as string),
      ]),
    ];
    const { data: bps } = bizIds.length
      ? await supabaseAdmin.from("business_profiles").select("user_id, business_name").in("user_id", bizIds)
      : { data: [] as { user_id: string; business_name: string | null }[] };
    const bizName = new Map((bps ?? []).map((b) => [b.user_id as string, maskName((b.business_name as string) || "Business")]));

    const history = (apps ?? []).map((a) => {
      const j = jobById.get(a.job_id as string);
      let hours: number | null = null;
      if (j?.start_time && j?.end_time) {
        const [sh, sm] = String(j.start_time).split(":").map(Number);
        const [eh, em] = String(j.end_time).split(":").map(Number);
        const mins = eh * 60 + em - (sh * 60 + sm);
        hours = mins > 0 ? Math.round((mins / 60) * 10) / 10 : null;
      }
      return {
        business: bizName.get(a.owner_id as string) ?? "B.",
        role: j?.role ?? "Shift",
        date: (j?.date as string | null) ?? (a.updated_at as string),
        hours,
      };
    });

    const reviewRows = (reviews ?? []).map((r) => ({
      business: bizName.get(r.reviewer_id as string) ?? "B.",
      rating: Number(r.rating) || 0,
      comment: (r.comment as string) ?? "",
      date: r.created_at as string,
    }));

    return { history, reviews: reviewRows };
  });
