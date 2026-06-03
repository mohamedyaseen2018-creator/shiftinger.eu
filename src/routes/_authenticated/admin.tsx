import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  ArrowLeft,
  Check,
  X,
  Trash2,
  Clock,
  Briefcase,
  Store,
  ChevronDown,
  Users,
  FileText,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import SiteLayout from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { adminDeleteUser } from "@/lib/admin.functions";
import { formatDate } from "@/data/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Shiftinger" }] }),
  component: AdminPage,
});

// ── Types ──
interface ProfileRow {
  id: string;
  email: string;
  account_type: "worker" | "business";
  full_name: string | null;
  status: string;
  created_at: string;
}
type WorkerRow = Record<string, unknown> & { user_id: string };
type BusinessRow = Record<string, unknown> & { user_id: string };
interface JobRow {
  id: string;
  owner_id: string;
  role: string;
  type: string;
  rate: number;
  status: string;
  start_time: string | null;
  end_time: string | null;
  working_days: unknown;
  created_at: string;
}
interface AppRow {
  worker_id: string;
  owner_id: string;
  job_id: string;
  status: string;
}
interface ConvRow {
  worker_id: string;
  business_id: string;
}

type Tab = "approvals" | "workers" | "businesses" | "jobs";

const CONFIRMED_SET = ["confirmed", "working", "completed"];

