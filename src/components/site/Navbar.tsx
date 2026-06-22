import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSiteContent } from "@/components/site/SiteContentProvider";
import NotificationBell from "@/components/site/NotificationBell";

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`text-xl font-medium tracking-tight ${className}`}>
      <span className="text-teal">Shift</span>
      <span className="font-serif italic text-gold">inger</span>
    </span>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, profile } = useAuth();
  const { c } = useSiteContent();
  // Workers shouldn't see the business marketing page; it's for anonymous
  // visitors and business-role users only.
  const isWorker = profile?.account_type === "worker";
  const navLinks = [
    { label: c("header.nav_jobs"), to: "/jobs" as const },
    { label: c("header.nav_talent"), to: "/talent" as const },
    { label: "For workers", to: "/for-workers" as const },
    ...(!isWorker ? [{ label: c("header.nav_business"), to: "/for-businesses" as const }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-ink/5 bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-12">
        <Link to="/" className="flex-shrink-0">
          <Wordmark />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-ink/70 transition-colors hover:text-teal"
              activeProps={{ className: "text-teal" }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/console"
                  className="rounded-full px-4 py-2 text-sm font-medium text-ink ring-1 ring-ink/10 transition-colors hover:bg-ink/5"
                >
                  Admin
                </Link>
              )}
              {profile?.account_type === "business" && (
                <Link
                  to="/post-job"
                  className="rounded-full px-5 py-2 text-sm font-medium text-canvas transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#1D9E75" }}
                >
                  Post Shift
                </Link>
              )}
              <NotificationBell />
              <Link
                to="/dashboard"
                className="rounded-full bg-teal px-5 py-2 text-sm font-medium text-canvas transition-colors hover:bg-teal-light"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                search={{ mode: "signin", role: "worker" }}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink ring-1 ring-ink/10 transition-colors hover:bg-ink/5"
              >
                {c("header.cta_signin")}
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-teal px-5 py-2 text-sm font-medium text-canvas transition-colors hover:bg-teal-light"
              >
                {c("header.cta_register")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="p-2 text-ink md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="flex flex-col gap-4 border-t border-ink/5 bg-canvas px-6 py-5 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-ink/70 hover:text-teal"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 border-t border-ink/10 pt-4">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/console"
                    className="rounded-full px-4 py-2 text-center text-sm font-medium text-ink ring-1 ring-ink/10"
                    onClick={() => setOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                {profile?.account_type === "business" && (
                  <Link
                    to="/post-job"
                    className="rounded-full px-5 py-2 text-center text-sm font-medium text-canvas"
                    style={{ backgroundColor: "#1D9E75" }}
                    onClick={() => setOpen(false)}
                  >
                    Post Shift
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="rounded-full bg-teal px-5 py-2 text-center text-sm font-medium text-canvas"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  search={{ mode: "signin", role: "worker" }}
                  className="rounded-full px-4 py-2 text-center text-sm font-medium text-ink ring-1 ring-ink/10"
                  onClick={() => setOpen(false)}
                >
                  {c("header.cta_signin")}
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-teal px-5 py-2 text-center text-sm font-medium text-canvas"
                  onClick={() => setOpen(false)}
                >
                  {c("header.cta_register")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
