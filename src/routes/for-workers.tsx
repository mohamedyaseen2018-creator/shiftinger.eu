import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle, ArrowRight, Shield, Clock, MessageCircle, Star, Zap } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import { HowItWorks, PricingTeaser, type JourneyStep } from "@/components/site/JourneySections";
import stepSignup from "@/assets/step-signup.jpg";
import stepProfile from "@/assets/step-profile.jpg";
import stepJobs from "@/assets/step-jobs.jpg";
import stepApplications from "@/assets/step-applications.jpg";
import stepAccept from "@/assets/step-accept.jpg";
import stepRating from "@/assets/step-rating.jpg";

export const Route = createFileRoute("/for-workers")({
  head: () => ({
    meta: [
      { title: "For workers — Shiftinger" },
      { name: "description", content: "Build a verified profile, apply to shifts in one tap, post your availability, and get matched with the right venues across Portugal." },
      { property: "og:title", content: "For workers — Shiftinger" },
      { property: "og:description", content: "Apply to shifts in one tap and get matched with the right venues." },
      { property: "og:url", content: "https://shiftinger.eu/for-workers" },
    ],
    links: [{ rel: "canonical", href: "https://shiftinger.eu/for-workers" }],
  }),
  component: ForWorkersPage,
});

const STEPS: JourneyStep[] = [
  {
    n: "01",
    title: "Sign up & fill the form",
    image: stepSignup,
    points: [
      "Create a worker account in under a minute.",
      "Add your name, city, and contact details.",
      "Verify your email to activate your account.",
      "No fees to join — registration is free.",
    ],
  },
  {
    n: "02",
    title: "Build your profile",
    image: stepProfile,
    points: [
      "Add your main role, skills, and years of experience.",
      "List the languages you speak and your level.",
      "Upload your ID to earn a Verified badge.",
      "Set your hourly rate so businesses know your terms.",
    ],
  },
  {
    n: "03",
    title: "Apply for jobs & post availability",
    image: stepJobs,
    points: [
      "Browse open shifts filtered by role, city, and pay.",
      "Apply to any shift with a single tap.",
      "Publish your availability so venues can reach out to you.",
      "Get matched to shifts that fit your skills.",
    ],
  },
  {
    n: "04",
    title: "Get noticed & check applications",
    image: stepApplications,
    points: [
      "Track the status of every application in one place.",
      "See which businesses viewed your profile.",
      "Receive notifications the moment something changes.",
    ],
  },
  {
    n: "05",
    title: "Get contacted & accepted",
    image: stepAccept,
    points: [
      "A private chat opens once there's a mutual match.",
      "Confirm the shift within the 2-hour window.",
      "Exchange contacts and the venue address securely.",
    ],
  },
  {
    n: "06",
    title: "Complete & get rated",
    image: stepRating,
    points: [
      "Show up and work the shift.",
      "Receive a rating from the business afterwards.",
      "Build your reputation to unlock better shifts.",
    ],
  },
];

const FEATURE_CARDS = [
  { icon: Zap, title: "One-tap applications", body: "No long cover letters. Tap apply and your skill-matched profile is sent instantly." },
  { icon: CheckCircle, title: "Verified profile", body: "Upload your ID once and wear a Verified badge that helps you stand out to venues." },
  { icon: Star, title: "You set your rate", body: "Declare your minimum hourly rate so you only get matched to shifts worth your time." },
  { icon: Clock, title: "Fast confirmations", body: "Accept and confirm within hours — no waiting days to hear back from an agency." },
  { icon: MessageCircle, title: "Direct chat", body: "Talk to the venue directly once you're matched. No middlemen, no placement fees." },
  { icon: Shield, title: "WhatsApp support", body: "Something off about a shift? Our team is one WhatsApp message away." },
];

const STATS = [
  { v: "340+", l: "Shifts available" },
  { v: "120+", l: "Venues hiring" },
  { v: "€12+", l: "Avg hourly pay" },
  { v: "<2h", l: "Avg confirmation time" },
];

function ForWorkersPage() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="bg-ink px-6 py-20 lg:px-12">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">For workers</span>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-canvas sm:text-5xl">
              Find shifts that fit your skills — and your schedule.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-canvas/70">
              Build a verified profile, apply to shifts in one tap, post your availability, and get matched with the right venues across Portugal. No agencies, no placement fees.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-canvas transition-colors hover:bg-gold-dark"
              >
                Create your profile <ArrowRight size={16} />
              </Link>
              <Link
                to="/jobs"
                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-canvas ring-1 ring-canvas/20 transition-colors hover:bg-canvas/5"
              >
                Browse shifts
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
        title="From sign-up to your first rating"
        subtitle="Six simple steps take you from creating an account to building a reputation that lands you better shifts."
        steps={STEPS}
        ctas={[
          { label: "Get started", to: "/register", variant: "primary" },
          { label: "Sign up as a worker", to: "/auth", search: { mode: "signup", role: "worker" }, variant: "secondary" },
        ]}
      />

      {/* Features */}
      <section className="bg-canvas pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-12 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">Why workers choose us</span>
            <h2 className="mt-2 font-serif text-4xl text-ink">Built around you</h2>
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
              Get started free <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing (obscured) */}
      <PricingTeaser />
    </SiteLayout>
  );
}
