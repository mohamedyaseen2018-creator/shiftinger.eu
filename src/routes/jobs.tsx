import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SiteLayout from "@/components/site/SiteLayout";
import JobCard from "@/components/features/JobCard";
import ApplyJobModal from "@/components/features/ApplyJobModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchOpenJobs, toJob, type JobRow } from "@/lib/jobs";
import { getApplicantCounts } from "@/lib/jobs.functions";
import { computeMatch } from "@/lib/matching";
import { ROLE_OPTIONS, CITY_OPTIONS } from "@/data/utils";
import type { Job } from "@/data/types";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Hospitality jobs in Portugal — Shiftinger" },
      { name: "description", content: "Browse the latest hospitality shifts and part-time roles across Portugal on Shiftinger." },
      { property: "og:title", content: "Hospitality jobs in Portugal — Shiftinger" },
      { property: "og:description", content: "Find your next hospitality shift across Portugal." },
      { property: "og:url", content: "https://shiftinger.eu/jobs" },
    ],
    links: [{ rel: "canonical", href: "https://shiftinger.eu/jobs" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Hospitality jobs in Portugal",
          url: "https://shiftinger.eu/jobs",
          description: "Latest hospitality shifts and part-time roles across Portugal.",
        }),
      },
    ],
  }),
  component: JobsPage,
});

const ROLE_FILTER = ["All roles", ...ROLE_OPTIONS];
const TYPE_FILTER = ["All types", "Single shift", "Part-time"];
const CITY_FILTER = ["All cities", ...CITY_OPTIONS];
const PAY_FILTER = ["Any", "€8+/hr", "€10+/hr", "€12+/hr", "€14+/hr"];
const minPay: Record<string, number> = { "€8+/hr": 8, "€10+/hr": 10, "€12+/hr": 12, "€14+/hr": 14 };

const selectCls =
  "rounded-md border-0 bg-white px-3 py-2 text-sm text-ink ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-teal";

interface DisplayJob {
  job: Job;
  row: JobRow;
  match?: { score: number; criteria: { label: string; matched: boolean }[] };
}

function JobsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("All roles");
  const [type, setType] = useState("All types");
  const [city, setCity] = useState("All cities");
  const [pay, setPay] = useState("Any");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DisplayJob[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [worker, setWorker] = useState<Record<string, unknown> | null>(null);
  const [applyTarget, setApplyTarget] = useState<DisplayJob | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { jobs, businesses } = await fetchOpenJobs();

    // Live applicant counts straight from the applications table (count only, no PII).
    let counts: Record<string, number> = {};
    if (jobs.length) {
      try {
        counts = await getApplicantCounts({ data: { jobIds: jobs.map((j) => j.id) } });
      } catch {
        counts = {};
      }
    }

    let workerProfile: Record<string, unknown> | null = null;
    if (user && profile?.account_type === "worker") {
      const { data } = await supabase.from("worker_profiles").select("id, user_id, name, city, nationality, main_role, main_role_years, sub_roles, languages, experience, atividade, bio, min_rate, looking_for, available_days, time_slots, availability_visible, messages_open, verified, rating, rating_count, shifts_completed, avatar_url, created_at, updated_at, residence, portfolio_url, atividade_number").eq("user_id", user.id).maybeSingle();
      workerProfile = data;
      setWorker(data);
      const { data: apps } = await supabase.from("applications").select("job_id").eq("worker_id", user.id);
      setAppliedIds(new Set((apps ?? []).map((a) => a.job_id as string)));
    }
    const display: DisplayJob[] = jobs.map((row) => {
      const job = toJob(row, businesses[row.owner_id]);
      job.applicants = counts[row.id] ?? 0;
      let match;
      if (workerProfile) {
        match = computeMatch(
          {
            main_role: workerProfile.main_role as string,
            sub_roles: workerProfile.sub_roles,
            languages: workerProfile.languages,
            min_rate: workerProfile.min_rate as number,
            atividade: Boolean(workerProfile.atividade),
            looking_for: workerProfile.looking_for,
            rating: (workerProfile.rating as number) ?? 0,
            main_role_years: (workerProfile.main_role_years as number) ?? 0,
            available_days: workerProfile.available_days,
            city: (workerProfile.city as string) ?? null,
          },
          {
            role: row.role,
            type: row.type,
            rate: Number(row.rate),
            languages: row.languages,
            atividade: row.atividade,
            date: row.date,
            city: businesses[row.owner_id]?.city ?? null,
          },
        );
      }
      return { job, row, match };
    });
    setItems(display);
    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    load();
  }, [load]);

  /** Pre-checks, then open the in-page application modal. */
  const openApply = async (jobId: string) => {
    if (!user) {
      toast.error("Please sign in as a worker to apply.");
      navigate({ to: "/auth", search: { mode: "signin", role: "worker" } });
      return;
    }
    if (profile?.account_type !== "worker") {
      toast.error("Only worker accounts can apply.");
      return;
    }
    if (profile.status !== "approved") {
      toast.error("Your account must be verified before applying.");
      return;
    }
    const { data: blocked } = await supabase.rpc("has_pending_review", { _user: user.id });
    if (blocked) {
      toast.error("Please review and close your finished job before applying to new ones.");
      return;
    }
    const item = items.find((i) => i.row.id === jobId);
    if (!item) return;
    setApplyTarget(item);
  };

  const submitApplication = async (message: string) => {
    if (!applyTarget || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("applications").insert({
      job_id: applyTarget.row.id,
      worker_id: user.id,
      owner_id: applyTarget.row.owner_id,
      match_score: applyTarget.match?.score ?? 0,
      matched_criteria: applyTarget.match?.criteria ?? [],
      status: "applied",
      message: message.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "You already applied to this shift." : "Could not apply.");
      return;
    }
    const jobId = applyTarget.row.id;
    setAppliedIds((p) => new Set([...p, jobId]));
    // Reactive count: increment immediately on the card.
    setItems((prev) =>
      prev.map((i) => (i.row.id === jobId ? { ...i, job: { ...i.job, applicants: i.job.applicants + 1 } } : i)),
    );
    setApplyTarget(null);
    toast.success("Application sent! You'll be notified once confirmed.");
  };

  const filtered = useMemo(() => {
    return items.filter(({ job }) => {
      if (role !== "All roles" && job.role !== role) return false;
      if (type === "Single shift" && job.type !== "single") return false;
      if (type === "Part-time" && job.type !== "parttime") return false;
      if (city !== "All cities" && job.city !== city) return false;
      if (pay !== "Any" && job.rate < minPay[pay]) return false;
      if (keyword && !job.role.toLowerCase().includes(keyword.toLowerCase()) && !job.area.toLowerCase().includes(keyword.toLowerCase()))
        return false;
      return true;
    });
  }, [items, role, type, city, pay, keyword]);

  return (
    <SiteLayout>
      <div className="border-b border-ink/5 bg-ink px-6 py-14 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">Browse shifts</span>
          <h1 className="mt-2 font-serif text-4xl text-canvas">Jobs available now</h1>
          <p className="mt-2 text-canvas/60">Find your next shift across Portugal.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-ink/5">
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              placeholder="Search role or area…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-md border-0 bg-canvas py-2 pl-9 pr-3 text-sm text-ink ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
          {[
            { value: role, setter: setRole, options: ROLE_FILTER },
            { value: type, setter: setType, options: TYPE_FILTER },
            { value: city, setter: setCity, options: CITY_FILTER },
            { value: pay, setter: setPay, options: PAY_FILTER },
          ].map((f, i) => (
            <select key={i} value={f.value} onChange={(e) => f.setter(e.target.value)} className={selectCls}>
              {f.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ))}
          <div className="ml-auto flex items-center gap-2 text-sm text-ink/50">
            <SlidersHorizontal size={14} />
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-ink/40">
            <p className="font-serif text-lg">No shifts available yet</p>
            <p className="mt-2 text-sm">Check back soon, or adjust your filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(({ job, match }) => (
              <JobCard
                key={job.id}
                job={job}
                matchScore={worker ? match?.score : undefined}
                matchCriteria={worker ? match?.criteria : undefined}
                applied={appliedIds.has(job.id)}
                onApply={openApply}
              />
            ))}
          </div>
        )}
      </div>

      <ApplyJobModal
        job={applyTarget?.job ?? null}
        criteria={applyTarget?.match?.criteria}
        open={!!applyTarget}
        submitting={submitting}
        onClose={() => setApplyTarget(null)}
        onSubmit={submitApplication}
      />
    </SiteLayout>
  );
}
