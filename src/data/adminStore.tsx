// ============================================================================
// Central, fully-editable admin store for the Shiftinger console.
//
// Everything an admin can create / edit / delete lives here as React state so
// the whole console behaves like a real (optimistic) CRUD app on top of mock
// data. Swapping in Supabase later means replacing the seed + mutators only.
// ============================================================================

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  WORKERS as SEED_WORKERS,
  BUSINESSES as SEED_BUSINESSES,
  SHIFTS as SEED_SHIFTS,
  MATCHES as SEED_MATCHES,
  DISPUTES as SEED_DISPUTES,
  ADMIN_USERS as SEED_ADMINS,
  maskBusiness,
} from "./adminMock";

// ── Managed list option ──
export interface ListOption {
  id: string;
  name: string;
  active: boolean;
}

export type ListKey =
  | "nationalities"
  | "languages"
  | "skills"
  | "sectors"
  | "subSectors"
  | "cities"
  | "disputeIssueTypes"
  | "shiftRoles"
  | "adminRoles";

export const LIST_META: { key: ListKey; label: string; help: string }[] = [
  { key: "nationalities", label: "Nationalities", help: "Worker nationality options" },
  { key: "languages", label: "Languages", help: "Languages for workers and businesses" },
  { key: "skills", label: "Skills / roles", help: "Worker skill and role tags" },
  { key: "sectors", label: "Sectors", help: "Business sector options" },
  { key: "subSectors", label: "Sub-sectors", help: "Business sub-sector options" },
  { key: "cities", label: "Cities", help: "Operating cities" },
  { key: "disputeIssueTypes", label: "Dispute issue types", help: "Categories used across dispute forms" },
  { key: "shiftRoles", label: "Shift roles", help: "Roles available when posting shifts" },
  { key: "adminRoles", label: "Admin user roles", help: "Roles assignable to admin users" },
];

// ── Entity types (extend the read-only mock shapes with editable fields) ──
export type AccountStatus = "active" | "inactive" | "suspended";
export type VerificationStatus = "pending" | "verified" | "suspended";
export type DisputeWorkflowStatus = "open" | "under_review" | "resolved" | "escalated" | "closed";
export type KpiFrequency = "Daily" | "Weekly" | "Monthly" | "Quarterly";
export type KpiCategory = "Supply" | "Demand" | "Liquidity" | "Revenue" | "Trust & Safety";

export interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  flag: string;
  languages: string[];
  skills: string[];
  atividade: boolean;
  atividadeNumber: string;
  city: string;
  status: AccountStatus;
  totalShifts: number;
  rating: number;
  notes: string;
}

export interface Business {
  id: string;
  name: string; // real / legal name — never rendered publicly
  initials: string; // display initials (auto unless overridden)
  city: string;
  sector: string;
  subSector: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  nif: string;
  verification: VerificationStatus;
  languagesRequired: string[];
  preferredRoles: string[];
  shiftsPosted: number;
  avgRating: number;
  confirmed: boolean;
  notes: string;
}

export interface Shift {
  id: string;
  businessId: string;
  role: string;
  date: string;
  startTime: string;
  endTime: string;
  pay: number;
  applications: number;
  status: "open" | "matched" | "confirmed" | "expired" | "cancelled";
  city: string;
  confirmed: boolean;
}

export interface Match {
  id: string;
  workerName: string;
  businessId: string;
  role: string;
  date: string;
  score: number;
  status: "pending" | "confirmed" | "declined";
}

export interface Dispute {
  id: string;
  workerName: string;
  businessId: string;
  issueType: string;
  raised: string;
  status: DisputeWorkflowStatus;
  assignedTo: string;
  deadline: string;
  internalNotes: string;
  resolutionSummary: string;
}

export interface KpiConfig {
  id: string;
  name: string;
  formula: string;
  target: number;
  unit: string;
  frequency: KpiFrequency;
  category: KpiCategory;
  enabled: boolean;
  custom: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActive: string;
}

export interface PlatformConfig {
  name: string;
  description: string;
  cities: string[];
  sectors: string[];
  currency: string;
  timezone: string;
}

export interface ConfirmationWindow {
  start: string;
  end: string;
  timezone: string;
  autoExpiry: boolean;
  reminder: boolean;
}

