import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Store, ArrowRight, ShieldCheck } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Join Shiftinger" },
      { name: "description", content: "Create your free Shiftinger account as a worker or a business. First 500 workers and first 100 businesses join free." },
    ],
  }),
  component: RegisterPage,
});

const ROLES = [
  {
    key: "worker" as const,
    icon: Briefcase,
    title: "I'm looking for work",
    body: "Build a verified profile, post your availability, and apply to shifts that match your skills.",
    perk: "First 500 workers join free",
    accent: "teal" as const,
  },
  {
    key: "business" as const,
    icon: Store,
    title: "I'm hiring staff",
    body: "Post shifts, see skill-matched candidates, and confirm reliable workers within hours.",
    perk: "First 100 businesses join free",
    accent: "gold" as const,
  },
];

function RegisterPage() {
  return (
    <SiteLayout>
      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">Join Shiftinger</span>
          <h1 className="mt-3 font-serif text-4xl text-ink lg:text-5xl">How will you use Shiftinger?</h1>
          <p className="mx-auto mt-4 max-w-xl text-ink/60">
            Choose how you'd like to get started. One email can register as a worker or a business — not both.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
          {ROLES.map((r) => (
            <div
              key={r.key}
              className="flex flex-col rounded-2xl bg-white p-8 ring-1 ring-ink/5 transition-shadow hover:shadow-md"
            >
              <div
                className={`flex size-12 items-center justify-center rounded-xl ${
                  r.accent === "teal" ? "bg-teal/10 text-teal" : "bg-gold/10 text-gold-dark"
                }`}
              >
                <r.icon size={22} />
              </div>
              <h2 className="mt-5 font-serif text-2xl text-ink">{r.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/60">{r.body}</p>
              <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-teal">
                <ShieldCheck size={14} /> {r.perk}
              </p>
              <Link
                to="/auth"
                search={{ mode: "signup", role: r.key }}
                className={`mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium text-canvas transition-colors ${
                  r.accent === "teal" ? "bg-teal hover:bg-teal-light" : "bg-gold hover:bg-gold-dark"
                }`}
              >
                Continue <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-ink/50">
          Already have an account?{" "}
          <Link to="/auth" search={{ mode: "signin", role: "worker" }} className="font-medium text-teal hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </SiteLayout>
  );
}