// ── Helpers ──
function shiftHours(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return Math.round((mins / 60) * 10) / 10;
}
function jobHours(job: JobRow): number | null {
  const base = shiftHours(job.start_time, job.end_time);
  if (base == null) return null;
  if (job.type === "parttime") {
    const days = Array.isArray(job.working_days) ? job.working_days.length : 0;
    return days ? Math.round(base * days * 10) / 10 : base;
  }
  return base;
}
function asArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      if (typeof x === "string") return x;
      if (x && typeof x === "object") {
        const o = x as Record<string, unknown>;
        return String(o.role ?? o.language ?? o.position ?? "");
      }
      return "";
    })
    .filter(Boolean);
}

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  pending_review: { label: "Pending", cls: "bg-amber-50 text-amber-700" },
  approved: { label: "Approved", cls: "bg-teal/10 text-teal" },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-600" },
  blocked: { label: "Blocked", cls: "bg-red-50 text-red-600" },
  incomplete: { label: "Incomplete (posted)", cls: "bg-ink/5 text-ink/60" },
};
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.incomplete;
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const deleteUser = useServerFn(adminDeleteUser);

  const [tab, setTab] = useState<Tab>("approvals");
  const [busy, setBusy] = useState(true);
  const [query, setQuery] = useState("");

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [convs, setConvs] = useState<ConvRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    const [p, w, b, j, a, c] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("worker_profiles").select("*"),
      supabase.from("business_profiles").select("*"),
      supabase.from("jobs").select("id, owner_id, role, type, rate, status, start_time, end_time, working_days, created_at").order("created_at", { ascending: false }),
      supabase.from("applications").select("worker_id, owner_id, job_id, status"),
      supabase.from("conversations").select("worker_id, business_id"),
    ]);
    setProfiles((p.data ?? []) as ProfileRow[]);
    setWorkers((w.data ?? []) as WorkerRow[]);
    setBusinesses((b.data ?? []) as BusinessRow[]);
    setJobs((j.data ?? []) as JobRow[]);
    setApps((a.data ?? []) as AppRow[]);
    setConvs((c.data ?? []) as ConvRow[]);
    setBusy(false);
  }, []);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate({ to: "/dashboard" });
      return;
    }
    if (isAdmin) load();
  }, [loading, isAdmin, navigate, load]);

  // Lookups
  const workerByUser = useMemo(() => Object.fromEntries(workers.map((w) => [w.user_id, w])), [workers]);
  const businessByUser = useMemo(() => Object.fromEntries(businesses.map((b) => [b.user_id, b])), [businesses]);
  const businessNameByUser = useMemo(() => {
    const m: Record<string, string> = {};
    businesses.forEach((b) => (m[b.user_id] = (b.business_name as string) || "Business"));
    return m;
  }, [businesses]);

  const workerStats = useCallback(
    (uid: string) => {
      const mine = apps.filter((a) => a.worker_id === uid);
      return {
        applied: mine.length,
        confirmed: mine.filter((a) => CONFIRMED_SET.includes(a.status)).length,
        done: mine.filter((a) => a.status === "completed").length,
      };
    },
    [apps],
  );
  const businessStats = useCallback(
    (uid: string) => {
      const mineApps = apps.filter((a) => a.owner_id === uid);
      return {
        posted: jobs.filter((j) => j.owner_id === uid).length,
        confirmed: mineApps.filter((a) => CONFIRMED_SET.includes(a.status)).length,
        done: mineApps.filter((a) => a.status === "completed").length,
        reaches: convs.filter((c) => c.business_id === uid).length,
      };
    },
    [apps, jobs, convs],
  );

  // Actions
  const setStatus = async (p: ProfileRow, status: string) => {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", p.id);
    if (error) return toast.error("Could not update status.");
    const verified = status === "approved";
    const table = p.account_type === "worker" ? "worker_profiles" : "business_profiles";
    await supabase.from(table).update({ verified }).eq("user_id", p.id);
    toast.success(`Marked as ${STATUS_STYLES[status]?.label ?? status}.`);
    setProfiles((prev) => prev.map((x) => (x.id === p.id ? { ...x, status } : x)));
  };

  const remove = async (p: ProfileRow) => {
    if (!confirm(`Delete ${p.full_name || p.email}? This permanently removes the account and all their data.`)) return;
    const t = toast.loading("Deleting account…");
    try {
      await deleteUser({ data: { userId: p.id } });
      toast.success("Account deleted.", { id: t });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete.", { id: t });
    }
  };

  if (loading || !isAdmin || busy) {
    return (
      <SiteLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin text-teal" />
        </div>
      </SiteLayout>
    );
  }

  const pending = profiles.filter((p) => p.status === "pending_review");
  const workerProfiles = profiles.filter((p) => p.account_type === "worker");
  const businessProfiles = profiles.filter((p) => p.account_type === "business");

  const q = query.trim().toLowerCase();
  const match = (...parts: (string | null | undefined)[]) =>
    !q || parts.some((s) => (s ?? "").toLowerCase().includes(q));

  const tabs: { key: Tab; label: string; icon: typeof Users; count: number }[] = [
    { key: "approvals", label: "Approvals", icon: FileText, count: pending.length },
    { key: "workers", label: "Workers", icon: Briefcase, count: workerProfiles.length },
    { key: "businesses", label: "Businesses", icon: Store, count: businessProfiles.length },
    { key: "jobs", label: "Jobs", icon: Users, count: jobs.length },
  ];

  return (
    <SiteLayout>
      <section className="px-4 py-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-teal">
            <ArrowLeft size={15} /> Back to dashboard
          </Link>
          <h1 className="font-serif text-3xl text-ink">Admin dashboard</h1>
          <p className="mt-1 text-sm text-ink/60">Control every account, job and talent listing on Shiftinger.</p>

          {/* Overview cards */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Overview label="Workers" value={workerProfiles.length} icon={Briefcase} />
            <Overview label="Businesses" value={businessProfiles.length} icon={Store} />
            <Overview label="Jobs" value={jobs.length} icon={Users} />
            <Overview label="Pending review" value={pending.length} icon={Clock} accent />
          </div>

          {/* Tabs */}
          <div className="mt-8 flex flex-wrap gap-2 border-b border-ink/10">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setExpanded(null); }}
                className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  tab === t.key ? "border-teal text-teal" : "border-transparent text-ink/55 hover:text-ink"
                }`}
              >
                <t.icon size={15} /> {t.label}
                <span className="rounded-full bg-ink/5 px-1.5 py-0.5 text-xs text-ink/60">{t.count}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          {tab !== "approvals" && (
            <div className="mt-5 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 ring-1 ring-ink/10 sm:max-w-sm">
              <Search size={15} className="text-ink/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full bg-transparent text-sm text-ink focus:outline-none"
              />
            </div>
          )}

          <div className="mt-5">
            {tab === "approvals" && (
              <ApprovalsTab
                pending={pending}
                workerByUser={workerByUser}
                businessByUser={businessByUser}
                expanded={expanded}
                setExpanded={setExpanded}
                onApprove={(p) => setStatus(p, "approved")}
                onReject={(p) => setStatus(p, "rejected")}
              />
            )}

            {tab === "workers" && (
              <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/5">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
                    <tr>
                      <Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>City</Th><Th>Role</Th>
                      <Th>Rate</Th><Th>Applied</Th><Th>Confirmed</Th><Th>Done</Th><Th>Rating</Th>
                      <Th>Status</Th><Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {workerProfiles
                      .filter((p) => {
                        const w = workerByUser[p.id];
                        return match(p.full_name, p.email, w?.main_role as string, w?.city as string);
                      })
                      .map((p) => {
                        const w = workerByUser[p.id] ?? {};
                        const s = workerStats(p.id);
                        return (
                          <tr key={p.id} className="border-b border-ink/5 last:border-0">
                            <Td className="font-medium text-ink">{(w.name as string) || p.full_name || "—"}</Td>
                            <Td>{p.email}</Td>
                            <Td>{(w.phone as string) || "—"}</Td>
                            <Td>{(w.city as string) || "—"}</Td>
                            <Td>{(w.main_role as string) || "—"}</Td>
                            <Td>€{Number(w.min_rate ?? 0)}/hr</Td>
                            <Td>{s.applied}</Td>
                            <Td>{s.confirmed}</Td>
                            <Td>{s.done}</Td>
                            <Td>{Number(w.rating ?? 0).toFixed(1)} ({Number(w.rating_count ?? 0)})</Td>
                            <Td><StatusBadge status={p.status} /></Td>
                            <Td><RowActions p={p} onStatus={setStatus} onDelete={remove} /></Td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {workerProfiles.length === 0 && <Empty>No workers yet.</Empty>}
              </div>
            )}

            {tab === "businesses" && (
              <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/5">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
                    <tr>
                      <Th>Business</Th><Th>Email</Th><Th>Contact</Th><Th>Phone</Th><Th>City</Th><Th>Category</Th>
                      <Th>Posted</Th><Th>Confirmed</Th><Th>Done</Th><Th>Reaches</Th><Th>Rating</Th>
                      <Th>Status</Th><Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessProfiles
                      .filter((p) => {
                        const b = businessByUser[p.id];
                        return match(p.full_name, p.email, b?.business_name as string, b?.category as string, b?.city as string);
                      })
                      .map((p) => {
                        const b = businessByUser[p.id] ?? {};
                        const s = businessStats(p.id);
                        return (
                          <tr key={p.id} className="border-b border-ink/5 last:border-0">
                            <Td className="font-medium text-ink">{(b.business_name as string) || p.full_name || "—"}</Td>
                            <Td>{p.email}</Td>
                            <Td>{(b.contact_name as string) || "—"}</Td>
                            <Td>{(b.phone as string) || "—"}</Td>
                            <Td>{(b.city as string) || "—"}</Td>
                            <Td>{(b.category as string) || "—"}</Td>
                            <Td>{s.posted}</Td>
                            <Td>{s.confirmed}</Td>
                            <Td>{s.done}</Td>
                            <Td>{s.reaches}</Td>
                            <Td>{Number(b.rating ?? 0).toFixed(1)} ({Number(b.rating_count ?? 0)})</Td>
                            <Td><StatusBadge status={p.status} /></Td>
                            <Td><RowActions p={p} onStatus={setStatus} onDelete={remove} /></Td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {businessProfiles.length === 0 && <Empty>No businesses yet.</Empty>}
              </div>
            )}

            {tab === "jobs" && (
              <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/5">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
                    <tr>
                      <Th>Created</Th><Th>Business</Th><Th>Role</Th><Th>Type</Th>
                      <Th>Applicants</Th><Th>Hours</Th><Th>Rate</Th><Th>Worker income</Th><Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs
                      .filter((j) => match(j.role, businessNameByUser[j.owner_id]))
                      .map((j) => {
                        const applicants = apps.filter((a) => a.job_id === j.id).length;
                        const hours = jobHours(j);
                        const income = hours != null ? Math.round(hours * Number(j.rate)) : null;
                        return (
                          <tr key={j.id} className="border-b border-ink/5 last:border-0">
                            <Td>{formatDate(j.created_at)}</Td>
                            <Td className="font-medium text-ink">{businessNameByUser[j.owner_id] ?? "Business"}</Td>
                            <Td>{j.role}</Td>
                            <Td>{j.type === "single" ? "Single" : "Part-time"}</Td>
                            <Td>{applicants}</Td>
                            <Td>{hours != null ? `${hours}h` : "—"}</Td>
                            <Td>€{Number(j.rate)}/hr</Td>
                            <Td className="font-medium text-ink">{income != null ? `€${income}` : "—"}</Td>
                            <Td>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${j.status === "open" ? "bg-teal/10 text-teal" : "bg-ink/5 text-ink/60"}`}>
                                {j.status}
                              </span>
                            </Td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {jobs.length === 0 && <Empty>No jobs posted yet.</Empty>}
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

