import { createServerFn } from "@tanstack/react-start";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Live applicant counts per job. Public-safe: returns ONLY job_id → count,
 * never any applicant identity. Counts come straight from the applications
 * table so the number on the card is always real.
 */
export const getApplicantCounts = createServerFn({ method: "POST" })
  .inputValidator((data: { jobIds: string[] }) => {
    if (!data || !Array.isArray(data.jobIds) || data.jobIds.length === 0 || data.jobIds.length > 200) {
      throw new Error("Invalid job ids");
    }
    const jobIds = data.jobIds.filter((id) => typeof id === "string" && UUID_RE.test(id));
    return { jobIds };
  })
  .handler(async ({ data }) => {
    if (data.jobIds.length === 0) return {} as Record<string, number>;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("applications")
      .select("job_id")
      .in("job_id", data.jobIds);

    if (error) throw new Error(error.message);

    const counts: Record<string, number> = {};
    for (const r of rows ?? []) {
      const id = r.job_id as string;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  });
