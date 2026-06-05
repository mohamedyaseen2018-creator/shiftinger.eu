// ============================================================================
// Mock data for the Shiftinger admin console.
//
// Structured to be Supabase-ready: each entity matches a future table shape and
// is exposed through small "hook-like" getters (useAdminWorkers, etc.) so the
// data source can later be swapped for real queries without touching the UI.
// ============================================================================

export type WorkerStatus = "active" | "inactive";
export type ShiftStatus = "open" | "matched" | "confirmed" | "expired" | "cancelled";
export type DisputeStatus = "open" | "resolved";
export type ActivityKind =
  | "worker_registered"
  | "shift_confirmed"
  | "application_pending"
  | "business_flagged"
  | "dispute_raised";

export interface AdminWorker {
  id: string;
  name: string;
  nationality: string;
  flag: string;
  atividade: boolean;
  skills: string[];
  totalShifts: number;
  rating: number;
  status: WorkerStatus;
  city: string;
}

export interface AdminBusiness {
  id: string;
  name: string; // real name (kept private — never rendered directly)
  city: string;
  sector: string;
  shiftsPosted: number;
  avgRating: number;
  verified: boolean;
  confirmed: boolean; // mutually confirmed at least one shift -> may reveal name
  status: WorkerStatus;
}

export interface AdminShift {
  id: string;
  businessId: string;
  role: string;
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  pay: number; // €/hr
  applications: number;
  status: ShiftStatus;
  city: string;
  confirmed: boolean;
}

export interface AdminMatch {
  id: string;
  workerName: string;
  businessId: string;
  role: string;
  date: string;
  score: number; // 0-100
  status: "pending" | "confirmed" | "declined";
}

export interface AdminDispute {
  id: string;
  workerName: string;
  businessId: string;
  issueType: string;
  raised: string; // ISO date
  status: DisputeStatus;
}

export interface AdminActivity {
  id: string;
  kind: ActivityKind;
  label: string;
  ts: string; // ISO timestamp
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "Super admin" | "Operations" | "Support";
  lastActive: string;
}

// ── Privacy helper — businesses show initials only until confirmed ──
export function maskBusiness(name: string, confirmed: boolean): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join(".");
  if (confirmed) return name;
  return `${initials}.***`;
}

// ── Confirmation window: only valid 07:00–12:00 Lisbon time ──
export function isConfirmationWindowOpen(now: Date = new Date()): boolean {
  // Lisbon ≈ Europe/Lisbon; derive the hour in that timezone.
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Europe/Lisbon",
    }).format(now),
  );
  return hour >= 7 && hour < 12;
}

// ── KPI cards ──
export interface Kpi {
  key: string;
  label: string;
  value: string;
  delta: number; // percent vs last month
}

export const KPIS: Kpi[] = [
  { key: "workers", label: "Total registered workers", value: "1,284", delta: 8.2 },
  { key: "businesses", label: "Active businesses", value: "87", delta: 4.5 },
  { key: "posted", label: "Shifts posted this month", value: "4,610", delta: 12.1 },
  { key: "confirmed", label: "Confirmed shifts", value: "3,367", delta: 6.7 },
  { key: "matchrate", label: "Overall match rate", value: "73%", delta: -2.3 },
  { key: "gmv", label: "Monthly GMV", value: "€84,000", delta: 9.4 },
];

// ── Charts ──
export const SHIFTS_BY_MONTH = [
  { month: "Jan", confirmed: 420, unmatched: 180 },
  { month: "Feb", confirmed: 510, unmatched: 160 },
  { month: "Mar", confirmed: 605, unmatched: 210 },
  { month: "Apr", confirmed: 580, unmatched: 145 },
  { month: "May", confirmed: 690, unmatched: 175 },
  { month: "Jun", confirmed: 3367 / 5, unmatched: 130 },
];

export const NATIONALITY_SPLIT = [
  { name: "PT", value: 540 },
  { name: "BR", value: 410 },
  { name: "IN", value: 190 },
  { name: "Other", value: 144 },
];

export const REGISTRATIONS_BY_WEEK = [
  { week: "W1", count: 22 },
  { week: "W2", count: 31 },
  { week: "W3", count: 28 },
  { week: "W4", count: 44 },
  { week: "W5", count: 39 },
  { week: "W6", count: 52 },
  { week: "W7", count: 47 },
  { week: "W8", count: 61 },
];

export const TOP_SECTORS = [
  { sector: "Hospitality", count: 38 },
  { sector: "Events", count: 21 },
  { sector: "Catering", count: 14 },
  { sector: "Retail", count: 9 },
  { sector: "Other", count: 5 },
];

