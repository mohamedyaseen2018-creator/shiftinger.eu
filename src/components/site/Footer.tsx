import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useSiteContent } from "@/components/site/SiteContentProvider";
import { LogoMark } from "@/components/brand/Logo";

const WORKER_LINKS = [
  { label: "Browse shifts", to: "/jobs" },
  { label: "Register as worker", to: "/register" },
  { label: "For workers", to: "/for-workers" },
  { label: "Find talent", to: "/talent" },
];

const BUSINESS_LINKS = [
  { label: "Find talent", to: "/talent" },
  { label: "Register as business", to: "/register" },
  { label: "Why Shiftinger", to: "/for-businesses" },
];

export default function Footer() {
  const { c } = useSiteContent();
  return (
    <footer className="border-t border-ink/5 bg-ink text-canvas/80">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="flex items-center gap-2.5">
              <LogoMark size={32} />
              <span className="text-2xl font-medium tracking-tight">
                <span className="text-canvas">Shift</span>
                <span className="font-serif italic text-gold">inger</span>
              </span>
            </span>
            <p className="mt-3 text-sm leading-relaxed text-canvas/60">
              {c("footer.tagline")}
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-medium text-canvas">{c("footer.col_workers_title")}</h4>
            <ul className="space-y-2.5">
              {WORKER_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-canvas/60 transition-colors hover:text-gold">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-medium text-canvas">{c("footer.col_business_title")}</h4>
            <ul className="space-y-2.5">
              {BUSINESS_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-canvas/60 transition-colors hover:text-gold">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-medium text-canvas">{c("footer.contact_title")}</h4>
            <a
              href="https://wa.me/351938847723"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              <MessageCircle size={16} />
              {c("footer.contact_cta")}
            </a>
            <a
              href="https://chat.whatsapp.com/E8Ovtrle2bs7AqQ1F4LdNq?s=sh&p=i&mlu=4"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-canvas ring-1 ring-canvas/20 transition-colors hover:bg-canvas/5"
            >
              <MessageCircle size={16} />
              Join our Community
            </a>
            <p className="mt-3 text-xs leading-relaxed text-canvas/50">{c("footer.contact_hours")}</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-canvas/10 pt-8 sm:flex-row">
          <p className="text-xs text-canvas/40">{c("footer.copyright")}</p>
          <div className="flex items-center gap-6">
            <Link to="/trust" className="text-xs text-canvas/40 transition-colors hover:text-canvas/70">
              Trust &amp; privacy
            </Link>
            {["Terms of service", "Cookies"].map((item) => (
              <span key={item} className="cursor-pointer text-xs text-canvas/40 transition-colors hover:text-canvas/70">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
