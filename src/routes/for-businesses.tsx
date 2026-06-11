import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle, ArrowRight, Shield, Clock, MessageCircle, Star, Zap } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import { useSiteContent } from "@/components/site/SiteContentProvider";
import { HowItWorks, PricingTeaser, type JourneyStep } from "@/components/site/JourneySections";
import stepSignup from "@/assets/step-signup.jpg";
import stepProfile from "@/assets/step-profile.jpg";
import stepPostjob from "@/assets/step-postjob.jpg";
import stepApplications from "@/assets/step-applications.jpg";
import stepAccept from "@/assets/step-accept.jpg";
import stepRating from "@/assets/step-rating.jpg";

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

const STEPS: JourneyStep[] = [
  {
    n: "01",
    title: "Sign up & fill the form",
    image: stepSignup,
    points: [
      "Create a business account in under a minute.",
      "Add your company name and contact details.",
      "Verify your email to activate your account.",
      "No subscription required to get started.",
    ],
  },
  {
    n: "02",
    title: "Build your company profile",
    image: stepProfile,
    points: [
      "Add your venue details and location.",
      "Upload your logo so workers recognise you.",
      "Describe what makes your team a great place to work.",
    ],
  },
  {
    n: "03",
    title: "Post jobs & reach out to talent",
    image: stepPostjob,
    points: [
      "Create a shift with role, date, hours, and pay in minutes.",
      "Tick the exact skills you need for the role.",
      "Or browse verified workers and invite them directly.",
      "Your post goes live to matched workers instantly.",
    ],
  },
  {
    n: "04",
    title: "Check applications",
    image: stepApplications,
    points: [
      "See applicants ranked by skill-match percentage.",
      "Review experience, ratings, and distance at a glance.",
      "Filter for verified workers or Atividade status.",
    ],
  },
  {
    n: "05",
    title: "Contact & accept the perfect one",
    image: stepAccept,
    points: [
      "Open a private chat with your shortlisted workers.",
      "Accept the best fit with one click.",
      "The worker confirms within the 2-hour window.",
      "Exchange contacts and share your address securely.",
    ],
  },
  {
    n: "06",
    title: "Rate the worker",
    image: stepRating,
    points: [
      "Leave a rating after the shift is complete.",
      "Help the community recognise reliable workers.",
      "Build a roster of favourites for next time.",
    ],
  },
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

      {/* How it works */}
      <HowItWorks
        eyebrow="How it works"
        title={c("why.process_title")}
        subtitle="Six simple steps take you from posting a shift to rating the worker who nailed it."
        steps={STEPS}
      />


      {/* Features */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-12 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">Platform features</span>
            <h2 className="mt-2 font-serif text-4xl text-ink">
              {c("why.features_title")}
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
              {c("why.features_cta")} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing (obscured) */}
      <PricingTeaser />
    </SiteLayout>

  );
}