// ── Platform health (mock indicators) ──
export const PLATFORM_HEALTH = [
  { label: "Uptime (30d)", value: "99.98%", ok: true },
  { label: "Database", value: "Operational", ok: true },
  { label: "API", value: "Operational", ok: true },
  { label: "Job queue", value: "Degraded", ok: false },
];

// ── Workers ──
const NATIONS: { n: string; f: string }[] = [
  { n: "Portuguese", f: "🇵🇹" },
  { n: "Brazilian", f: "🇧🇷" },
  { n: "Indian", f: "🇮🇳" },
  { n: "Cape Verdean", f: "🇨🇻" },
  { n: "Ukrainian", f: "🇺🇦" },
  { n: "Nepali", f: "🇳🇵" },
  { n: "Angolan", f: "🇦🇴" },
  { n: "Italian", f: "🇮🇹" },
];

const SKILLS = [
  "Waiter/Server",
  "Barista",
  "Kitchen assistant",
  "Bartender",
  "Host/Cashier",
  "Dishwasher",
  "Event staff",
  "Cleaning",
  "Catering",
];

const WORKER_NAMES = [
  "João Costa", "Maria Silva", "Ana Ferreira", "Pedro Almeida", "Sofia Rodrigues",
  "Lucas Oliveira", "Beatriz Santos", "Tiago Martins", "Carla Sousa", "Rafael Lima",
  "Mariana Pereira", "Bruno Carvalho", "Inês Gomes", "Diogo Ribeiro", "Catarina Lopes",
  "André Marques", "Priya Sharma", "Arjun Patel", "Oleksiy Bondar", "Daryna Kovalenko",
  "Cláudia Nunes", "Ricardo Fonseca", "Helena Dias", "Miguel Castro", "Patrícia Reis",
  "Fábio Teixeira", "Sara Cunha", "Nuno Barbosa", "Teresa Moreira", "Vasco Pinto",
  "Amara Tavares", "Edson Monteiro", "Giulia Romano", "Suman Thapa", "Yara Mendes",
];

const CITIES = ["Lisbon", "Porto"];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export const WORKERS: AdminWorker[] = WORKER_NAMES.map((name, i) => {
  const r = rng(i + 1);
  const nat = NATIONS[Math.floor(r() * NATIONS.length)];
  const skillCount = 1 + Math.floor(r() * 3);
  const skills = [...SKILLS].sort(() => r() - 0.5).slice(0, skillCount);
  return {
    id: `wk-${(i + 1).toString().padStart(3, "0")}`,
    name,
    nationality: nat.n,
    flag: nat.f,
    atividade: r() > 0.4,
    skills,
    totalShifts: Math.floor(r() * 120),
    rating: Math.round((3.6 + r() * 1.4) * 10) / 10,
    status: r() > 0.25 ? "active" : "inactive",
    city: CITIES[Math.floor(r() * CITIES.length)],
  };
});

// ── Businesses ──
const BUSINESS_NAMES = [
  "Ribeira Palace", "Cervejaria Atlântico", "Café Bonjardim", "Tasca do Bairro",
  "Douro Wine House", "Praça Catering", "Eventos Lumina", "Pastelaria Aurora",
  "Marisqueira Norte", "Bistro Alfama", "Sushi Vega", "Padaria Central",
  "Hotel Estrela", "Rooftop Sete", "Garden Brunch", "Mercado Vivo",
  "Vinho & Co", "Festa Logística", "Bar Mira", "Casa do Peixe",
];

const SECTORS = ["Hospitality", "Events", "Catering", "Retail", "Other"];

export const BUSINESSES: AdminBusiness[] = BUSINESS_NAMES.map((name, i) => {
  const r = rng(i + 100);
  const confirmed = r() > 0.55;
  return {
    id: `bz-${(i + 1).toString().padStart(3, "0")}`,
    name,
    city: CITIES[Math.floor(r() * CITIES.length)],
    sector: SECTORS[Math.floor(r() * SECTORS.length)],
    shiftsPosted: Math.floor(r() * 200),
    avgRating: Math.round((3.8 + r() * 1.2) * 10) / 10,
    verified: r() > 0.35,
    confirmed,
    status: r() > 0.2 ? "active" : "inactive",
  };
});

export function businessById(id: string): AdminBusiness | undefined {
  return BUSINESSES.find((b) => b.id === id);
}

// ── Shifts ──
const SHIFT_STATUSES: ShiftStatus[] = ["open", "matched", "confirmed", "expired", "cancelled"];

