import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarClock,
  GitMerge,
  ShieldAlert,
  Settings,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/console", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/console/workers", label: "Workers", icon: Users },
  { to: "/console/businesses", label: "Businesses", icon: Building2 },
  { to: "/console/shifts", label: "Shifts", icon: CalendarClock },
  { to: "/console/matches", label: "Matches", icon: GitMerge },
  { to: "/console/disputes", label: "Disputes", icon: ShieldAlert },
  { to: "/console/settings", label: "Settings", icon: Settings },
] as const;

function initials(value: string): string {
  return value
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, user } = useAuth();
  const displayName = profile?.full_name || profile?.email || user?.email || "Admin";
  const email = profile?.email || user?.email || "";

  return (
    <div className="flex h-full flex-col bg-pine-dark text-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber text-pine-dark">
          <Zap size={18} />
        </div>
        <div>
          <p className="font-sans text-sm font-bold leading-tight">Shiftinger</p>
          <p className="text-[11px] leading-tight text-white/60">Admin console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            activeOptions={{ exact: (item as { exact?: boolean }).exact ?? false }}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white",
            )}
            activeProps={{ className: "bg-white/15 text-white" }}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-amber text-xs font-bold text-pine-dark">
            {initials(displayName) || "AD"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-[11px] text-white/60">Super admin · {email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
