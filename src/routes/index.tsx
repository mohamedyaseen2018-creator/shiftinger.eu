import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Lock, CheckCircle, Plus } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import JobCard from "@/components/features/JobCard";
import WorkerCard from "@/components/features/WorkerCard";
import { MOCK_JOBS, MOCK_WORKERS } from "@/data/mockData";
import { useSiteContent } from "@/components/site/SiteContentProvider";
import { getPlatformStats } from "@/lib/stats.functions";
import cafeHero from "@/assets/cafe-hero.jpg";

export const Route = createFileRoute("/")({
  loader: () => getPlatformStats(),
  head: () => ({
    meta: [
      { title: "Shiftinger — Flexible hospitality work in Portugal" },
      {
        name: "description",
        content:
          "Shiftinger connects workers with restaurants, cafés and event businesses across Portugal. Find shifts, post availability, and hire verified, skill-matched talent — privately.",
      },
      { property: "og:title", content: "Shiftinger — Flexible hospitality work in Portugal" },
      {
        property: "og:description",
        content: "Find shifts. Find talent. Build your income. Privacy-first flexible work across Portugal.",
      },
    ],
  }),
  component: HomePage,
});

const WORKER_STEPS = [
  { n: "01", title: "Create your profile", body: "Register with your skills, experience, languages, and upload your ID for verification." },
  { n: "02", title: "Post your availability", body: "Set the days, times, and minimum rate you're willing to work. Businesses browsing talent can find you." },
  { n: "03", title: "Browse and apply", body: "Find shifts that match your skills. Apply with one tap — your profile is auto-attached." },
  { n: "04", title: "Confirm and show up", body: "Once accepted, confirm within 2 hours. The business location is revealed only at this point." },
];

const BUSINESS_STEPS = [
  { n: "01", title: "Register your business", body: "Add your details, contact person, and verify. Your exact address stays private." },
  { n: "02", title: "Post a shift or part-time role", body: "Select role, date, hours, pay rate, and skill requirements using simple checkboxes." },
  { n: "03", title: "Review matched candidates", body: "See applicants ranked by match %, with skills, experience, rating, and distance at a glance." },
  { n: "04", title: "Accept and connect", body: "Accept a candidate — they confirm within 2 hours and you both get each other's contact details." },
];

const PRIVACY_ITEMS = [
  "Business name shown as initials only in public feed",
  "Neighbourhood shown — not street address",
  "Full address revealed only after mutual confirmation",
  "Worker contact shared only with businesses who accepted them",
];