export const SHIFTS: AdminShift[] = Array.from({ length: 42 }, (_, i) => {
  const r = rng(i + 500);
  const biz = BUSINESSES[Math.floor(r() * BUSINESSES.length)];
  const status = SHIFT_STATUSES[Math.floor(r() * SHIFT_STATUSES.length)];
  const day = new Date();
  day.setDate(day.getDate() + Math.floor(r() * 30) - 10);
  const startH = 7 + Math.floor(r() * 12);
  const dur = 4 + Math.floor(r() * 5);
  return {
    id: `SH-${(2480 + i).toString()}`,
    businessId: biz.id,
    role: SKILLS[Math.floor(r() * SKILLS.length)],
    date: day.toISOString().slice(0, 10),
    startTime: `${startH.toString().padStart(2, "0")}:00`,
    endTime: `${Math.min(23, startH + dur).toString().padStart(2, "0")}:00`,
    pay: 8 + Math.floor(r() * 9),
    applications: Math.floor(r() * 14),
    status,
    city: biz.city,
    confirmed: status === "confirmed",
  };
});

// ── Matches ──
export const MATCHES: AdminMatch[] = Array.from({ length: 16 }, (_, i) => {
  const r = rng(i + 900);
  const biz = BUSINESSES[Math.floor(r() * BUSINESSES.length)];
  const worker = WORKERS[Math.floor(r() * WORKERS.length)];
  const day = new Date();
  day.setDate(day.getDate() + Math.floor(r() * 14) - 5);
  return {
    id: `MT-${(700 + i).toString()}`,
    workerName: worker.name,
    businessId: biz.id,
    role: worker.skills[0] ?? "Waiter/Server",
    date: day.toISOString().slice(0, 10),
    score: 60 + Math.floor(r() * 40),
    status: (["pending", "confirmed", "declined"] as const)[Math.floor(r() * 3)],
  };
});

// ── Disputes ──
const ISSUE_TYPES = [
  "No-show (worker)",
  "No-show (business)",
  "Pay discrepancy",
  "Hours mismatch",
  "Behaviour report",
  "Cancellation late",
];

export const DISPUTES: AdminDispute[] = Array.from({ length: 9 }, (_, i) => {
  const r = rng(i + 1300);
  const biz = BUSINESSES[Math.floor(r() * BUSINESSES.length)];
  const worker = WORKERS[Math.floor(r() * WORKERS.length)];
  const day = new Date();
  day.setDate(day.getDate() - Math.floor(r() * 20));
  return {
    id: `DP-${(40 + i).toString()}`,
    workerName: worker.name,
    businessId: biz.id,
    issueType: ISSUE_TYPES[Math.floor(r() * ISSUE_TYPES.length)],
    raised: day.toISOString().slice(0, 10),
    status: r() > 0.45 ? "open" : "resolved",
  };
});

// ── Activity feed ──
export const ACTIVITY: AdminActivity[] = [
  { id: "a1", kind: "worker_registered", label: "New worker registered — Yara Mendes (🇧🇷)", ts: minsAgo(3) },
  { id: "a2", kind: "shift_confirmed", label: "Shift SH-2491 confirmed — D.W.***", ts: minsAgo(11) },
  { id: "a3", kind: "application_pending", label: "Application nearing window expiry — SH-2486", ts: minsAgo(24) },
  { id: "a4", kind: "business_flagged", label: "Business flagged: incomplete profile — B.M.***", ts: minsAgo(38) },
  { id: "a5", kind: "dispute_raised", label: "Dispute raised — pay discrepancy (DP-46)", ts: minsAgo(52) },
  { id: "a6", kind: "worker_registered", label: "New worker registered — Suman Thapa (🇳🇵)", ts: minsAgo(74) },
  { id: "a7", kind: "shift_confirmed", label: "Shift SH-2483 confirmed — R.P.***", ts: minsAgo(96) },
  { id: "a8", kind: "application_pending", label: "Application pending review — SH-2490", ts: minsAgo(120) },
];

function minsAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString();
}

// ── Admin users ──
export const ADMIN_USERS: AdminUser[] = [
  { id: "u1", name: "Sara Marques", email: "sara@shiftinger.pt", role: "Super admin", lastActive: minsAgo(5) },
  { id: "u2", name: "Tomás Field", email: "tomas@shiftinger.pt", role: "Operations", lastActive: minsAgo(60) },
  { id: "u3", name: "Lena Ortega", email: "lena@shiftinger.pt", role: "Support", lastActive: minsAgo(220) },
  { id: "u4", name: "Hugo Brito", email: "hugo@shiftinger.pt", role: "Support", lastActive: minsAgo(1440) },
];

export const NATIONALITY_FILTER = Array.from(new Set(WORKERS.map((w) => w.nationality)));
export const CITY_FILTER = CITIES;
export const SECTOR_FILTER = SECTORS;
