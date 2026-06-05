import { useState } from "react";
import {
  SlidersHorizontal,
  Clock,
  Users,
  Building2,
  Target,
  ShieldAlert,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminStore } from "@/data/adminStore";
import { Pill } from "@/components/console/ui";
import { PlatformConfigModal } from "@/components/console/PlatformConfigModal";
import { ConfirmationWindowModal } from "@/components/console/ConfirmationWindowModal";
import { ManageWorkersDrawer } from "@/components/console/ManageWorkersDrawer";
import { AddBusinessModal } from "@/components/console/AddBusinessModal";
import { KpiSettingsModal } from "@/components/console/KpiSettingsModal";
import { ManageDisputesDrawer } from "@/components/console/ManageDisputesDrawer";

type Panel = "config" | "window" | "workers" | "business" | "kpi" | "disputes" | null;

const ACTIONS: { key: Panel; label: string; icon: typeof Users; hint: string }[] = [
  { key: "config", label: "Platform configuration", icon: SlidersHorizontal, hint: "Name, cities, sectors, currency" },
  { key: "window", label: "Confirmation window", icon: Clock, hint: "Daily match confirmation hours" },
  { key: "workers", label: "Manage workers", icon: Users, hint: "Add, edit, suspend, delete" },
  { key: "business", label: "Add business", icon: Building2, hint: "Register a new business" },
  { key: "kpi", label: "KPI settings", icon: Target, hint: "Targets and tracking" },
  { key: "disputes", label: "Disputes", icon: ShieldAlert, hint: "Review and resolve" },
];

export function QuickControls() {
  const store = useAdminStore();
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const pending = [
    ...store.workers
      .filter((w) => w.status === "pending_review")
      .map((w) => ({ id: w.id, name: w.name, type: "worker" as const })),
    ...store.businesses
      .filter((b) => b.status === "pending_review")
      .map((b) => ({ id: b.id, name: b.name, type: "business" as const })),
  ];

  const act = async (
    id: string,
    type: "worker" | "business",
    name: string,
    status: "approved" | "rejected",
  ) => {
    setBusy(id + status);
    try {
      await store.setStatus(id, status, type, name);
      toast.success(status === "approved" ? "Approved" : "Rejected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => setPanel(a.key)}
            className="flex items-start gap-3 rounded-xl border border-line bg-white px-3 py-3 text-left transition-colors hover:border-pine"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-pine-soft text-pine-dark">
              <a.icon size={17} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink">{a.label}</span>
              <span className="block text-[11px] text-slate">{a.hint}</span>
            </span>
          </button>
        ))}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Pending approvals</h3>
          <Pill tone={pending.length ? "amber" : "pine"}>{pending.length} waiting</Pill>
        </div>
        {pending.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line py-6 text-center text-sm text-slate">
            Nothing waiting for review.
          </p>
        ) : (
          <ul className="space-y-2">
            {pending.slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{p.type === "business" ? store.businessLabel(p.name) : p.name}</p>
                  <p className="text-[11px] capitalize text-slate">{p.type}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => act(p.id, p.type, p.name, "approved")}
                    disabled={busy !== null}
                    className="inline-flex items-center gap-1 rounded-lg bg-pine-soft px-2 py-1 text-xs font-medium text-pine-dark hover:bg-pine hover:text-white disabled:opacity-50"
                  >
                    <Check size={13} /> Approve
                  </button>
                  <button
                    onClick={() => act(p.id, p.type, p.name, "rejected")}
                    disabled={busy !== null}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <X size={13} /> Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <PlatformConfigModal open={panel === "config"} onClose={() => setPanel(null)} />
      <ConfirmationWindowModal open={panel === "window"} onClose={() => setPanel(null)} />
      <ManageWorkersDrawer open={panel === "workers"} onClose={() => setPanel(null)} />
      <AddBusinessModal open={panel === "business"} onClose={() => setPanel(null)} />
      <KpiSettingsModal open={panel === "kpi"} onClose={() => setPanel(null)} />
      <ManageDisputesDrawer open={panel === "disputes"} onClose={() => setPanel(null)} />
    </div>
  );
}
