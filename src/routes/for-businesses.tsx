import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle, ArrowRight, Shield, Clock, MessageCircle, Star, Zap } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import { useSiteContent } from "@/components/site/SiteContentProvider";

export const Route = createFileRoute("/for-businesses")({
  head: () => ({
    meta: [
      { title: "For businesses — Shiftinger" },
      { name: "description", content: "Post a shift tonight and have a verified, skill-matched worker confirmed by morning. No agencies, no placement fees." },
      { property: "og:title", content: "For businesses — Shiftinger" },
      { property: "og:description", content: "Post a shift tonight. Have someone confirmed by morning." },
    ],
  }),
  component: ForBusinessesPage,
});

const STEPS = [
  { n: "01", title: "Post your shift", body: "Select the role, date, hours, and pay. Tick the skills you need. Done in under 3 minutes." },
  { n: "02", title: "See matched candidates", body: "Applicants ranked by skill match %. Skills, experience, rating, and distance — all at a glance." },
  { n: "03", title: "Accept with one click", body: "Accept, waitlist, or decline. The worker gets a notification instantly. Chat opens automatically." },
  { n: "04", title: "Worker confirms", body: "They have 2 hours to confirm. Once confirmed, you both exchange contacts and your address is shared." },
];

const FEATURE_CARDS = [
  { icon: Zap, title: "Skill-based matching", body: "Every applicant is scored against the exact skills you ticked. You see a match percentage — not a pile of CVs." },
  { icon: CheckCircle, title: "Pre-verified workers", body: "All workers upload a passport or ID before their account is verified. You see a clear Verified badge." },
  { icon: Star, title: "Atividade declared upfront", body: "Every worker declares their Atividade status when registering. You can require it or filter for it." },
  { icon: Clock, title: "2-hour confirmation window", body: "Once you accept a worker, they have 2 hours to confirm. If they don't respond, the spot reopens automatically." },
  { icon: MessageCircle, title: "Direct chat, no cold contact", body: "A private chat opens only after mutual acceptance. No unsolicited messages from applicants." },
  { icon: Shield, title: "WhatsApp support line", body: "If a confirmed worker doesn't show up, message our team on WhatsApp. We'll contact them on your behalf." },
];

const STATS = [
  { v: "340+", l: "Shifts posted" },
  { v: "1,200+", l: "Registered workers" },
  { v: "95%", l: "Fill rate" },
  { v: "<2h", l: "Avg confirmation time" },
];

function ForBusinessesPage() {
  const { c } = useSiteContent();
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="bg-ink px-6 py-20 lg:px-12">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">{c("why.hero_eyebrow")}</span>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-canvas sm:text-5xl">
              {c("why.hero_title")}
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-canvas/70">
              {c("why.hero_subtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-canvas transition-colors hover:bg-gold-dark"
              >
                {c("why.hero_cta_primary")} <ArrowRight size={16} />
              </Link>
              <Link
                to="/talent"
                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-canvas ring-1 ring-canvas/20 transition-colors hover:bg-canvas/5"
              >
                {c("why.hero_cta_secondary")}
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {STATS.map((s) => (
              <div key={s.l} className="rounded-xl bg-canvas/5 p-6 ring-1 ring-canvas/10">
                <p className="font-serif text-3xl text-gold">{s.v}</p>
                <p className="mt-1 text-sm text-canvas/60">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-14 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">How it works</span>
            <h2 className="mt-2 font-serif text-4xl text-ink">
              {c("why.process_title")}
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.n} className="rounded-xl bg-white p-6 ring-1 ring-ink/5">
                <span className="font-serif text-4xl text-ink/15">{step.n}</span>
                <h3 className="mb-2 mt-3 font-medium text-ink">{step.title}</h3>
                <p className="text-sm leading-relaxed text-ink/60">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-12 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">Platform features</span>
            <h2 className="mt-2 font-serif text-4xl text-ink">
              Everything you need to <span className="italic">hire faster</span>
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_CARDS.map((card) => (
              <div key={card.title} className="rounded-xl bg-white p-6 ring-1 ring-ink/5">
                <card.icon size={24} className="mb-3 text-teal" />
                <h3 className="mb-2 font-medium text-ink">{card.title}</h3>
                <p className="text-sm leading-relaxed text-ink/60">{card.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-medium text-canvas transition-colors hover:bg-teal-light"
            >
              Get started — it's free <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
