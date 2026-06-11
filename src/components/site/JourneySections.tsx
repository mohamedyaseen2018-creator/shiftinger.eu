import { Lock } from "lucide-react";

export interface JourneyStep {
  n: string;
  title: string;
  image: string;
  points: string[];
}

export function HowItWorks({
  eyebrow,
  title,
  subtitle,
  steps,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  steps: JourneyStep[];
}) {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-16 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">{eyebrow}</span>
          <h2 className="mt-2 font-serif text-4xl text-ink">{title}</h2>
          {subtitle && <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink/60">{subtitle}</p>}
        </div>

        <div className="space-y-20">
          {steps.map((step, i) => {
            const reversed = i % 2 === 1;
            return (
              <div
                key={step.n}
                className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
              >
                {/* Image */}
                <div className={reversed ? "lg:order-2" : ""}>
                  <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-ink/5">
                    <img
                      src={step.image}
                      alt={step.title}
                      loading="lazy"
                      width={1280}
                      height={896}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                {/* Text */}
                <div className={reversed ? "lg:order-1" : ""}>
                  <span className="font-serif text-5xl text-ink/15">{step.n}</span>
                  <h3 className="mt-3 font-serif text-2xl text-ink">{step.title}</h3>
                  <ul className="mt-5 space-y-3">
                    {step.points.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-ink/70">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const PRICING_PLANS = [
  {
    name: "Starter",
    tagline: "For getting your first shifts",
    price: "€0",
    features: ["Create a profile", "Browse & apply", "Basic visibility"],
  },
  {
    name: "Pro",
    tagline: "For active workers & busy venues",
    price: "€XX",
    features: ["Priority matching", "Unlimited applications", "Verified badge"],
  },
  {
    name: "Featured",
    tagline: "Stand out at the top",
    price: "€XX",
    features: ["Featured listing", "Top of search", "Highlighted profile"],
  },
];

export function PricingTeaser() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-12 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">Pricing</span>
          <h2 className="mt-2 font-serif text-4xl text-ink">Simple plans for everyone</h2>
        </div>

        <div className="relative">
          {/* Blurred plans */}
          <div className="grid select-none gap-6 blur-md sm:grid-cols-3" aria-hidden="true">
            {PRICING_PLANS.map((plan) => (
              <div key={plan.name} className="rounded-2xl bg-white p-8 ring-1 ring-ink/5">
                <h3 className="font-serif text-2xl text-ink">{plan.name}</h3>
                <p className="mt-1 text-sm text-ink/50">{plan.tagline}</p>
                <p className="mt-6 font-serif text-4xl text-ink">
                  {plan.price}
                  <span className="text-base font-sans text-ink/40"> /mo</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-ink/60">
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 rounded-full bg-teal py-3 text-center text-sm font-medium text-canvas">
                  Choose {plan.name}
                </div>
              </div>
            ))}
          </div>

          {/* Coming soon overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-ink/90 px-10 py-8 text-center shadow-xl">
              <Lock size={24} className="text-gold" />
              <p className="font-serif text-2xl text-canvas">Pricing — coming soon</p>
              <p className="max-w-xs text-sm text-canvas/60">
                We're finalising our plans. For now, everything is free while we build the community.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
