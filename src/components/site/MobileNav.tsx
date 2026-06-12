import { Link } from "@tanstack/react-router";
import { Home, Briefcase, Users, User, Plus, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface Tab {
  to: string;
  label: string;
  icon: typeof Home;
  search?: Record<string, string>;
  primary?: boolean;
}

/**
 * Fixed bottom tab bar shown on mobile only. Tabs adapt to the signed-in
 * account type. Every target meets the 44px touch-target minimum.
 */
export default function MobileNav() {
  const { user, profile } = useAuth();
  const isBusiness = profile?.account_type === "business";

  let tabs: Tab[];
  if (!user) {
    tabs = [
      { to: "/", label: "Home", icon: Home },
      { to: "/jobs", label: "Shifts", icon: Briefcase },
      { to: "/talent", label: "Talent", icon: Users },
      { to: "/auth", label: "Sign in", icon: LogIn, search: { mode: "signin", role: "worker" } },
    ];
  } else if (isBusiness) {
    tabs = [
      { to: "/dashboard", label: "Home", icon: Home },
      { to: "/my-jobs", label: "Shifts", icon: Briefcase },
      { to: "/post-job", label: "Post", icon: Plus, primary: true },
      { to: "/talent", label: "Talent", icon: Users },
      { to: "/profile", label: "Profile", icon: User },
    ];
  } else {
    tabs = [
      { to: "/dashboard", label: "Home", icon: Home },
      { to: "/jobs", label: "Find work", icon: Briefcase },
      { to: "/applications", label: "Applied", icon: Users },
      { to: "/profile", label: "Profile", icon: User },
    ];
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-canvas/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map((tab) => (
          <li key={tab.to} className="flex-1">
            <Link
              to={tab.to as never}
              search={tab.search as never}
              activeOptions={{ exact: tab.to === "/" || tab.to === "/dashboard" }}
              className={cn(
                "flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium text-ink/55 transition-colors",
              )}
              activeProps={{ className: "text-teal" }}
            >
              {tab.primary ? (
                <span className="flex size-9 items-center justify-center rounded-full bg-teal text-canvas">
                  <tab.icon size={20} />
                </span>
              ) : (
                <tab.icon size={20} />
              )}
              <span className="leading-none">{tab.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
