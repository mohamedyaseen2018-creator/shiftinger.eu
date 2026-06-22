import { supabase } from "@/integrations/supabase/client";
import type { Job } from "@/data/types";

interface BusinessLite {
  user_id: string;
  business_name: string | null;
  category: string | null;
  city: string | null;
  area: string | null;
  rating: number;
  rating_count: number;
  is_early_bird: boolean;
  avatar_url: string | null;
}

export interface JobRow {
  id: string;
  owner_id: string;
  role: string;
  type: "single" | "parttime";
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  working_days: unknown;
  start_date: string | null;
  end_date: string | null;
  rate: number;
  spots: number;
  spots_remaining: number;
  languages: unknown;
  atividade: string;
  note: string | null;
  skills: unknown;
  status: string;
  created_at: string;
}

/** Coerce a languages value (which may be strings or {language, level} objects) to a string[]. */
function normalizeLanguages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "language" in item) {
        return String((item as { language: unknown }).language ?? "");
      }
      return "";
    })
    .filter((lang): lang is string => lang.length > 0);
}

/** Map a DB job row + its business to the legacy Job shape used by JobCard. */
export function toJob(row: JobRow, biz?: BusinessLite): Job {
  return {
    id: row.id,
    businessId: row.owner_id,
    businessName: biz?.business_name ?? "Business",
    businessCategory: biz?.category ?? "Hospitality",
    area: biz?.area ?? "",
    city: biz?.city ?? "",
    role: row.role,
    type: row.type,
    date: row.date ?? undefined,
    startTime: row.start_time?.slice(0, 5) ?? undefined,
    endTime: row.end_time?.slice(0, 5) ?? undefined,
    workingDays: Array.isArray(row.working_days) ? (row.working_days as string[]) : [],
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    rate: Number(row.rate),
    spots: row.spots,
    spotsRemaining: row.spots_remaining,
    languages: normalizeLanguages(row.languages),
    atividade: row.atividade as Job["atividade"],
    note: row.note ?? undefined,
    skills: Array.isArray(row.skills) ? (row.skills as string[]) : [],
    postedAt: row.created_at,
    status: row.status === "open" ? "open" : "closed",
    applicants: 0,
    placeRating: biz?.rating ?? null,
    placeRatingCount: biz?.rating_count ?? 0,
    businessAvatarUrl: biz?.avatar_url ?? null,
  };
}

/** Fetch open jobs with their business info. */
export async function fetchOpenJobs(): Promise<{ jobs: JobRow[]; businesses: Record<string, BusinessLite> }> {
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const rows = (jobs ?? []) as JobRow[];
  const ownerIds = [...new Set(rows.map((j) => j.owner_id))];
  const businesses: Record<string, BusinessLite> = {};
  if (ownerIds.length) {
    const { data: bps } = await supabase.rpc("get_public_business_profiles", {
      _user_ids: ownerIds,
    });
    (bps ?? []).forEach((b) => {
      const row = b as BusinessLite;
      businesses[row.user_id] = {
        user_id: row.user_id,
        business_name: row.business_name,
        category: row.category,
        city: row.city,
        area: row.area,
        rating: row.rating,
        rating_count: row.rating_count,
        is_early_bird: row.is_early_bird,
      };
    });
  }
  return { jobs: rows, businesses };
}
