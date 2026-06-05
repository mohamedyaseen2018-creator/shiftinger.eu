// ============================================================================
// Admin console store — backed by REAL platform data.
//
// Loads the platform snapshot (workers/businesses/shifts/matches) plus the
// configuration snapshot (platform config, confirmation window, KPIs, disputes,
// editable dropdown lists) via admin-gated server functions, and exposes typed
// entities plus async mutators that persist and refresh.
// ============================================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getConsoleData,
  consoleSetStatus,
  consoleUpdateWorker,
  consoleUpdateBusiness,
  consoleUpdateShift,
  consoleSetMatchStatus,
  consoleSetAdminRole,
  consoleDeleteUser,
  consoleSignWorkerDoc,
  consoleSetWorkerVerified,
  type ConsoleStatus,
} from "@/lib/console.functions";
import {
  getConsoleConfig,
  consoleSaveConfig,
  consoleSaveConfirmationWindow,
  consoleUpsertKpi,
  consoleDeleteKpi,
  consoleUpsertDispute,
  consoleDeleteDispute,
  consoleUpsertListOption,
  consoleDeleteListOption,
  consoleCreateWorker,
  consoleCreateBusiness,
  consoleUpsertJob,
  consoleDeleteJob,
} from "@/lib/consoleConfig.functions";

export type { ConsoleStatus };
export type AccountType = "worker" | "business";
export type JobStatus = "open" | "closed" | "filled";
export type ApplicationStatus =
  | "applied"
  | "matched"
  | "rejected"
  | "confirmed"
  | "working"
  | "completed"
  | "cancelled";

export type ListKey =
  | "nationality"
  | "language"
  | "skill"
  | "sector"
  | "sub_sector"
  | "city"
  | "dispute_issue_type"
  | "shift_role"
  | "admin_role";

export interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  city: string;
  residence: string;
  mainRole: string;
  mainRoleYears: number;
  subRoles: string[];
  languages: string[];
  atividade: boolean;
  atividadeNumber: string;
  minRate: number;
  rating: number;
  ratingCount: number;
  shiftsCompleted: number;
  verified: boolean;
  status: ConsoleStatus;
  portfolioUrl: string;
  bio: string;
  adminNotes: string;
  hasCv: boolean;
  hasDocuments: boolean;
  idDocumentPath: string;
}

export interface JobCatalogEntry {
  id: string;
  name: string;
  emoji: string;
  skills: string[];
  sortOrder: number;
  active: boolean;
}

export interface Business {
  id: string;
  name: string;
  city: string;
  area: string;
  category: string;
  email: string;
  contactName: string;
  contactPhone: string;
  contactPosition: string;
  verified: boolean;
  isEarlyBird: boolean;
  rating: number;
  ratingCount: number;
  status: ConsoleStatus;
  description: string;
  adminNotes: string;
  nif: string;
  subSector: string;
  displayInitials: string;
  languagesRequired: string[];
  preferredRoles: string[];
}

export interface Shift {
  id: string;
  ownerId: string;
  businessName: string;
  businessVerified: boolean;
  role: string;
  type: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  rate: number;
  spots: number;
  spotsRemaining: number;
  note: string;
  city: string;
  status: JobStatus;
  applications: number;
}

export interface Match {
  id: string;
  workerName: string;
  businessName: string;
  businessVerified: boolean;
  role: string;
  date: string | null;
  score: number;
  status: ApplicationStatus;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  accountType: AccountType;
  role: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetLabel: string | null;
  adminEmail: string | null;
  createdAt: string;
}

export interface Metrics {
  workers: number;
  businesses: number;
  jobs: number;
  openJobs: number;
  applications: number;
  confirmed: number;
  pendingApprovals: number;
}

export interface PlatformConfig {
  platformName: string;
  description: string;
  currency: string;
  timezone: string;
  cities: string[];
  sectors: string[];
}

export interface ConfirmationWindow {
  startTime: string;
  endTime: string;
  timezone: string;
  autoExpiry: boolean;
  reminder30min: boolean;
}

export interface Kpi {
  id: string;
  name: string;
  formula: string;
  target: number;
  unit: string;
  frequency: string;
  category: string;
  enabled: boolean;
  isCustom: boolean;
  sortOrder: number;
}

