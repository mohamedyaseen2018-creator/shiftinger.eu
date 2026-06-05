// ============================================================================
// Admin console store — now backed by REAL platform data.
//
// On mount it loads a full snapshot via the admin-gated `getConsoleData` server
// function and exposes typed entities plus async mutators that persist through
// admin server functions and refresh the snapshot.
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
  type ConsoleStatus,
} from "@/lib/console.functions";

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
  minRate: number;
  rating: number;
  ratingCount: number;
  shiftsCompleted: number;
  verified: boolean;
  status: ConsoleStatus;
  portfolioUrl: string;
  bio: string;
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

const EMPTY_METRICS: Metrics = {
  workers: 0,
  businesses: 0,
  jobs: 0,
  openJobs: 0,
  applications: 0,
  confirmed: 0,
  pendingApprovals: 0,
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

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const data = await getConsoleData();
      setWorkers(data.workers as Worker[]);
      setBusinesses(data.businesses as Business[]);
      setShifts(data.shifts as Shift[]);
      setMatches(data.matches as Match[]);
      setAdmins(data.admins as AdminUser[]);
      setAudit(data.audit as AuditEntry[]);
      setMetrics(data.metrics as Metrics);
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
      businessLabel: (name, revealed = false) => maskBusiness(name, revealed),
    }),
    [loading, error, workers, businesses, shifts, matches, admins, audit, metrics, refresh],
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
