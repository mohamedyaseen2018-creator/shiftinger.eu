import { Activity, ShieldCheck, ShieldX, Trash2, UserCog, Ban } from "lucide-react";
import { useAdminStore, type AuditEntry } from "@/data/adminStore";
import { timeAgo } from "@/data/utils";

function describe(a: AuditEntry): { icon: typeof Activity; label: string; tone: string } {
  const action = a.action ?? "";
  const who = a.targetLabel ? ` · ${a.targetLabel}` : "";
  if (action.startsWith("status:approved"))
    return { icon: ShieldCheck, label: `Approved ${a.targetType ?? "account"}${who}`, tone: "text-pine-dark" };
  if (action.startsWith("status:rejected"))
    return { icon: ShieldX, label: `Rejected ${a.targetType ?? "account"}${who}`, tone: "text-red-600" };
  if (action.startsWith("status:blocked"))
    return { icon: Ban, label: `Blocked ${a.targetType ?? "account"}${who}`, tone: "text-red-600" };
  if (action.startsWith("status:"))
    return { icon: UserCog, label: `Status changed${who}`, tone: "text-amber-dark" };
  if (action === "role:grant_admin")
    return { icon: ShieldCheck, label: `Granted admin${who}`, tone: "text-pine-dark" };
  if (action === "role:revoke_admin")
    return { icon: ShieldX, label: `Revoked admin${who}`, tone: "text-red-600" };
  if (action === "delete")
    return { icon: Trash2, label: `Deleted ${a.targetType ?? "user"}${who}`, tone: "text-red-600" };
  if (action === "ban")
    return { icon: Ban, label: `Banned ${a.targetType ?? "user"}${who}`, tone: "text-red-600" };
  return { icon: Activity, label: `${action}${who}`, tone: "text-slate" };
}

export function ActivityFeed() {
  const { audit } = useAdminStore();

  if (audit.length === 0) {
    return <p className="py-8 text-center text-sm text-slate">No admin activity yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {audit.slice(0, 12).map((a) => {
        const d = describe(a);
        return (
          <li key={a.id} className="flex items-start gap-3">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mist">
              <d.icon size={14} className={d.tone} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">{d.label}</p>
              <p className="text-[11px] text-slate">
                {a.adminEmail ? `${a.adminEmail} · ` : ""}
                {timeAgo(a.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
