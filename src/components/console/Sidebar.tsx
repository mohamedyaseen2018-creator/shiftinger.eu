import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarClock,
  GitMerge,
  ShieldAlert,
  Settings,
  FileCheck2,
  PencilRuler,
  Home,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import Logo from "@/components/brand/Logo";

const NAV = [
  { to: "/console", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/console/workers", label: "Workers", icon: Users },
  { to: "/console/businesses", label: "Businesses", icon: Building2 },
  { to: "/console/documents", label: "Documents", icon: FileCheck2 },
  { to: "/console/shifts", label: "Shifts", icon: CalendarClock },
  { to: "/console/matches", label: "Matches", icon: GitMerge },
  { to: "/console/disputes", label: "Disputes", icon: ShieldAlert },
  { to: "/console/content", label: "Site content", icon: PencilRuler },
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
      <Link
        to="/"
        onClick={onNavigate}
        title="Back to website"
        className="flex items-center px-5 py-5 transition-colors hover:bg-white/5"
      >
        <Logo variant="full" theme="dark" size={36} />
      </Link>


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

        <Link
          to="/"
          onClick={onNavigate}
          className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Home size={18} />
          Back to website
        </Link>
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
