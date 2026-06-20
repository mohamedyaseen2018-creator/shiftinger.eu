import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Lock, Database, Users, Cookie, Trash2, FileSearch, MessageCircle } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Trust & Privacy — Shiftinger" },
      {
        name: "description",
        content:
          "How Shiftinger handles security, privacy, and your data — access controls, data use, retention, and how to reach us about a security or privacy concern.",
      },
      { property: "og:title", content: "Trust & Privacy — Shiftinger" },
      {
        property: "og:description",
        content: "How Shiftinger handles security, privacy, and your data across our platform in Portugal.",
      },
      { property: "og:url", content: "https://shiftinger.eu/trust" },
    ],
    links: [{ rel: "canonical", href: "https://shiftinger.eu/trust" }],
  }),
  component: TrustPage,
});

const SECTIONS = [
  {
    icon: Lock,
    title: "Access & authentication",
    body: "Accounts are protected with email-and-password sign-in. Each account only sees the data tied to it — workers, businesses, and administrators have separate, role-based access. Administrative tooling sits behind an additional verification step.",
  },
  {
    icon: ShieldCheck,
    title: "Platform & hosting",
    body: "Shiftinger runs on the Lovable Cloud platform, which provides managed database, authentication, and serverless functions. These are platform capabilities we rely on; this page is not an independent certification of them.",
  },
  {
    icon: Database,
    title: "Data we collect & how we use it",
    body: "We collect the information you provide to operate the marketplace — profile details, role and availability, applications, and messages between matched parties. We use it to match workers with shifts and to keep accounts secure. We do not sell your personal data.",
  },
  {
    icon: Users,
    title: "Who can see your information",
    body: "Profile contact details are revealed only after a mutual match, and the exact venue address is shared securely at that point. Internal administrative notes are never visible to other users.",
  },
  {
    icon: Cookie,
    title: "Cookies & analytics",
    body: "We use essential cookies to keep you signed in and to operate core features. Any analytics we run is used to understand and improve how the product is used, not to identify you individually.",
  },
  {
    icon: Trash2,
    title: "Retention & deletion",
    body: "We keep your data while your account is active and for as long as needed to provide the service. You can request deletion of your account and associated personal data by contacting us.",
  },
  {
    icon: FileSearch,
    title: "Privacy requests",
    body: "You can ask us to access, correct, or delete the personal data we hold about you. Reach out through the contact channel below and we'll help.",
  },
];

function TrustPage() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="bg-ink px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">Trust &amp; privacy</span>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-canvas sm:text-5xl">
            How we handle security, privacy, and your data
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-canvas/70">
            This page is maintained by the Shiftinger team to answer common security and privacy questions about
            Shiftinger. It describes the controls and practices in place today and is editable project content — not an
            independent or third-party certification.
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="bg-canvas py-20">
        <div className="mx-auto max-w-4xl px-6 lg:px-12">
          <div className="grid gap-6 sm:grid-cols-2">
            {SECTIONS.map((s) => (
              <div key={s.title} className="rounded-xl bg-white p-6 ring-1 ring-ink/5">
                <s.icon size={24} className="mb-3 text-teal" />
                <h2 className="mb-2 font-medium text-ink">{s.title}</h2>
                <p className="text-sm leading-relaxed text-ink/60">{s.body}</p>
              </div>
            ))}
          </div>

          {/* Shared responsibility */}
          <div className="mt-10 rounded-xl bg-ink/5 p-6 ring-1 ring-ink/10">
            <h2 className="mb-2 font-medium text-ink">Shared responsibility</h2>
            <p className="text-sm leading-relaxed text-ink/60">
              Security is a shared effort. The Lovable Cloud platform provides the underlying infrastructure controls;
              the Shiftinger team is responsible for how the application is configured and how your data is handled; and
              you help by keeping your login credentials private and reporting anything that looks wrong.
            </p>
          </div>

          {/* Contact / vulnerability reporting */}
          <div className="mt-10 rounded-xl bg-white p-6 ring-1 ring-ink/5">
            <div className="flex items-start gap-3">
              <MessageCircle size={22} className="mt-0.5 shrink-0 text-teal" />
              <div>
                <h2 className="mb-2 font-medium text-ink">Report a security or privacy concern</h2>
                <p className="text-sm leading-relaxed text-ink/60">
                  Found something that doesn't look right, or have a question about your data? Message our team and we'll
                  respond as quickly as we can.
                </p>
                <a
                  href="https://wa.me/351938847723"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-medium text-canvas transition-colors hover:bg-teal-light"
                >
                  Contact us <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-ink/40">
            This page describes current practices and may be updated as the product evolves.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