// ── Helpers ──
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2, 10)}`;

function opts(names: string[]): ListOption[] {
  return names.map((name) => ({ id: uid(), name, active: true }));
}

function slugEmail(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z\s]/g, "")
      .trim()
      .replace(/\s+/g, ".") + "@example.pt"
  );
}

function phoneFor(seed: number): string {
  const n = (912000000 + ((seed * 7919) % 87000000)).toString();
  return `+351 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}

function autoInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join(".") + ".***"
  );
}

// ── Seed ──
const SEED_NATIONALITIES = [
  "Portuguese", "Brazilian", "Indian", "Cape Verdean", "Ukrainian",
  "Nepali", "Angolan", "Italian", "Other",
];
const SEED_LANGUAGES = ["Portuguese", "English", "Spanish", "French", "Hindi", "Ukrainian"];
const SEED_SKILLS = [
  "Waiter/Server", "Barista", "Kitchen assistant", "Bartender", "Host/Cashier",
  "Dishwasher", "Event staff", "Cleaning", "Catering",
];
const SEED_SECTORS = ["Hospitality", "Events", "Catering", "Retail", "Other"];
const SEED_SUBSECTORS = ["Restaurant", "Café", "Bar", "Hotel", "Wedding", "Conference"];
const SEED_CITIES = ["Lisbon", "Porto", "Other"];
const SEED_ISSUE_TYPES = [
  "No-show (worker)", "No-show (business)", "Pay discrepancy",
  "Hours mismatch", "Behaviour report", "Cancellation late",
];
const SEED_SHIFT_ROLES = SEED_SKILLS;
const SEED_ADMIN_ROLES = ["Super admin", "Operations", "Support"];

function seedWorkers(): Worker[] {
  const langPool = SEED_LANGUAGES;
  return SEED_WORKERS.map((w, i) => ({
    id: w.id,
    name: w.name,
    email: slugEmail(w.name),
    phone: phoneFor(i + 1),
    nationality: w.nationality,
    flag: w.flag,
    languages: ["Portuguese", langPool[(i % (langPool.length - 1)) + 1]],
    skills: [...w.skills],
    atividade: w.atividade,
    atividadeNumber: w.atividade ? `PT${500000000 + i * 137}` : "",
    city: w.city,
    status: (w.status === "active" ? "active" : "inactive") as AccountStatus,
    totalShifts: w.totalShifts,
    rating: w.rating,
    notes: "",
  }));
}

function seedBusinesses(): Business[] {
  return SEED_BUSINESSES.map((b, i) => ({
    id: b.id,
    name: b.name,
    initials: autoInitials(b.name),
    city: b.city,
    sector: b.sector,
    subSector: SEED_SUBSECTORS[i % SEED_SUBSECTORS.length],
    contactName: b.name.split(/\s+/)[0] + " Manager",
    contactEmail: slugEmail(b.name).replace("@example.pt", "@business.pt"),
    contactPhone: phoneFor(i + 200),
    nif: (500000000 + i * 911).toString(),
    verification: (b.verified ? "verified" : "pending") as VerificationStatus,
    languagesRequired: ["Portuguese", "English"],
    preferredRoles: [SEED_SKILLS[i % SEED_SKILLS.length]],
    shiftsPosted: b.shiftsPosted,
    avgRating: b.avgRating,
    confirmed: b.confirmed,
    notes: "",
  }));
}

function seedDisputes(): Dispute[] {
  return SEED_DISPUTES.map((d) => ({
    id: d.id,
    workerName: d.workerName,
    businessId: d.businessId,
    issueType: d.issueType,
    raised: d.raised,
    status: (d.status === "resolved" ? "resolved" : "open") as DisputeWorkflowStatus,
    assignedTo: "",
    deadline: "",
    internalNotes: "",
    resolutionSummary: "",
  }));
}

