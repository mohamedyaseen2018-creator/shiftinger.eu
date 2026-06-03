import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Loader2, ArrowLeft, ChevronDown, CheckCircle, MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import SiteLayout from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { matchColor } from "@/lib/matching";
import { maskWorkerName } from "@/data/utils";
import type { MatchCriterion } from "@/data/types";

export const Route = createFileRoute("/_authenticated/my-jobs")({
  head: () => ({ meta: [{ title: "My shifts — Shiftinger" }] }),
  component: MyJobsPage,
});

interface JobLite {
  id: string;
  role: string;
  rate: number;
  type: string;
  status: string;
  spots_remaining: number;
}
interface AppLite {
  id: string;
  job_id: string;
  worker_id: string;
  status: string;
  match_score: number;
  matched_criteria: unknown;
  worker_confirmed: boolean;
  business_confirmed: boolean;
}

function MyJobsPage() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<JobLite[]>([]);
  const [apps, setApps] = useState<AppLite[]>([]);
  const [workerNames, setWorkerNames] = useState<Record<string, string>>({});
  const [convByApp, setConvByApp] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: js } = await supabase.from("jobs").select("id, role, rate, type, status, spots_remaining").eq("owner_id", user.id).order("created_at", { ascending: false });
    setJobs((js ?? []) as JobLite[]);
    const { data: as } = await supabase.from("applications").select("*").eq("owner_id", user.id);
    const rows = (as ?? []) as AppLite[];
    setApps(rows);
    const workerIds = [...new Set(rows.map((r) => r.worker_id))];
    if (workerIds.length) {
      const { data: wp } = await supabase.from("worker_profiles").select("user_id, name").in("user_id", workerIds);
      const names: Record<string, string> = {};
      (wp ?? []).forEach((w) => (names[w.user_id as string] = maskWorkerName((w.name as string) ?? "Worker")));
      setWorkerNames(names);
    }
    const { data: convs } = await supabase.from("conversations").select("id, application_id").eq("business_id", user.id);
    const cmap: Record<string, string> = {};
    (convs ?? []).forEach((c) => (cmap[c.application_id as string] = c.id as string));
    setConvByApp(cmap);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const confirm = async (appId: string) => {
    const { error } = await supabase.rpc("confirm_application", { _app_id: appId });
    if (error) {
      toast.error("Could not confirm.");
      return;
    }
    toast.success("Confirmed!");
    load();
  };

  if (profile && profile.account_type !== "business") {
    return <SiteLayout><div className="px-6 py-20 text-center text-ink/60">This page is for business accounts.</div></SiteLayout>;
  }

  return (
    <SiteLayout>
      <section className="px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-teal">
            <ArrowLeft size={15} /> Back to dashboard
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-3xl text-ink">My shifts</h1>
            <Link to="/post-job" className="inline-flex items-center gap-1.5 rounded-full bg-teal px-4 py-2 text-sm font-medium text-canvas hover:bg-teal-light">
              <Plus size={15} /> Post shift
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal" /></div>
          ) : jobs.length === 0 ? (
            <div className="mt-8 rounded-2xl bg-white p-10 text-center text-ink/50 ring-1 ring-ink/5">No shifts posted yet.</div>
          ) : (
            <div className="mt-8 space-y-4">
              {jobs.map((job) => {
                const jobApps = apps.filter((a) => a.job_id === job.id);
                return (
                  <div key={job.id} className="rounded-2xl bg-white ring-1 ring-ink/5">
                    <button onClick={() => setOpen(open === job.id ? null : job.id)} className="flex w-full items-center justify-between gap-3 p-5 text-left">
                      <div>
                        <h3 className="font-medium text-ink">{job.role}</h3>
                        <p className="text-sm text-ink/50">€{job.rate}/hr · {job.type === "single" ? "Single shift" : "Part-time"} · {job.status}</p>
                      </div>
                      <span className="flex items-center gap-2 text-sm text-ink/60">
                        {jobApps.length} applicant{jobApps.length !== 1 ? "s" : ""}
                        <ChevronDown size={16} className={open === job.id ? "rotate-180 transition-transform" : "transition-transform"} />
                      </span>
                    </button>

                    {open === job.id && (
                      <div className="space-y-3 border-t border-ink/5 p-5">
                        {jobApps.length === 0 ? (
                          <p className="text-sm text-ink/50">No applicants yet.</p>
                        ) : (
                          jobApps.map((a) => {
                            const criteria = Array.isArray(a.matched_criteria) ? (a.matched_criteria as MatchCriterion[]) : [];
                            const conv = convByApp[a.id];
                            return (
                              <div key={a.id} className="rounded-xl bg-canvas p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="font-medium text-ink">{workerNames[a.worker_id] ?? "Worker"}</p>
                                  <span className={`text-xs font-medium ${matchColor(a.match_score).text}`}>{a.match_score}% match</span>
                                </div>
                                {criteria.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {criteria.map((c, i) => (
                                      <span key={i} className={`rounded-full px-2 py-0.5 text-xs ${c.matched ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                                        {c.matched ? "✓" : "✕"} {c.label}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="mt-3 flex items-center gap-2">
                                  {!a.business_confirmed && (
                                    <button onClick={() => confirm(a.id)} className="inline-flex items-center gap-1.5 rounded-full bg-teal px-4 py-1.5 text-xs font-medium text-canvas hover:bg-teal-light">
                                      <CheckCircle size={14} /> Confirm applicant
                                    </button>
                                  )}
                                  {a.business_confirmed && !conv && (
                                    <span className="text-xs text-ink/50">Confirmed — waiting for worker to confirm</span>
                                  )}
                                  {conv && (
                                    <Link to="/messages" search={{ c: conv }} className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-teal ring-1 ring-teal/20 hover:bg-teal/5">
                                      <MessageSquare size={14} /> Open chat
                                    </Link>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
