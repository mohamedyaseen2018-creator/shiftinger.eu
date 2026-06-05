import { useState } from "react";
import {
  LayoutDashboard,
  Clock,
  Users,
  Building2,
  Target,
  ShieldAlert,
} from "lucide-react";
import { useAdminStore, emptyBusiness, type Business } from "@/data/adminStore";
import { PlatformConfigModal } from "@/components/console/PlatformConfigModal";
import { ConfirmationWindowModal } from "@/components/console/ConfirmationWindowModal";
import { ManageWorkersDrawer } from "@/components/console/ManageWorkersDrawer";
import { BusinessModal } from "@/components/console/BusinessModal";
import { KpiSettingsModal } from "@/components/console/KpiSettingsModal";
import { ManageDisputesDrawer } from "@/components/console/ManageDisputesDrawer";

function ActionButton({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: typeof Users;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 rounded-xl border border-line px-4 py-3 text-left transition-colors hover:border-pine hover:bg-mist"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-pine-soft text-pine-dark">
        <Icon size={17} />
      </span>
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-[11px] text-slate">{description}</span>
      </span>
    </button>
  );
}

export function QuickControls() {
  const store = useAdminStore();
  const [platformOpen, setPlatformOpen] = useState(false);
  const [windowOpen, setWindowOpen] = useState(false);
  const [workersOpen, setWorkersOpen] = useState(false);
  const [newBusiness, setNewBusiness] = useState<Business | null>(null);
  const [kpiOpen, setKpiOpen] = useState(false);
  const [disputesOpen, setDisputesOpen] = useState(false);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <ActionButton icon={LayoutDashboard} label="Full dashboard prompt" description="Review and edit platform configuration" onClick={() => setPlatformOpen(true)} />
        <ActionButton icon={Clock} label="Confirmation window" description="Edit daily confirmation window and rules" onClick={() => setWindowOpen(true)} />
        <ActionButton icon={Users} label="Manage workers" description="Add, edit, suspend or remove workers" onClick={() => setWorkersOpen(true)} />
        <ActionButton icon={Building2} label="Add business" description="Register a new business profile" onClick={() => setNewBusiness(emptyBusiness(store.newId()))} />
        <ActionButton icon={Target} label="KPI settings" description="Configure KPI targets and tracking" onClick={() => setKpiOpen(true)} />
        <ActionButton icon={ShieldAlert} label="Disputes" description="Review disputes and manage issue types" onClick={() => setDisputesOpen(true)} />
      </div>

      <PlatformConfigModal open={platformOpen} onClose={() => setPlatformOpen(false)} />
      <ConfirmationWindowModal open={windowOpen} onClose={() => setWindowOpen(false)} />
      <ManageWorkersDrawer open={workersOpen} onClose={() => setWorkersOpen(false)} />
      <BusinessModal business={newBusiness} open={!!newBusiness} onClose={() => setNewBusiness(null)} />
      <KpiSettingsModal open={kpiOpen} onClose={() => setKpiOpen(false)} />
      <ManageDisputesDrawer open={disputesOpen} onClose={() => setDisputesOpen(false)} />
    </>
  );
}
