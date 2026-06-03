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
  ChevronLeft,
  ChevronRight,
  Users,
  FileText,
  History,
  ScrollText,
} from "lucide-react";
import { toast } from "sonner";
import SiteLayout from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { adminDeleteUser, adminSetUserStatus } from "@/lib/admin.functions";
import { DataTable, type Column } from "@/components/admin/DataTable";
import StatusHistoryModal from "@/components/admin/StatusHistoryModal";
import { formatDate } from "@/data/utils";
import type { ProfileStatus } from "@/data/types";

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
interface AuditRow {
  id: string;
  admin_email: string | null;
  action: string;
  target_type: string | null;
  target_label: string | null;
  created_at: string;
}

interface WorkerView {
  p: ProfileRow;
  w: WorkerRow;
  applied: number;
  confirmed: number;
  done: number;
  rating: number;
  ratingCount: number;
}
interface BusinessView {
  p: ProfileRow;
  b: BusinessRow;
  posted: number;
  confirmed: number;
  done: number;
  reaches: number;
  rating: number;
  ratingCount: number;
}
interface JobView {
  j: JobRow;
  business: string;
  applicants: number;
  hours: number | null;
  income: number | null;
}

type Tab = "approvals" | "workers" | "businesses" | "jobs" | "audit";

const CONFIRMED_SET = ["confirmed", "working", "completed"];

