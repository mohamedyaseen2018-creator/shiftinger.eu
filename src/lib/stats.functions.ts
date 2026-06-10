import { createServerFn } from "@tanstack/react-start";

/**
 * Public platform stats for the homepage hero. Returns only aggregate
 * counts — no user data. Safe to call without authentication.
 */
export const getPlatformStats = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [jobs, workers, filled] = await Promise.all([
    supabaseAdmin.from("jobs").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("worker_profiles").select("user_id", { count: "exact", head: true }),
    supabaseAdmin
      .from("applications")
      .select("id", { count: "exact", head: true })
      .in("status", ["confirmed", "completed"]),
  ]);

  const shiftsPosted = jobs.count ?? 0;
  const registeredWorkers = workers.count ?? 0;
  const filledShifts = Math.min(filled.count ?? 0, shiftsPosted);
  const fillRate = shiftsPosted > 0 ? Math.round((filledShifts / shiftsPosted) * 100) : null;

  return { shiftsPosted, registeredWorkers, fillRate };
});
