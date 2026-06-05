import {
  UserPlus,
  CheckCircle2,
  Clock,
  Flag,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { ACTIVITY, type ActivityKind } from "@/data/adminMock";
import { timeAgo } from "@/data/utils";

const ICONS: Record<ActivityKind, { icon: LucideIcon; bg: string; fg: string }> = {
  worker_registered: { icon: UserPlus, bg: "bg-pine-soft", fg: "text-pine-dark" },
  shift_confirmed: { icon: CheckCircle2, bg: "bg-pine-soft", fg: "text-pine-dark" },
  application_pending: { icon: Clock, bg: "bg-amber-soft", fg: "text-amber-dark" },
  business_flagged: { icon: Flag, bg: "bg-red-50", fg: "text-red-600" },
  dispute_raised: { icon: ShieldAlert, bg: "bg-red-50", fg: "text-red-600" },
};

export function ActivityFeed() {
  return (
    <ul className="space-y-3">
      {ACTIVITY.map((a) => {
        const { icon: Icon, bg, fg } = ICONS[a.kind];
        return (
          <li key={a.id} className="flex items-start gap-3">
            <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${bg} ${fg}`}>
              <Icon size={15} />
            </span>
            <div className="min-w-0">
              <p className="text-sm leading-snug text-ink">{a.label}</p>
              <p className="text-xs text-slate">{timeAgo(a.ts)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
