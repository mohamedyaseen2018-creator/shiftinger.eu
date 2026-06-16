import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import WorkerCard from "@/components/features/WorkerCard";
import { listVisibleWorkers } from "@/lib/talent.functions";
import { ROLE_OPTIONS, CITY_OPTIONS } from "@/data/utils";
import type { WorkerProfile } from "@/data/types";

export const Route = createFileRoute("/talent")({
  head: () => ({
    meta: [
      { title: "Find talent — Shiftinger" },
      { name: "description", content: "Browse verified, skill-matched hospitality workers available for shifts across Portugal." },
      { property: "og:title", content: "Find talent — Shiftinger" },
      { property: "og:description", content: "Verified, skill-matched workers ready for shifts across Portugal." },
    ],
  }),
  component: TalentPage,
});

const ROLE_FILTER = ["All roles", ...ROLE_OPTIONS];
const CITY_FILTER = ["All cities", ...CITY_OPTIONS];
const ATIV_FILTER = ["Any", "Active Atividade only"];

const selectCls =
  "rounded-md border-0 bg-white px-3 py-2 text-sm text-ink ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-teal";

function mapWorker(r: Record<string, unknown>): WorkerProfile {
  const langs = Array.isArray(r.languages) ? (r.languages as { language: string; level: string }[]) : [];
  const days = Array.isArray(r.available_days) ? (r.available_days as string[]) : [];
  return {
    id: r.id as string,
    userId: r.user_id as string,
    name: (r.name as string) ?? "Worker",
    city: (r.city as string) ?? "",
    mainRole: (r.main_role as string) ?? "",
    mainRoleYears: (r.main_role_years as number) ?? 0,
    subRoles: Array.isArray(r.sub_roles) ? (r.sub_roles as { role: string; years: number }[]) : [],
    languages: langs,
    experience: [],
    atividade: Boolean(r.atividade),
    verified: Boolean(r.verified),
    rating: Number(r.rating) || 0,
    shiftsCompleted: (r.shifts_completed as number) ?? 0,
    bio: (r.bio as string) ?? "",
    availability: {
      lookingFor: Array.isArray(r.looking_for) ? (r.looking_for as string[]) : [],
      days,
      timeSlots: Array.isArray(r.time_slots) ? (r.time_slots as string[]) : [],
      minRate: Number(r.min_rate) || 0,
      bio: (r.bio as string) ?? "",
      visible: Boolean(r.availability_visible),
    },
    minRate: Number(r.min_rate) || 0,
    phone: (r.phone as string) ?? "",
    nationality: (r.nationality as string) ?? "",
    avatarUrl: (r.avatar_url as string) ?? null,
    portfolioUrl: (r.portfolio_url as string) ?? null,
    haccp: Boolean(r.haccp_verified),
  };
}

function TalentPage() {
  const [role, setRole] = useState("All roles");
  const [city, setCity] = useState("All cities");
  const [ativ, setAtiv] = useState("Any");
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);

  useEffect(() => {
    listVisibleWorkers()
      .then((data) => {
        setWorkers((data ?? []).map((r) => mapWorker(r as Record<string, unknown>)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return workers
      .filter((w) => {
        if (role !== "All roles" && w.mainRole !== role && !w.subRoles.some((sr) => sr.role === role)) return false;
        if (city !== "All cities" && w.city !== city) return false;
        if (ativ === "Active Atividade only" && !w.atividade) return false;
        return true;
      })
      .sort((a, b) => b.rating - a.rating);
  }, [workers, role, city, ativ]);

  return (
    <SiteLayout>
      <div className="border-b border-ink/5 bg-ink px-6 py-14 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">Browse talent</span>
          <h1 className="mt-2 font-serif text-4xl text-canvas">Available workers</h1>
          <p className="mt-2 text-canvas/60">Verified, skill-matched workers ready for shifts across Portugal.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-ink/5">
          {[
            { value: role, setter: setRole, options: ROLE_FILTER },
            { value: city, setter: setCity, options: CITY_FILTER },
            { value: ativ, setter: setAtiv, options: ATIV_FILTER },
          ].map((f, i) => (
            <select key={i} value={f.value} onChange={(e) => f.setter(e.target.value)} className={selectCls}>
              {f.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ))}
          <div className="ml-auto flex items-center gap-2 text-sm text-ink/50">
            <SlidersHorizontal size={14} />
            {filtered.length} worker{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-ink/40">
            <p className="font-serif text-lg">No workers available yet</p>
            <p className="mt-2 text-sm">Verified workers who make their profile visible will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((w) => (
              <WorkerCard key={w.id} worker={w} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