const STATUS_FILTER_OPTIONS = [
  { value: "pending_review", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "blocked", label: "Blocked" },
  { value: "incomplete", label: "Incomplete" },
];

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
  const setUserStatus = useServerFn(adminSetUserStatus);

  const [tab, setTab] = useState<Tab>("approvals");
  const [busy, setBusy] = useState(true);

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [convs, setConvs] = useState<ConvRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [historyFor, setHistoryFor] = useState<{ id: string; title: string } | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    const [p, w, b, j, a, c, au, wc] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("worker_profiles").select("*"),
      supabase.from("business_profiles").select("*"),
      supabase.from("jobs").select("id, owner_id, role, type, rate, status, start_time, end_time, working_days, created_at").order("created_at", { ascending: false }),
      supabase.from("applications").select("worker_id, owner_id, job_id, status"),
      supabase.from("conversations").select("worker_id, business_id"),
      supabase.from("admin_audit_log").select("id, admin_email, action, target_type, target_label, created_at").order("created_at", { ascending: false }),
      supabase.from("worker_contacts").select("user_id, phone"),
    ]);
    setProfiles((p.data ?? []) as ProfileRow[]);
    const phoneByUser: Record<string, string> = {};
    (wc.data ?? []).forEach((row) => {
      phoneByUser[row.user_id as string] = (row.phone as string) ?? "";
    });
    setWorkers(((w.data ?? []) as WorkerRow[]).map((row) => ({
      ...row,
      phone: phoneByUser[row.user_id] ?? "",
    })));
    setBusinesses((b.data ?? []) as BusinessRow[]);
    setJobs((j.data ?? []) as JobRow[]);
    setApps((a.data ?? []) as AppRow[]);
    setConvs((c.data ?? []) as ConvRow[]);
    setAudit((au.data ?? []) as AuditRow[]);
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
  const emailById = useMemo(() => {
    const m: Record<string, string> = {};
    profiles.forEach((p) => (m[p.id] = p.email));
    return m;
  }, [profiles]);

  const workerProfiles = useMemo(() => profiles.filter((p) => p.account_type === "worker"), [profiles]);
  const businessProfiles = useMemo(() => profiles.filter((p) => p.account_type === "business"), [profiles]);
  const pending = useMemo(() => profiles.filter((p) => p.status === "pending_review"), [profiles]);

  // Enriched rows for the data tables
  const workerViews = useMemo<WorkerView[]>(
    () =>
      workerProfiles.map((p) => {
        const w = workerByUser[p.id] ?? ({ user_id: p.id } as WorkerRow);
        const mine = apps.filter((a) => a.worker_id === p.id);
        return {
          p,
          w,
          applied: mine.length,
          confirmed: mine.filter((a) => CONFIRMED_SET.includes(a.status)).length,
          done: mine.filter((a) => a.status === "completed").length,
          rating: Number(w.rating ?? 0),
          ratingCount: Number(w.rating_count ?? 0),
        };
      }),
    [workerProfiles, workerByUser, apps],
  );

  const businessViews = useMemo<BusinessView[]>(
    () =>
      businessProfiles.map((p) => {
        const b = businessByUser[p.id] ?? ({ user_id: p.id } as BusinessRow);
        const mineApps = apps.filter((a) => a.owner_id === p.id);
        return {
          p,
          b,
          posted: jobs.filter((j) => j.owner_id === p.id).length,
          confirmed: mineApps.filter((a) => CONFIRMED_SET.includes(a.status)).length,
          done: mineApps.filter((a) => a.status === "completed").length,
          reaches: convs.filter((c) => c.business_id === p.id).length,
          rating: Number(b.rating ?? 0),
          ratingCount: Number(b.rating_count ?? 0),
        };
      }),
    [businessProfiles, businessByUser, apps, jobs, convs],
  );

  const jobViews = useMemo<JobView[]>(
    () =>
      jobs.map((j) => {
        const hours = jobHours(j);
        return {
          j,
          business: businessNameByUser[j.owner_id] ?? "Business",
          applicants: apps.filter((a) => a.job_id === j.id).length,
          hours,
          income: hours != null ? Math.round(hours * Number(j.rate)) : null,
        };
      }),
    [jobs, businessNameByUser, apps],
  );

  // Actions
  const setStatus = async (p: ProfileRow, status: ProfileStatus) => {
    const t = toast.loading("Updating status…");
    try {
      await setUserStatus({
        data: { userId: p.id, status, accountType: p.account_type, targetLabel: p.full_name || p.email },
      });
      toast.success(`Marked as ${STATUS_STYLES[status]?.label ?? status}.`, { id: t });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update status.", { id: t });
    }
  };

  const remove = async (p: ProfileRow) => {
    if (!confirm(`Delete ${p.full_name || p.email}? This permanently removes the account and all their data.`)) return;
    const t = toast.loading("Deleting account…");
    try {
      await deleteUser({ data: { userId: p.id, accountType: p.account_type, targetLabel: p.full_name || p.email } });
      toast.success("Account deleted.", { id: t });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete.", { id: t });
    }
  };

  const openHistory = (p: ProfileRow, title: string) => setHistoryFor({ id: p.id, title });

  if (loading || !isAdmin || busy) {
    return (
      <SiteLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin text-teal" />
        </div>
      </SiteLayout>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof Users; count: number }[] = [
    { key: "approvals", label: "Approvals", icon: FileText, count: pending.length },
    { key: "workers", label: "Workers", icon: Briefcase, count: workerProfiles.length },
    { key: "businesses", label: "Businesses", icon: Store, count: businessProfiles.length },
    { key: "jobs", label: "Jobs", icon: Users, count: jobs.length },
    { key: "audit", label: "Audit log", icon: ScrollText, count: audit.length },
  ];

  // ── Column definitions ──
  const workerColumns: Column<WorkerView>[] = [
    { key: "name", label: "Name", sortable: true, className: "font-medium text-ink", value: (r) => (r.w.name as string) || r.p.full_name || r.p.email },
    { key: "email", label: "Email", sortable: true, value: (r) => r.p.email },
    { key: "phone", label: "Phone", value: (r) => (r.w.phone as string) || "—" },
    { key: "city", label: "City", sortable: true, value: (r) => (r.w.city as string) || "—" },
    { key: "role", label: "Role", sortable: true, value: (r) => (r.w.main_role as string) || "—" },
    { key: "rate", label: "Rate", sortable: true, value: (r) => Number(r.w.min_rate ?? 0), render: (r) => `€${Number(r.w.min_rate ?? 0)}/hr` },
    { key: "applied", label: "Applied", sortable: true, value: (r) => r.applied },
    { key: "confirmed", label: "Confirmed", sortable: true, value: (r) => r.confirmed },
    { key: "done", label: "Done", sortable: true, value: (r) => r.done },
    { key: "rating", label: "Rating", sortable: true, value: (r) => r.rating, render: (r) => `${r.rating.toFixed(1)} (${r.ratingCount})` },
    { key: "status", label: "Status", sortable: true, value: (r) => r.p.status, render: (r) => <StatusBadge status={r.p.status} /> },
    {
      key: "actions",
      label: "Actions",
      csv: false,
      value: () => "",
      render: (r) => <RowActions p={r.p} title={(r.w.name as string) || r.p.full_name || r.p.email} onStatus={setStatus} onDelete={remove} onHistory={openHistory} />,
    },
  ];

  const businessColumns: Column<BusinessView>[] = [
    { key: "business", label: "Business", sortable: true, className: "font-medium text-ink", value: (r) => (r.b.business_name as string) || r.p.full_name || r.p.email },
    { key: "email", label: "Email", sortable: true, value: (r) => r.p.email },
    { key: "contact", label: "Contact", value: (r) => (r.b.contact_name as string) || "—" },
    { key: "phone", label: "Phone", value: (r) => (r.b.phone as string) || "—" },
    { key: "city", label: "City", sortable: true, value: (r) => (r.b.city as string) || "—" },
    { key: "category", label: "Category", sortable: true, value: (r) => (r.b.category as string) || "—" },
    { key: "posted", label: "Posted", sortable: true, value: (r) => r.posted },
    { key: "confirmed", label: "Confirmed", sortable: true, value: (r) => r.confirmed },
    { key: "done", label: "Done", sortable: true, value: (r) => r.done },
    { key: "reaches", label: "Reaches", sortable: true, value: (r) => r.reaches },
    { key: "rating", label: "Rating", sortable: true, value: (r) => r.rating, render: (r) => `${r.rating.toFixed(1)} (${r.ratingCount})` },
    { key: "status", label: "Status", sortable: true, value: (r) => r.p.status, render: (r) => <StatusBadge status={r.p.status} /> },
    {
      key: "actions",
      label: "Actions",
      csv: false,
      value: () => "",
      render: (r) => <RowActions p={r.p} title={(r.b.business_name as string) || r.p.full_name || r.p.email} onStatus={setStatus} onDelete={remove} onHistory={openHistory} />,
    },
  ];

  const jobColumns: Column<JobView>[] = [
    { key: "created", label: "Created", sortable: true, value: (r) => r.j.created_at, render: (r) => formatDate(r.j.created_at) },
    { key: "business", label: "Business", sortable: true, className: "font-medium text-ink", value: (r) => r.business },
    { key: "role", label: "Role", sortable: true, value: (r) => r.j.role },
    { key: "type", label: "Type", sortable: true, value: (r) => (r.j.type === "single" ? "Single" : "Part-time") },
    { key: "applicants", label: "Applicants", sortable: true, value: (r) => r.applicants },
    { key: "hours", label: "Hours", sortable: true, value: (r) => r.hours ?? 0, render: (r) => (r.hours != null ? `${r.hours}h` : "—") },
    { key: "rate", label: "Rate", sortable: true, value: (r) => Number(r.j.rate), render: (r) => `€${Number(r.j.rate)}/hr` },
    { key: "income", label: "Worker income", sortable: true, className: "font-medium text-ink", value: (r) => r.income ?? 0, render: (r) => (r.income != null ? `€${r.income}` : "—") },
    {
      key: "status",
      label: "Status",
      sortable: true,
      value: (r) => r.j.status,
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.j.status === "open" ? "bg-teal/10 text-teal" : "bg-ink/5 text-ink/60"}`}>{r.j.status}</span>
      ),
    },
  ];

  const auditColumns: Column<AuditRow>[] = [
    {
      key: "created",
      label: "When",
      sortable: true,
      value: (r) => r.created_at,
      render: (r) => new Date(r.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    },
    { key: "admin", label: "Admin", sortable: true, value: (r) => r.admin_email ?? "—" },
    {
      key: "action",
      label: "Action",
      sortable: true,
      value: (r) => r.action,
      render: (r) => <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-medium text-ink/70">{r.action}</span>,
    },
    { key: "target_type", label: "Type", sortable: true, value: (r) => r.target_type ?? "—" },
    { key: "target_label", label: "Target", value: (r) => r.target_label ?? "—" },
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
                onClick={() => setTab(t.key)}
                className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  tab === t.key ? "border-teal text-teal" : "border-transparent text-ink/55 hover:text-ink"
                }`}
              >
                <t.icon size={15} /> {t.label}
                <span className="rounded-full bg-ink/5 px-1.5 py-0.5 text-xs text-ink/60">{t.count}</span>
              </button>
            ))}
          </div>

          <div className="mt-6">
            {tab === "approvals" && (
              <ApprovalsTab
                pending={pending}
                workerByUser={workerByUser}
                businessByUser={businessByUser}
                onApprove={(p) => setStatus(p, "approved")}
                onReject={(p) => setStatus(p, "rejected")}
              />
            )}

            {tab === "workers" && (
              <DataTable
                rows={workerViews}
                columns={workerColumns}
                getRowKey={(r) => r.p.id}
                csvFilename="shiftinger-workers"
                searchPlaceholder="Search workers…"
                filter={{ label: "Status", field: (r) => r.p.status, options: STATUS_FILTER_OPTIONS }}
                initialSort={{ key: "name", dir: "asc" }}
                minWidth={1040}
                emptyText="No workers yet."
              />
            )}

            {tab === "businesses" && (
              <DataTable
                rows={businessViews}
                columns={businessColumns}
                getRowKey={(r) => r.p.id}
                csvFilename="shiftinger-businesses"
                searchPlaceholder="Search businesses…"
                filter={{ label: "Status", field: (r) => r.p.status, options: STATUS_FILTER_OPTIONS }}
                initialSort={{ key: "business", dir: "asc" }}
                minWidth={1080}
                emptyText="No businesses yet."
              />
            )}

            {tab === "jobs" && (
              <DataTable
                rows={jobViews}
                columns={jobColumns}
                getRowKey={(r) => r.j.id}
                csvFilename="shiftinger-jobs"
                searchPlaceholder="Search jobs…"
                filter={{
                  label: "Status",
                  field: (r) => r.j.status,
                  options: [
                    { value: "open", label: "Open" },
                    { value: "closed", label: "Closed" },
                  ],
                }}
                initialSort={{ key: "created", dir: "desc" }}
                minWidth={900}
                emptyText="No jobs posted yet."
              />
            )}

            {tab === "audit" && (
              <DataTable
                rows={audit}
                columns={auditColumns}
                getRowKey={(r) => r.id}
                csvFilename="shiftinger-audit-log"
                searchPlaceholder="Search audit log…"
                initialSort={{ key: "created", dir: "desc" }}
                pageSize={15}
                minWidth={760}
                emptyText="No admin actions recorded yet."
              />
            )}
          </div>
        </div>
      </section>

      {historyFor && (
        <StatusHistoryModal
          profileId={historyFor.id}
          title={historyFor.title}
          emailById={emailById}
          onClose={() => setHistoryFor(null)}
        />
      )}
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

