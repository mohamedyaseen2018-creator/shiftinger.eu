import type { MatchCriterion } from "@/data/types";

export interface MatchableWorker {
  main_role: string | null;
  sub_roles: unknown;
  languages: unknown;
  min_rate: number | null;
  atividade: boolean;
  looking_for: unknown;
  /** Optional richer signals for the detailed breakdown */
  rating?: number | null;
  main_role_years?: number | null;
  available_days?: unknown;
  city?: string | null;
}

export interface MatchableJob {
  role: string;
  type: "single" | "parttime";
  rate: number;
  languages: unknown;
  atividade: string; // 'required' | 'preferred' | 'not-required'
  date?: string | null;
  city?: string | null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => {
      if (typeof v === "string") return v;
      if (v && typeof v === "object" && "role" in v) return String((v as { role: unknown }).role);
      if (v && typeof v === "object" && "language" in v) return String((v as { language: unknown }).language);
      return "";
    })
    .filter(Boolean);
}

/** Years of experience the worker has in the given role (main or sub). */
function yearsForRole(worker: MatchableWorker, role: string): number {
  if ((worker.main_role ?? "").toLowerCase() === role.toLowerCase()) {
    return worker.main_role_years ?? 0;
  }
  if (Array.isArray(worker.sub_roles)) {
    const hit = (worker.sub_roles as { role?: unknown; years?: unknown }[]).find(
      (s) => String(s?.role ?? "").toLowerCase() === role.toLowerCase(),
    );
    if (hit) return Number(hit.years) || 0;
  }
  return 0;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Score a worker against a job. The same logic powers both the worker view
 * (how well a job fits me) and the business view (how well an applicant fits).
 * Returns 0–100 plus a per-criterion breakdown (matched = green, else red).
 * Criteria are ordered so the most meaningful ones render first on the card.
 */
export function computeMatch(worker: MatchableWorker, job: MatchableJob): {
  score: number;
  criteria: MatchCriterion[];
} {
  const workerRoles = [worker.main_role ?? "", ...asStringArray(worker.sub_roles)].filter(Boolean);
  const workerLangs = asStringArray(worker.languages);
  const jobLangs = asStringArray(job.languages);
  const lookingFor = asStringArray(worker.looking_for);

  const criteria: MatchCriterion[] = [];

  // 1. Role match
  const roleMatch = workerRoles.some((r) => r.toLowerCase() === job.role.toLowerCase());
  criteria.push({ label: `${job.role} role`, matched: roleMatch });

  // 2. Language match (only when the job requires languages)
  if (jobLangs.length > 0) {
    criteria.push({
      label: `${jobLangs.join(", ")} required`,
      matched: jobLangs.every((l) => workerLangs.includes(l)),
    });
  }

  // 3. Availability date match (single shifts with a date)
  if (job.date) {
    const weekday = new Date(job.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" });
    const days = asStringArray(worker.available_days);
    criteria.push({
      label: `Available ${shortDate(job.date)}`,
      matched: days.length === 0 ? false : days.includes(weekday),
    });
  }

  // 4. Experience level in the job role
  const years = yearsForRole(worker, job.role);
  criteria.push({
    label: years > 0 ? `${years} yr${years !== 1 ? "s" : ""} experience` : "No experience listed",
    matched: years > 0,
  });

  // 5. Rating exists
  const rating = Number(worker.rating) || 0;
  criteria.push({
    label: rating > 0 ? `Rated ${rating.toFixed(1)}★` : "No rating yet",
    matched: rating > 0,
  });

  // 6. Location proximity (only when the job has a city)
  if (job.city) {
    const sameCity = !!worker.city && worker.city.toLowerCase() === job.city.toLowerCase();
    criteria.push({
      label: worker.city ? (sameCity ? `In ${job.city}` : `Based in ${worker.city}`) : "Location unverified",
      matched: sameCity,
    });
  }

  // 7. Pay vs worker minimum
  criteria.push({
    label: "Meets your min rate",
    matched: (worker.min_rate ?? 0) <= job.rate,
  });

  // 8. Atividade (only when required)
  if (job.atividade === "required") {
    criteria.push({ label: "Open atividade", matched: worker.atividade });
  }

  // 9. Shift type preference
  criteria.push({
    label: job.type === "single" ? "Single shift" : "Part-time role",
    matched: lookingFor.length === 0 || lookingFor.includes(job.type),
  });

  const matched = criteria.filter((c) => c.matched).length;
  const score = Math.round((matched / criteria.length) * 100);
  return { score, criteria };
}

export function matchColor(score: number) {
  if (score >= 70) return { text: "text-green-600", bar: "bg-green-500" };
  if (score >= 40) return { text: "text-amber-600", bar: "bg-amber-500" };
  return { text: "text-red-500", bar: "bg-red-400" };
}
