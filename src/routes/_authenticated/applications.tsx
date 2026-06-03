import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Loader2, ArrowLeft, MessageSquare, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import SiteLayout from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchOpenJobs } from "@/lib/jobs";
import { matchColor } from "@/lib/matching";
import type { MatchCriterion } from "@/data/types";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({ meta: [{ title: "My applications — Shiftinger" }] }),
  component: ApplicationsPage,
});

interface AppRow {
  id: string;
  job_id: string;
  owner_id: string;
  status: string;
  match_score: number;
  matched_criteria: unknown;
  worker_confirmed: boolean;
  business_confirmed: boolean;
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  applied: { label: "Applied", cls: "bg-blue-50 text-blue-700" },
  matched: { label: "Business confirmed — confirm to chat", cls: "bg-amber-50 text-amber-700" },
  confirmed: { label: "Confirmed — chat open", cls: "bg-teal/10 text-teal" },
  completed: { label: "Completed", cls: "bg-ink/5 text-ink/60" },
  rejected: { label: "Not selected", cls: "bg-red-50 text-red-600" },
  cancelled: { label: "Cancelled", cls: "bg-ink/5 text-ink/50" },
  working: { label: "Working", cls: "bg-teal/10 text-teal" },
};

function ApplicationsPage() {
  const { user, profile } = useAuth();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [jobMeta, setJobMeta] = useState<Record<string, { role: string; rate: number; business: string }>>({});
  const [convByApp, setConvByApp] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("applications").select("*").eq("worker_id", user.id).order("created_at", { ascending: false });
    const rows = (data ?? []) as AppRow[];
    setApps(rows);

    const { jobs, businesses } = await fetchOpenJobs();
    const meta: Record<string, { role: string; rate: number; business: string }> = {};
    // include closed jobs too via direct fetch
    const jobIds = rows.map((r) => r.job_id);
    const { data: allJobs } = await supabase.from("jobs").select("id, role, rate, owner_id").in("id", jobIds.length ? jobIds : ["00000000-0000-0000-0000-000000000000"]);
    (allJobs ?? []).forEach((j) => {
      meta[j.id as string] = {
        role: j.role as string,
        rate: Number(j.rate),
        business: businesses[j.owner_id as string]?.business_name ?? "Business",
      };
    });
    setJobMeta(meta);
    void jobs;

    const { data: convs } = await supabase.from("conversations").select("id, application_id").eq("worker_id", user.id);
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

  if (profile && profile.account_type !== "worker") {
    return <SiteLayout><div className="px-6 py-20 text-center text-ink/60">This page is for worker accounts.</div></SiteLayout>;
  }

  return (
    <SiteLayout>
      <section className="px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-teal">
            <ArrowLeft size={15} /> Back to dashboard
          </Link>
          <h1 className="font-serif text-3xl text-ink">My applications</h1>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal" /></div>
          ) : apps.length === 0 ? (
            <div className="mt-8 rounded-2xl bg-white p-10 text-center text-ink/50 ring-1 ring-ink/5">
              You haven't applied to any shifts yet. <Link to="/jobs" className="font-medium text-teal hover:underline">Browse shifts</Link>.
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {apps.map((a) => {
                const meta = jobMeta[a.job_id];
                const st = STATUS_LABEL[a.status] ?? STATUS_LABEL.applied;
                const criteria = Array.isArray(a.matched_criteria) ? (a.matched_criteria as MatchCriterion[]) : [];
                const conv = convByApp[a.id];
                return (
                  <div key={a.id} className="rounded-2xl bg-white p-5 ring-1 ring-ink/5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-ink">{meta?.role ?? "Shift"}</h3>
                        <p className="text-sm text-ink/50">{meta?.business} · €{meta?.rate}/hr</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st.cls}`}>{st.label}</span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/5">
                        <div className={`h-full rounded-full ${matchColor(a.match_score).bar}`} style={{ width: `${a.match_score}%` }} />
                      </div>
                      <span className={`text-xs font-medium ${matchColor(a.match_score).text}`}>{a.match_score}% match</span>
                    </div>

                    {criteria.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {criteria.map((c, i) => (
                          <span key={i} className={`rounded-full px-2 py-0.5 text-xs ${c.matched ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                            {c.matched ? "✓" : "✕"} {c.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      {a.status === "matched" && !a.worker_confirmed && (
                        <button onClick={() => confirm(a.id)} className="inline-flex items-center gap-1.5 rounded-full bg-teal px-4 py-2 text-sm font-medium text-canvas hover:bg-teal-light">
                          <CheckCircle size={15} /> Confirm to open chat
                        </button>
                      )}
                      {a.status === "applied" && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-ink/50"><Clock size={14} /> Waiting for the business</span>
                      )}
                      {conv && (
                        <Link to="/messages" search={{ c: conv }} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-teal ring-1 ring-teal/20 hover:bg-teal/5">
                          <MessageSquare size={15} /> Open chat
                        </Link>
                      )}
                    </div>
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
