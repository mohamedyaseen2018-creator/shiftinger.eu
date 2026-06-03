import type { MatchCriterion } from "@/data/types";

export interface MatchableWorker {
  main_role: string | null;
  sub_roles: unknown;
  languages: unknown;
  min_rate: number | null;
  atividade: boolean;
  looking_for: unknown;
}

export interface MatchableJob {
  role: string;
  type: "single" | "parttime";
  rate: number;
  languages: unknown;
  atividade: string; // 'required' | 'preferred' | 'not-required'
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

/**
 * Score a worker against a job. The same logic powers both the worker view
 * (how well a job fits me) and the business view (how well an applicant fits).
 * Returns 0–100 plus a per-criterion breakdown (matched = green, else red).
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

  criteria.push({
    label: `Role: ${job.role}`,
    matched: workerRoles.some((r) => r.toLowerCase() === job.role.toLowerCase()),
  });

  criteria.push({
    label: jobLangs.length ? `Languages: ${jobLangs.join(", ")}` : "No language requirement",
    matched: jobLangs.length === 0 || jobLangs.every((l) => workerLangs.includes(l)),
  });

  criteria.push({
    label: `Pay ≥ your rate (€${worker.min_rate ?? 0}/hr)`,
    matched: (worker.min_rate ?? 0) <= job.rate,
  });

  if (job.atividade === "required") {
    criteria.push({ label: "Open atividade required", matched: worker.atividade });
  } else {
    criteria.push({ label: "Atividade not required", matched: true });
  }

  criteria.push({
    label: job.type === "single" ? "Single shift" : "Part-time role",
    matched: lookingFor.length === 0 || lookingFor.includes(job.type),
  });

  const matched = criteria.filter((c) => c.matched).length;
  const score = Math.round((matched / criteria.length) * 100);
  return { score, criteria };
}

export function matchColor(score: number) {
  if (score >= 80) return { text: "text-green-600", bar: "bg-green-500" };
  if (score >= 50) return { text: "text-amber-600", bar: "bg-amber-500" };
  return { text: "text-red-500", bar: "bg-red-400" };
}