const SEED_KPIS: KpiConfig[] = [
  { id: uid(), name: "Total registered workers", formula: "count(workers)", target: 1500, unit: "count", frequency: "Monthly", category: "Supply", enabled: true, custom: false },
  { id: uid(), name: "Active businesses", formula: "count(active businesses)", target: 120, unit: "count", frequency: "Monthly", category: "Demand", enabled: true, custom: false },
  { id: uid(), name: "Shifts posted", formula: "count(shifts) per month", target: 5000, unit: "count", frequency: "Monthly", category: "Demand", enabled: true, custom: false },
  { id: uid(), name: "Confirmed shifts", formula: "count(confirmed shifts)", target: 4000, unit: "count", frequency: "Monthly", category: "Liquidity", enabled: true, custom: false },
  { id: uid(), name: "Overall match rate", formula: "confirmed / posted", target: 80, unit: "%", frequency: "Weekly", category: "Liquidity", enabled: true, custom: false },
  { id: uid(), name: "Monthly GMV", formula: "sum(confirmed shift value)", target: 100000, unit: "€", frequency: "Monthly", category: "Revenue", enabled: true, custom: false },
  { id: uid(), name: "Dispute rate", formula: "disputes / confirmed", target: 2, unit: "%", frequency: "Weekly", category: "Trust & Safety", enabled: true, custom: false },
];

// ── Context shape ──
interface StoreValue {
  lists: Record<ListKey, ListOption[]>;
  workers: Worker[];
  businesses: Business[];
  shifts: Shift[];
  matches: Match[];
  disputes: Dispute[];
  kpis: KpiConfig[];
  adminUsers: AdminUser[];
  platform: PlatformConfig;
  window: ConfirmationWindow;

  // list mutators
  activeOptions: (key: ListKey) => string[];
  addOption: (key: ListKey, name: string) => void;
  renameOption: (key: ListKey, id: string, name: string) => void;
  toggleOption: (key: ListKey, id: string) => void;
  moveOption: (key: ListKey, id: string, dir: -1 | 1) => void;

  // entity mutators
  upsertWorker: (w: Worker) => void;
  removeWorker: (id: string) => void;
  upsertBusiness: (b: Business) => void;
  removeBusiness: (id: string) => void;
  upsertShift: (s: Shift) => void;
  removeShift: (id: string) => void;
  upsertMatch: (m: Match) => void;
  removeMatch: (id: string) => void;
  upsertDispute: (d: Dispute) => void;
  removeDispute: (id: string) => void;
  upsertKpi: (k: KpiConfig) => void;
  removeKpi: (id: string) => void;
  upsertAdminUser: (u: AdminUser) => void;
  removeAdminUser: (id: string) => void;

  setPlatform: (p: Partial<PlatformConfig>) => void;
  setWindow: (w: Partial<ConfirmationWindow>) => void;

  businessLabel: (id: string, revealed?: boolean) => string;
  newId: () => string;
}