export interface Dispute {
  id: string;
  title: string;
  workerLabel: string;
  businessLabel: string;
  issueType: string;
  status: string;
  priority: string;
  assignedAdminId: string | null;
  assignedAdminLabel: string;
  deadline: string | null;
  internalNotes: string;
  resolutionSummary: string;
  createdAt: string;
}

export interface ListOption {
  id: string;
  listKey: ListKey;
  value: string;
  active: boolean;
  sortOrder: number;
}

export interface NewWorkerInput {
  name: string;
  email: string;
  phone?: string;
  nationality?: string;
  city?: string;
  mainRole?: string;
  subRoles?: string[];
  languages?: string[];
  atividade?: boolean;
  atividadeNumber?: string;
  adminNotes?: string;
}

export interface NewBusinessInput {
  name: string;
  email: string;
  displayInitials?: string;
  city?: string;
  category?: string;
  subSector?: string;
  contactName?: string;
  contactPhone?: string;
  nif?: string;
  languagesRequired?: string[];
  preferredRoles?: string[];
  adminNotes?: string;
}

const EMPTY_METRICS: Metrics = {
  workers: 0,
  businesses: 0,
  jobs: 0,
  openJobs: 0,
  applications: 0,
  confirmed: 0,
  pendingApprovals: 0,
};

const EMPTY_CONFIG: PlatformConfig = {
  platformName: "Shiftinger",
  description: "",
  currency: "EUR",
  timezone: "Europe/Lisbon",
  cities: [],
  sectors: [],
};

const EMPTY_WINDOW: ConfirmationWindow = {
  startTime: "09:00",
  endTime: "18:00",
  timezone: "Europe/Lisbon",
  autoExpiry: true,
  reminder30min: true,
};

// Business names are masked to initials until the business is verified.
export function maskBusiness(name: string, revealed: boolean): string {
  if (revealed) return name;
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join(".");
  return initials ? `${initials}.***` : "—";
}

interface StoreValue {
  loading: boolean;
  error: string | null;
  workers: Worker[];
  businesses: Business[];
  shifts: Shift[];
  matches: Match[];
  admins: AdminUser[];
  audit: AuditEntry[];
  metrics: Metrics;
  config: PlatformConfig;
  confirmationWindow: ConfirmationWindow;
  kpis: Kpi[];
  disputes: Dispute[];
  lists: ListOption[];
  jobCatalog: JobCatalogEntry[];

  refresh: () => Promise<void>;
  saveWorker: (w: Worker) => Promise<void>;
  saveBusiness: (b: Business) => Promise<void>;
  saveShift: (s: Pick<Shift, "id" | "role" | "rate" | "spots" | "status" | "note">) => Promise<void>;
  setMatchStatus: (id: string, status: ApplicationStatus) => Promise<void>;
  setStatus: (
    userId: string,
    status: ConsoleStatus,
    accountType: AccountType,
    label?: string,
  ) => Promise<void>;
  deleteUser: (userId: string, accountType: AccountType, label?: string) => Promise<void>;
  grantAdmin: (email: string) => Promise<void>;
  revokeAdmin: (userId: string) => Promise<void>;

  createWorker: (input: NewWorkerInput) => Promise<void>;
  createBusiness: (input: NewBusinessInput) => Promise<void>;
  saveConfig: (c: PlatformConfig) => Promise<void>;
  saveConfirmationWindow: (w: ConfirmationWindow) => Promise<void>;
  upsertKpi: (k: Partial<Kpi> & Pick<Kpi, "name" | "target" | "unit" | "frequency" | "category">) => Promise<void>;
  deleteKpi: (id: string) => Promise<void>;
  upsertDispute: (d: Partial<Dispute> & Pick<Dispute, "title" | "status" | "priority">) => Promise<void>;
  deleteDispute: (id: string) => Promise<void>;
  upsertListOption: (o: { id?: string; listKey: ListKey; value: string; active?: boolean; sortOrder?: number }) => Promise<void>;
  deleteListOption: (id: string) => Promise<void>;
  upsertJob: (j: { id?: string; name: string; emoji?: string; skills?: string[]; active?: boolean; sortOrder?: number }) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  signWorkerDoc: (userId: string) => Promise<string | null>;
  setWorkerVerified: (userId: string, verified: boolean, label?: string) => Promise<void>;

  listFor: (key: ListKey, includeInactive?: boolean) => string[];
  businessLabel: (name: string, revealed?: boolean) => string;
}