// ── Sub-components ──
function Overview({ label, value, icon: Icon, accent }: { label: string; value: number; icon: typeof Users; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ring-1 ${accent ? "bg-amber-50 ring-amber-100" : "bg-white ring-ink/5"}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</span>
        <Icon size={16} className={accent ? "text-amber-600" : "text-teal"} />
      </div>
      <p className="mt-2 font-serif text-3xl text-ink">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-3 font-medium">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-4 py-3 text-ink/70 ${className}`}>{children}</td>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="p-10 text-center text-sm text-ink/50">{children}</div>;
}

function RowActions({
  p,
  onStatus,
  onDelete,
}: {
  p: ProfileRow;
  onStatus: (p: ProfileRow, status: string) => void;
  onDelete: (p: ProfileRow) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {p.status !== "approved" && (
        <button onClick={() => onStatus(p, "approved")} title="Approve" className="rounded-full bg-teal/10 p-1.5 text-teal hover:bg-teal/20">
          <Check size={14} />
        </button>
      )}
      {p.status !== "pending_review" && (
        <button onClick={() => onStatus(p, "pending_review")} title="Set pending" className="rounded-full bg-amber-50 p-1.5 text-amber-600 hover:bg-amber-100">
          <Clock size={14} />
        </button>
      )}
      <button onClick={() => onDelete(p)} title="Delete" className="rounded-full bg-red-50 p-1.5 text-red-600 hover:bg-red-100">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function ApprovalsTab({
  pending,
  workerByUser,
  businessByUser,
  expanded,
  setExpanded,
  onApprove,
  onReject,
}: {
  pending: ProfileRow[];
  workerByUser: Record<string, WorkerRow>;
  businessByUser: Record<string, BusinessRow>;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
  onApprove: (p: ProfileRow) => void;
  onReject: (p: ProfileRow) => void;
}) {
  if (pending.length === 0) {
    return <div className="rounded-2xl bg-white p-10 text-center text-sm text-ink/50 ring-1 ring-ink/5">Nothing to review right now.</div>;
  }
  return (
    <div className="space-y-3">
      {pending.map((p) => {
        const isOpen = expanded === p.id;
        return (
          <div key={p.id} className="rounded-2xl bg-white ring-1 ring-ink/5">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <button onClick={() => setExpanded(isOpen ? null : p.id)} className="flex items-center gap-3 text-left">
                <div className={`flex size-10 items-center justify-center rounded-lg ${p.account_type === "worker" ? "bg-teal/10 text-teal" : "bg-gold/10 text-gold-dark"}`}>
                  {p.account_type === "worker" ? <Briefcase size={18} /> : <Store size={18} />}
                </div>
                <div>
                  <p className="font-medium text-ink">{p.full_name || "Unnamed"}</p>
                  <p className="text-xs text-ink/50">{p.email} · {p.account_type}</p>
                </div>
                <ChevronDown size={16} className={`text-ink/40 ${isOpen ? "rotate-180" : ""} transition-transform`} />
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => onApprove(p)} className="inline-flex items-center gap-1.5 rounded-full bg-teal px-4 py-2 text-sm font-medium text-canvas hover:bg-teal-light">
                  <Check size={15} /> Approve
                </button>
                <button onClick={() => onReject(p)} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-50">
                  <X size={15} /> Reject
                </button>
              </div>
            </div>
            {isOpen && (
              <div className="border-t border-ink/5 p-5">
                {p.account_type === "worker" ? (
                  <FormDetail data={workerByUser[p.id]} kind="worker" />
                ) : (
                  <FormDetail data={businessByUser[p.id]} kind="business" />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FormDetail({ data, kind }: { data: WorkerRow | BusinessRow | undefined; kind: "worker" | "business" }) {
  if (!data) return <p className="text-sm text-ink/50">No form submitted yet.</p>;
  const d = data as Record<string, unknown>;
  const fields: [string, string][] =
    kind === "worker"
      ? [
          ["Full name", String(d.name ?? "—")],
          ["Phone", String(d.phone ?? "—")],
          ["City", String(d.city ?? "—")],
          ["Nationality", String(d.nationality ?? "—")],
          ["Residence", String(d.residence ?? "—")],
          ["Main role", String(d.main_role ?? "—")],
          ["Years experience", String(d.main_role_years ?? "—")],
          ["Sub-roles", asArr(d.sub_roles).join(", ") || "—"],
          ["Languages", asArr(d.languages).join(", ") || "—"],
          ["Min rate", `€${Number(d.min_rate ?? 0)}/hr`],
          ["Open atividade", d.atividade ? "Yes" : "No"],
          ["Looking for", asArr(d.looking_for).join(", ") || "—"],
          ["Available days", asArr(d.available_days).join(", ") || "—"],
          ["Bio", String(d.bio ?? "—")],
          ["ID document", d.id_document_url ? "Uploaded" : "Not uploaded"],
        ]
      : [
          ["Business name", String(d.business_name ?? "—")],
          ["Category", String(d.category ?? "—")],
          ["Categories", asArr(d.categories).join(", ") || "—"],
          ["Contact name", String(d.contact_name ?? "—")],
          ["Contact position", String(d.contact_position ?? "—")],
          ["Phone", String(d.phone ?? "—")],
          ["City", String(d.city ?? "—")],
          ["Area", String(d.area ?? "—")],
          ["Description", String(d.description ?? "—")],
        ];
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink/45">{label}</dt>
          <dd className="mt-0.5 text-sm text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