const Ctx = createContext<StoreValue | undefined>(undefined);

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<Record<ListKey, ListOption[]>>({
    nationalities: opts(SEED_NATIONALITIES),
    languages: opts(SEED_LANGUAGES),
    skills: opts(SEED_SKILLS),
    sectors: opts(SEED_SECTORS),
    subSectors: opts(SEED_SUBSECTORS),
    cities: opts(SEED_CITIES),
    disputeIssueTypes: opts(SEED_ISSUE_TYPES),
    shiftRoles: opts(SEED_SHIFT_ROLES),
    adminRoles: opts(SEED_ADMIN_ROLES),
  });
  const [workers, setWorkers] = useState<Worker[]>(seedWorkers);
  const [businesses, setBusinesses] = useState<Business[]>(seedBusinesses);
  const [shifts, setShifts] = useState<Shift[]>(() => SEED_SHIFTS.map((s) => ({ ...s })));
  const [matches, setMatches] = useState<Match[]>(() => SEED_MATCHES.map((m) => ({ ...m })));
  const [disputes, setDisputes] = useState<Dispute[]>(seedDisputes);
  const [kpis, setKpis] = useState<KpiConfig[]>(SEED_KPIS);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => SEED_ADMINS.map((u) => ({ ...u })));
  const [platform, setPlatformState] = useState<PlatformConfig>({
    name: "Shiftinger",
    description: "Two-sided shift-work marketplace connecting flexible workers with hospitality and event businesses in Portugal.",
    cities: ["Lisbon", "Porto"],
    sectors: [...SEED_SECTORS],
    currency: "EUR (€)",
    timezone: "Europe/Lisbon",
  });
  const [windowCfg, setWindowState] = useState<ConfirmationWindow>({
    start: "07:00",
    end: "12:00",
    timezone: "Europe/Lisbon",
    autoExpiry: true,
    reminder: true,
  });

  const activeOptions = useCallback(
    (key: ListKey) => lists[key].filter((o) => o.active).map((o) => o.name),
    [lists],
  );
  const addOption = useCallback((key: ListKey, name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setLists((p) => {
      if (p[key].some((o) => o.name.toLowerCase() === clean.toLowerCase())) return p;
      return { ...p, [key]: [...p[key], { id: uid(), name: clean, active: true }] };
    });
  }, []);
  const renameOption = useCallback((key: ListKey, id: string, name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setLists((p) => ({ ...p, [key]: p[key].map((o) => (o.id === id ? { ...o, name: clean } : o)) }));
  }, []);
  const toggleOption = useCallback((key: ListKey, id: string) => {
    setLists((p) => ({ ...p, [key]: p[key].map((o) => (o.id === id ? { ...o, active: !o.active } : o)) }));
  }, []);
  const moveOption = useCallback((key: ListKey, id: string, dir: -1 | 1) => {
    setLists((p) => {
      const arr = [...p[key]];
      const i = arr.findIndex((o) => o.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return p;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...p, [key]: arr };
    });
  }, []);

  const upserter = <T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>) =>
    (item: T) =>
      setter((p) => (p.some((x) => x.id === item.id) ? p.map((x) => (x.id === item.id ? item : x)) : [item, ...p]));
  const remover = <T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>) =>
    (id: string) => setter((p) => p.filter((x) => x.id !== id));

  const value = useMemo<StoreValue>(() => ({
    lists,
    workers,
    businesses,
    shifts,
    matches,
    disputes,
    kpis,
    adminUsers,
    platform,
    window: windowCfg,
    activeOptions,
    addOption,
    renameOption,
    toggleOption,
    moveOption,
    upsertWorker: upserter(setWorkers),
    removeWorker: remover(setWorkers),
    upsertBusiness: upserter(setBusinesses),
    removeBusiness: remover(setBusinesses),
    upsertShift: upserter(setShifts),
    removeShift: remover(setShifts),
    upsertMatch: upserter(setMatches),
    removeMatch: remover(setMatches),
    upsertDispute: upserter(setDisputes),
    removeDispute: remover(setDisputes),
    upsertKpi: upserter(setKpis),
    removeKpi: remover(setKpis),
    upsertAdminUser: upserter(setAdminUsers),
    removeAdminUser: remover(setAdminUsers),
    setPlatform: (p) => setPlatformState((prev) => ({ ...prev, ...p })),
    setWindow: (w) => setWindowState((prev) => ({ ...prev, ...w })),
    businessLabel: (id, revealed = false) => {
      const b = businesses.find((x) => x.id === id);
      if (!b) return "—";
      return revealed && b.confirmed ? b.name : b.initials || maskBusiness(b.name, false);
    },
    newId: uid,
  }), [lists, workers, businesses, shifts, matches, disputes, kpis, adminUsers, platform, windowCfg, activeOptions, addOption, renameOption, toggleOption, moveOption]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminStore(): StoreValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminStore must be used within AdminStoreProvider");
  return ctx;
}

export const emptyWorker = (id: string): Worker => ({
  id,
  name: "",
  email: "",
  phone: "",
  nationality: "Portuguese",
  flag: "🇵🇹",
  languages: [],
  skills: [],
  atividade: false,
  atividadeNumber: "",
  city: "Lisbon",
  status: "active",
  totalShifts: 0,
  rating: 0,
  notes: "",
});

export const emptyBusiness = (id: string): Business => ({
  id,
  name: "",
  initials: "",
  city: "Lisbon",
  sector: "Hospitality",
  subSector: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  nif: "",
  verification: "pending",
  languagesRequired: [],
  preferredRoles: [],
  shiftsPosted: 0,
  avgRating: 0,
  confirmed: false,
  notes: "",
});

export { autoInitials };
