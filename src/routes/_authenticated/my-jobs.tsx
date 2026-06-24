import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Loader2, ArrowLeft, ChevronDown, CheckCircle, MessageSquare, Plus, Star, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import SiteLayout from "@/components/site/SiteLayout";
import EditShiftModal, { type ShiftRow } from "@/components/features/EditShiftModal";
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
  message?: string | null;
  worker_confirmed: boolean;
  business_confirmed: boolean;
}
interface WorkerInfo {
  name: string;
  rating: number;
}
interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
}

function ApplicantReviews({ workerId }: { workerId: string }) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .rpc("get_public_reviews", { _reviewee_id: workerId })
      .then(({ data }) => {
        if (!active) return;
        setReviews((data ?? []) as ReviewRow[]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [workerId]);

  if (loading) return <p className="mt-2 text-xs text-ink/40">Loading reviews…</p>;
  if (reviews.length === 0) return <p className="mt-2 text-xs italic text-ink/40">No reviews from previous shifts yet.</p>;

  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs font-medium text-ink/50">Reviews from previous shifts</p>
      {reviews.slice(0, 5).map((r) => (
        <div key={r.id} className="rounded-lg bg-white p-2.5 ring-1 ring-ink/5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={11} className={n <= r.rating ? "fill-gold text-gold" : "text-ink/15"} />
              ))}
            </span>
            <span className="text-[11px] text-ink/40">{r.reviewer_name}</span>
          </div>
          {r.comment && <p className="mt-1 text-xs text-ink/70">{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}

function MyJobsPage() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<JobLite[]>([]);
  const [apps, setApps] = useState<AppLite[]>([]);
  const [workerInfo, setWorkerInfo] = useState<Record<string, WorkerInfo>>({});
  const [convByApp, setConvByApp] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirming, setConfirming] = useState(false);

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
      const { data: wp } = await supabase.rpc("get_applicant_worker_profiles", { _worker_ids: workerIds });
      const info: Record<string, WorkerInfo> = {};
      (wp ?? []).forEach((w) => {
        info[w.user_id as string] = {
          name: maskWorkerName((w.name as string) ?? "Worker"),
          rating: Number(w.rating) || 0,
        };
      });
      setWorkerInfo(info);
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

  const submitConfirm = async () => {
    if (!confirmTarget) return;
    setConfirming(true);
    const { error } = await supabase.rpc("confirm_application", {
      _app_id: confirmTarget,
      _message: confirmMessage.trim() ? confirmMessage.trim().slice(0, 500) : undefined,
    });
    setConfirming(false);
    if (error) {
      toast.error("Could not confirm.");
      return;
    }
    toast.success("Confirmed!");
    setConfirmTarget(null);
    setConfirmMessage("");
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
                            const info = workerInfo[a.worker_id];
                            return (
                              <div key={a.id} className="rounded-xl bg-canvas p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="flex items-center gap-2 font-medium text-ink">
                                    {info?.name ?? "Worker"}
                                    {info && info.rating > 0 && (
                                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-ink">
                                        <Star size={12} className="fill-gold text-gold" /> {info.rating.toFixed(1)}
                                      </span>
                                    )}
                                  </p>
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
                                {a.message && (
                                  <p className="mt-2 rounded-md bg-white px-3 py-2 text-xs italic text-ink/60 ring-1 ring-ink/5">"{a.message}"</p>
                                )}

                                <ApplicantReviews workerId={a.worker_id} />

                                <div className="mt-3 flex items-center gap-2">
                                  {!a.business_confirmed && (
                                    <button onClick={() => { setConfirmTarget(a.id); setConfirmMessage(""); }} className="inline-flex items-center gap-1.5 rounded-full bg-teal px-4 py-1.5 text-xs font-medium text-canvas hover:bg-teal-light">
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

      {/* Confirmation modal with optional message */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => !confirming && setConfirmTarget(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 ring-1 ring-ink/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="font-serif text-xl text-ink">Confirm applicant</h2>
              <button onClick={() => !confirming && setConfirmTarget(null)} className="text-ink/40 hover:text-ink"><X size={18} /></button>
            </div>
            <p className="mt-2 text-sm text-ink/60">
              Add an optional message — it appears as the first message in the chat once the worker confirms.
            </p>
            <textarea
              value={confirmMessage}
              onChange={(e) => setConfirmMessage(e.target.value)}
              rows={3}
              placeholder="e.g. Looking forward to working with you! Please arrive 10 min early."
              className="mt-3 w-full rounded-md border-0 bg-canvas px-3 py-2 text-sm ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-teal"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setConfirmTarget(null)} disabled={confirming} className="rounded-full px-4 py-2 text-sm font-medium text-ink/60 hover:bg-ink/5">Cancel</button>
              <button onClick={submitConfirm} disabled={confirming} className="inline-flex items-center gap-1.5 rounded-full bg-teal px-4 py-2 text-sm font-medium text-canvas hover:bg-teal-light disabled:opacity-50">
                {confirming ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