function RowActions({
  p,
  title,
  onStatus,
  onDelete,
  onHistory,
}: {
  p: ProfileRow;
  title: string;
  onStatus: (p: ProfileRow, status: ProfileStatus) => void;
  onDelete: (p: ProfileRow) => void;
  onHistory: (p: ProfileRow, title: string) => void;
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
      {p.status !== "rejected" && (
        <button onClick={() => onStatus(p, "rejected")} title="Reject" className="rounded-full bg-red-50 p-1.5 text-red-600 hover:bg-red-100">
          <X size={14} />
        </button>
      )}
      <button onClick={() => onHistory(p, title)} title="Status history" className="rounded-full bg-ink/5 p-1.5 text-ink/60 hover:bg-ink/10">
        <History size={14} />
      </button>
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
  onApprove,
  onReject,
}: {
  pending: ProfileRow[];
  workerByUser: Record<string, WorkerRow>;
  businessByUser: Record<string, BusinessRow>;
  onApprove: (p: ProfileRow) => void;
  onReject: (p: ProfileRow) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "worker" | "business">("all");
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(0);
  const pageSize = 8;

  const filtered = useMemo(() => {
    let list = pending.filter((p) => typeFilter === "all" || p.account_type === typeFilter);
    list = [...list].sort((a, b) => {
      const d = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return order === "newest" ? -d : d;
    });
    return list;
  }, [pending, typeFilter, order]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  if (pending.length === 0) {
    return <div className="rounded-2xl bg-white p-10 text-center text-sm text-ink/50 ring-1 ring-ink/5">Nothing to review right now.</div>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as "all" | "worker" | "business");
            setPage(0);
          }}
          className="rounded-full bg-white px-4 py-2.5 text-sm text-ink ring-1 ring-ink/10 focus:outline-none"
        >
          <option value="all">All types</option>
          <option value="worker">Workers</option>
          <option value="business">Businesses</option>
        </select>
        <select
          value={order}
          onChange={(e) => setOrder(e.target.value as "newest" | "oldest")}
          className="rounded-full bg-white px-4 py-2.5 text-sm text-ink ring-1 ring-ink/10 focus:outline-none"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <div className="space-y-3">
        {pageRows.map((p) => {
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
                    <p className="text-xs text-ink/50">
                      {p.email} · {p.account_type} · submitted {formatDate(p.created_at)}
                    </p>
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

      {filtered.length === 0 && (
        <div className="rounded-2xl bg-white p-10 text-center text-sm text-ink/50 ring-1 ring-ink/5">No matching submissions.</div>
      )}

      {filtered.length > pageSize && (
        <div className="mt-4 flex items-center justify-between text-sm text-ink/60">
          <span>
            {safePage * pageSize + 1}–{Math.min(filtered.length, (safePage + 1) * pageSize)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, safePage - 1))}
              disabled={safePage === 0}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 ring-1 ring-ink/10 hover:bg-ink/5 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span>
              {safePage + 1} / {pageCount}
            </span>
            <button
              onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
              disabled={safePage >= pageCount - 1}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 ring-1 ring-ink/10 hover:bg-ink/5 disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
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