function HomePage() {
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const { c } = useSiteContent();
  const stats = Route.useLoaderData();

  const STATS = [
    { value: stats.shiftsPosted.toLocaleString("en"), label: "Shifts posted" },
    { value: stats.registeredWorkers.toLocaleString("en"), label: "Registered workers" },
    { value: stats.fillRate === null ? "—" : `${stats.fillRate}%`, label: "Fill rate" },
  ];

  return (
    <SiteLayout>
      {/* Free-tier banner */}
      <div className="bg-teal px-4 py-2 text-center text-xs uppercase tracking-widest text-canvas">
        {c("home.banner")}
      </div>

      {/* ── HERO (asymmetric + sticky rail) ── */}
      <section className="py-10 lg:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex flex-col gap-12 lg:flex-row">
            {/* Main */}
            <div className="flex-1">
              <div className="mb-8 flex items-center gap-3">
                <span className="h-px w-8 bg-gold/40" />
                <span className="text-xs font-semibold uppercase tracking-widest text-gold">
                  {c("home.hero_eyebrow")}
                </span>
              </div>
              <h1 className="max-w-[18ch] text-balance font-serif text-3xl leading-[1.1] text-ink sm:text-4xl md:text-5xl lg:text-7xl">
                {c("home.hero_title")}
              </h1>
              <p className="mt-8 max-w-[52ch] text-pretty text-lg text-ink/70">
                <span className="font-semibold text-ink">Need extra shifts?</span>{" "}
                Shiftinger connects chefs, baristas, and hospitality professionals with restaurants, cafés, and event venues across Portugal — work when you want, as much as you want.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  to="/register"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-teal px-6 text-sm font-medium text-canvas transition-colors hover:bg-teal-light"
                >
                  {c("home.hero_cta_primary")} <ArrowRight size={16} />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-11 items-center rounded-full px-6 text-sm font-medium text-ink ring-1 ring-ink/10 transition-colors hover:bg-ink/5"
                >
                  {c("home.hero_cta_secondary")}
                </Link>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-10 gap-y-6">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <p className="font-serif text-2xl text-teal sm:text-3xl">{s.value}</p>
                    <p className="mt-0.5 text-sm text-ink/50">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sticky rail */}
            <div className="lg:w-80">
              <div className="space-y-6 lg:sticky lg:top-24">
                <div className="rounded-2xl bg-white p-6 ring-1 ring-ink/5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gold">Launch offer</span>
                    <div className="size-2 animate-pulse rounded-full bg-teal" />
                  </div>
                  <p className="text-sm leading-relaxed text-ink/80">
                    First <span className="font-semibold text-ink">500 workers</span> &amp;{" "}
                    <span className="font-semibold text-ink">100 businesses</span> join with zero service fees.
                  </p>
                  <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-ink/5">
                    <div className="h-full w-2/3 bg-teal" />
                  </div>
                  <p className="mt-2 text-[10px] text-ink/40">Live counter updates as members join</p>
                  <Link
                    to="/register"
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-gold text-xs font-medium text-canvas transition-colors hover:bg-gold-dark"
                  >
                    <Plus size={13} /> Claim your free spot
                  </Link>
                </div>

                <div className="overflow-hidden rounded-2xl ring-1 ring-ink/5">
                  <img
                    src={cafeHero}
                    alt="Sunlit minimalist Lisbon café interior"
                    width={600}
                    height={800}
                    className="aspect-[3/4] w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (dark) ── */}
      <section className="bg-ink py-12 text-canvas sm:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-8 max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">How it works</span>
            <h2 className="mt-2 font-serif text-2xl leading-tight sm:text-3xl">
              {c("home.how_title")}
            </h2>
            <p className="mt-3 text-sm text-canvas/60">
              {c("home.how_subtitle")}
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            <div>
              <span className="mb-4 inline-block rounded-full bg-teal px-3 py-1 text-[10px] font-medium text-canvas">
                For workers
              </span>
              <div className="grid gap-2 sm:grid-cols-2">
                {WORKER_STEPS.map((step) => (
                  <div
                    key={step.n}
                    className="rounded-lg bg-canvas/[0.03] p-3 ring-1 ring-canvas/10"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-serif text-base italic text-teal-pale">{step.n}</span>
                      <h3 className="text-xs font-medium leading-tight text-teal-soft">{step.title}</h3>
                    </div>
                    <p className="text-[11px] leading-relaxed text-canvas/60">{step.body}</p>
                  </div>
                ))}
              </div>
              <Link
                to="/register"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal px-4 py-2 text-xs font-medium text-canvas transition-colors hover:bg-teal-light"
              >
                Register as a worker <ArrowRight size={14} />
              </Link>
            </div>
            <div className="lg:border-l lg:border-canvas/10 lg:pl-10">
              <span className="mb-4 inline-block rounded-full bg-gold px-3 py-1 text-[10px] font-medium text-canvas">
                For businesses
              </span>
              <div className="grid gap-2 sm:grid-cols-2">
                {BUSINESS_STEPS.map((step) => (
                  <div
                    key={step.n}
                    className="rounded-lg bg-canvas/[0.03] p-3 ring-1 ring-canvas/10"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-serif text-base italic text-gold/70">{step.n}</span>
                      <h3 className="text-xs font-medium leading-tight text-gold">{step.title}</h3>
                    </div>
                    <p className="text-[11px] leading-relaxed text-canvas/60">{step.body}</p>
                  </div>
                ))}
              </div>
              <Link
                to="/register"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-xs font-medium text-canvas transition-colors hover:bg-gold-dark"
              >
                Register as a business <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRIVACY ── */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="rounded-2xl bg-gold/5 p-8 ring-1 ring-gold/10 lg:p-12">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <Lock size={20} className="text-gold" />
                  <h2 className="font-serif text-3xl leading-tight text-ink">{c("home.privacy_title")}</h2>
                </div>
                <p className="max-w-[56ch] text-pretty leading-relaxed text-ink/70">
                  {c("home.privacy_body")}
                </p>
              </div>
              <div className="space-y-3">
                {PRIVACY_ITEMS.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 ring-1 ring-ink/5">
                    <CheckCircle size={16} className="flex-shrink-0 text-teal" />
                    <span className="text-sm text-ink/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SHIFTS PREVIEW ── */}
      <section className="pb-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-gold">Latest shifts</span>
              <h2 className="mt-2 font-serif text-3xl leading-tight text-ink sm:text-4xl">
                {c("home.shifts_title")}
              </h2>
              <p className="mt-2 text-ink/60">{c("home.shifts_subtitle")}</p>
            </div>
            <Link
              to="/jobs"
              className="hidden border-b border-teal/20 pb-1 text-sm font-medium text-teal sm:inline-flex"
            >
              View all jobs
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_JOBS.slice(0, 3).map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                matchScore={[94, 82, 67][i]}
                applied={applied.has(job.id)}
                onApply={(id) => setApplied((p) => new Set([...p, id]))}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── TALENT PREVIEW ── */}
      <section className="pb-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-gold">Available workers</span>
              <h2 className="mt-2 font-serif text-3xl leading-tight text-ink sm:text-4xl">
                {c("home.talent_title")}
              </h2>
              <p className="mt-2 text-ink/60">{c("home.talent_subtitle")}</p>
            </div>
            <Link
              to="/talent"
              className="hidden border-b border-teal/20 pb-1 text-sm font-medium text-teal sm:inline-flex"
            >
              Browse all talent
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {MOCK_WORKERS.slice(0, 3).map((w) => (
              <WorkerCard key={w.id} worker={w} />
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