const Ctx = createContext<StoreValue | undefined>(undefined);

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(EMPTY_METRICS);
  const [config, setConfig] = useState<PlatformConfig>(EMPTY_CONFIG);
  const [confirmationWindow, setConfirmationWindow] = useState<ConfirmationWindow>(EMPTY_WINDOW);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [lists, setLists] = useState<ListOption[]>([]);
  const [jobCatalog, setJobCatalog] = useState<JobCatalogEntry[]>([]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [data, cfg] = await Promise.all([getConsoleData(), getConsoleConfig()]);
      setWorkers(data.workers as Worker[]);
      setBusinesses(data.businesses as Business[]);
      setShifts(data.shifts as Shift[]);
      setMatches(data.matches as Match[]);
      setAdmins(data.admins as AdminUser[]);
      setAudit(data.audit as AuditEntry[]);
      setMetrics(data.metrics as Metrics);
      setConfig(cfg.config as PlatformConfig);
      setConfirmationWindow(cfg.confirmationWindow as ConfirmationWindow);
      setKpis(cfg.kpis as Kpi[]);
      setDisputes(cfg.disputes as Dispute[]);
      setLists(cfg.lists as ListOption[]);
      setJobCatalog(cfg.jobCatalog as JobCatalogEntry[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load console data.");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const value = useMemo<StoreValue>(
    () => ({
      loading,
      error,
      workers,
      businesses,
      shifts,
      matches,
      admins,
      audit,
      metrics,
      config,
      confirmationWindow,
      kpis,
      disputes,
      lists,
      jobCatalog,
      refresh,
      saveWorker: async (w) => {
        await consoleUpdateWorker({
          data: {
            id: w.id,
            name: w.name,
            phone: w.phone,
            nationality: w.nationality,
            city: w.city,
            mainRole: w.mainRole,
            mainRoleYears: w.mainRoleYears,
            subRoles: w.subRoles,
            languages: w.languages,
            atividade: w.atividade,
            minRate: w.minRate,
            rating: w.rating,
            portfolioUrl: w.portfolioUrl,
            bio: w.bio,
            adminNotes: w.adminNotes,
            atividadeNumber: w.atividadeNumber,
          },
        });
        await refresh();
      },
      saveBusiness: async (b) => {
        await consoleUpdateBusiness({
          data: {
            id: b.id,
            name: b.name,
            city: b.city,
            area: b.area,
            category: b.category,
            description: b.description,
            contactName: b.contactName,
            contactPhone: b.contactPhone,
            contactPosition: b.contactPosition,
            rating: b.rating,
            isEarlyBird: b.isEarlyBird,
            adminNotes: b.adminNotes,
            nif: b.nif,
            subSector: b.subSector,
            displayInitials: b.displayInitials,
            languagesRequired: b.languagesRequired,
            preferredRoles: b.preferredRoles,
          },
        });
        await refresh();
      },
      saveShift: async (s) => {
        await consoleUpdateShift({
          data: { id: s.id, role: s.role, rate: s.rate, spots: s.spots, status: s.status, note: s.note },
        });
        await refresh();
      },
      setMatchStatus: async (id, status) => {
        await consoleSetMatchStatus({ data: { id, status } });
        await refresh();
      },
      setStatus: async (userId, status, accountType, label) => {
        await consoleSetStatus({ data: { userId, status, accountType, targetLabel: label } });
        await refresh();
      },
      deleteUser: async (userId, accountType, label) => {
        await consoleDeleteUser({ data: { userId, accountType, targetLabel: label } });
        await refresh();
      },
      grantAdmin: async (email) => {
        await consoleSetAdminRole({ data: { email, makeAdmin: true } });
        await refresh();
      },
      revokeAdmin: async (userId) => {
        await consoleSetAdminRole({ data: { userId, makeAdmin: false } });
        await refresh();
      },
      createWorker: async (input) => {
        await consoleCreateWorker({ data: input });
        await refresh();
      },
      createBusiness: async (input) => {
        await consoleCreateBusiness({ data: input });
        await refresh();
      },
      saveConfig: async (c) => {
        await consoleSaveConfig({ data: c });
        await refresh();
      },
      saveConfirmationWindow: async (w) => {
        await consoleSaveConfirmationWindow({
          data: {
            startTime: w.startTime,
            endTime: w.endTime,
            autoExpiry: w.autoExpiry,
            reminder30min: w.reminder30min,
          },
        });
        await refresh();
      },
      upsertKpi: async (k) => {
        await consoleUpsertKpi({
          data: {
            id: k.id,
            name: k.name,
            formula: k.formula ?? "",
            target: k.target,
            unit: k.unit,
            frequency: k.frequency as "Daily" | "Weekly" | "Monthly" | "Quarterly",
            category: k.category as "Supply" | "Demand" | "Liquidity" | "Revenue" | "Trust & Safety",
            enabled: k.enabled ?? true,
            sortOrder: k.sortOrder ?? 0,
          },
        });
        await refresh();
      },
      deleteKpi: async (id) => {
        await consoleDeleteKpi({ data: { id } });
        await refresh();
      },
      upsertDispute: async (d) => {
        await consoleUpsertDispute({
          data: {
            id: d.id,
            title: d.title,
            workerLabel: d.workerLabel ?? "",
            businessLabel: d.businessLabel ?? "",
            issueType: d.issueType ?? "",
            status: d.status as "open" | "under_review" | "resolved" | "escalated" | "closed",
            priority: d.priority as "low" | "medium" | "high",
            assignedAdminId: d.assignedAdminId ?? null,
            assignedAdminLabel: d.assignedAdminLabel ?? "",
            deadline: d.deadline ?? null,
            internalNotes: d.internalNotes ?? "",
            resolutionSummary: d.resolutionSummary ?? "",
          },
        });
        await refresh();
      },
      deleteDispute: async (id) => {
        await consoleDeleteDispute({ data: { id } });
        await refresh();
      },
      upsertListOption: async (o) => {
        await consoleUpsertListOption({
          data: {
            id: o.id,
            listKey: o.listKey,
            value: o.value,
            active: o.active ?? true,
            sortOrder: o.sortOrder ?? 0,
          },
        });
        await refresh();
      },
      deleteListOption: async (id) => {
        await consoleDeleteListOption({ data: { id } });
        await refresh();
      },
      upsertJob: async (j) => {
        await consoleUpsertJob({
          data: {
            id: j.id,
            name: j.name,
            emoji: j.emoji ?? "",
            skills: j.skills ?? [],
            active: j.active ?? true,
            sortOrder: j.sortOrder ?? 0,
          },
        });
        await refresh();
      },
      deleteJob: async (id) => {
        await consoleDeleteJob({ data: { id } });
        await refresh();
      },
      signWorkerDoc: async (userId) => {
        const res = await consoleSignWorkerDoc({ data: { userId } });
        return res.url;
      },
      setWorkerVerified: async (userId, verified, label) => {
        await consoleSetWorkerVerified({ data: { userId, verified, targetLabel: label } });
        await refresh();
      },
      listFor: (key, includeInactive = false) =>
        lists
          .filter((l) => l.listKey === key && (includeInactive || l.active))
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((l) => l.value),
      businessLabel: (name, revealed = false) => maskBusiness(name, revealed),
    }),
    [loading, error, workers, businesses, shifts, matches, admins, audit, metrics, config, confirmationWindow, kpis, disputes, lists, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminStore(): StoreValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminStore must be used within AdminStoreProvider");
  return ctx;
}

// Human-readable labels for profile review status.
export const STATUS_LABEL: Record<ConsoleStatus, string> = {
  incomplete: "Incomplete",
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  blocked: "Blocked",
};

export function statusToneFor(status: ConsoleStatus): "pine" | "amber" | "slate" | "red" | "blue" {
  switch (status) {
    case "approved":
      return "pine";
    case "pending_review":
      return "amber";
    case "rejected":
    case "blocked":
      return "red";
    default:
      return "slate";
  }
}

export const DISPUTE_STATUS_LABEL: Record<string, string> = {
  open: "Open",
  under_review: "Under review",
  resolved: "Resolved",
  escalated: "Escalated",
  closed: "Closed",
};

export function disputeStatusTone(status: string): "pine" | "amber" | "slate" | "red" | "blue" {
  switch (status) {
    case "resolved":
    case "closed":
      return "pine";
    case "under_review":
      return "amber";
    case "escalated":
      return "red";
    case "open":
      return "blue";
    default:
      return "slate";
  }
}
