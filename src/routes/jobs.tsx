import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import JobCard from "@/components/features/JobCard";
import { MOCK_JOBS } from "@/data/mockData";
import { ROLE_OPTIONS, CITY_OPTIONS } from "@/data/utils";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Jobs available — Shiftinger" },
      { name: "description", content: "Browse the latest hospitality shifts and part-time roles across Portugal on Shiftinger." },
      { property: "og:title", content: "Jobs available — Shiftinger" },
      { property: "og:description", content: "Find your next shift across Portugal." },
    ],
  }),
  component: JobsPage,
});

const ROLE_FILTER = ["All roles", ...ROLE_OPTIONS];
const TYPE_FILTER = ["All types", "Single shift", "Part-time"];
const CITY_FILTER = ["All cities", ...CITY_OPTIONS];
const PAY_FILTER = ["Any", "€8+/hr", "€10+/hr", "€12+/hr", "€14+/hr"];
const minPay: Record<string, number> = { "€8+/hr": 8, "€10+/hr": 10, "€12+/hr": 12, "€14+/hr": 14 };

const selectCls =
  "rounded-md border-0 bg-white px-3 py-2 text-sm text-ink ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-teal";

function JobsPage() {
  const [role, setRole] = useState("All roles");
  const [type, setType] = useState("All types");
  const [city, setCity] = useState("All cities");
  const [pay, setPay] = useState("Any");
  const [keyword, setKeyword] = useState("");
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return MOCK_JOBS.filter((job) => {
      if (role !== "All roles" && job.role !== role) return false;
      if (type === "Single shift" && job.type !== "single") return false;
      if (type === "Part-time" && job.type !== "parttime") return false;
      if (city !== "All cities" && job.city !== city) return false;
      if (pay !== "Any" && job.rate < minPay[pay]) return false;
      if (
        keyword &&
        !job.role.toLowerCase().includes(keyword.toLowerCase()) &&
        !job.area.toLowerCase().includes(keyword.toLowerCase())
      )
        return false;
      return true;
    });
  }, [role, type, city, pay, keyword]);

  return (
    <SiteLayout>
      <div className="border-b border-ink/5 bg-ink px-6 py-14 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">Browse shifts</span>
          <h1 className="mt-2 font-serif text-4xl text-canvas">Jobs available now</h1>
          <p className="mt-2 text-canvas/60">Find your next shift across Portugal.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-ink/5">
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              placeholder="Search role or area…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-md border-0 bg-canvas py-2 pl-9 pr-3 text-sm text-ink ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
          {[
            { value: role, setter: setRole, options: ROLE_FILTER },
            { value: type, setter: setType, options: TYPE_FILTER },
            { value: city, setter: setCity, options: CITY_FILTER },
            { value: pay, setter: setPay, options: PAY_FILTER },
          ].map((f, i) => (
            <select key={i} value={f.value} onChange={(e) => f.setter(e.target.value)} className={selectCls}>
              {f.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ))}
          <div className="ml-auto flex items-center gap-2 text-sm text-ink/50">
            <SlidersHorizontal size={14} />
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center text-ink/40">
            <p className="font-serif text-lg">No shifts match your filters</p>
            <p className="mt-2 text-sm">Try adjusting the role, city, or pay filters above.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                applied={applied.has(job.id)}
                onApply={(id) => setApplied((p) => new Set([...p, id]))}
              />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
