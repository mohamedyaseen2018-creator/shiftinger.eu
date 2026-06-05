import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Settings2, Plus } from "lucide-react";
import { PageHeader, Pill, Panel } from "@/components/console/ui";
import { DisputeDrawer } from "@/components/console/DisputeDrawer";
import { ManagedList } from "@/components/console/ManagedList";
import { useAdminStore, type Dispute, type DisputeWorkflowStatus } from "@/data/adminStore";
import { formatDate } from "@/data/utils";

export const Route = createFileRoute("/console/disputes")({
  head: () => ({ meta: [{ title: "Disputes — Shiftinger admin" }] }),
  component: DisputesPage,
});

const TONE: Record<DisputeWorkflowStatus, "amber" | "blue" | "pine" | "red" | "slate"> = {
  open: "amber",
  under_review: "blue",
  resolved: "pine",
  escalated: "red",
  closed: "slate",
};
const LABEL: Record<DisputeWorkflowStatus, string> = {
  open: "Open",
  under_review: "Under review",
  resolved: "Resolved",
  escalated: "Escalated",
  closed: "Closed",
};

function emptyDispute(id: string): Dispute {
  return {
    id: `DP-${id.slice(0, 4)}`,
    workerName: "",
    businessId: "",
    issueType: "Pay discrepancy",
    raised: new Date().toISOString().slice(0, 10),
    status: "open",
    assignedTo: "",
    deadline: "",
    internalNotes: "",
    resolutionSummary: "",
  };
}

function DisputesPage() {
  const store = useAdminStore();
  const [filter, setFilter] = useState<"all" | DisputeWorkflowStatus>("all");
  const [editing, setEditing] = useState<Dispute | null>(null);
  const [showIssueTypes, setShowIssueTypes] = useState(false);

  const rows = store.disputes.filter((d) => filter === "all" || d.status === filter);
  const openCount = store.disputes.filter((d) => d.status === "open").length;

  return (
    <div>
      <PageHeader
        title="Disputes"
        subtitle={`${openCount} open of ${store.disputes.length} flagged shifts/matches`}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setShowIssueTypes((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-mist"
            >
              <Settings2 size={15} /> Issue types
            </button>
            <button
              onClick={() => setEditing(emptyDispute(store.newId()))}
              className="inline-flex items-center gap-1.5 rounded-xl bg-pine px-3 py-2 text-sm font-medium text-white hover:bg-pine-dark"
            >
              <Plus size={15} /> New
            </button>
          </div>
        }
      />

      {showIssueTypes && (
        <Panel title="Dispute issue types" className="mb-4">
          <ManagedList listKey="disputeIssueTypes" label="issue type" />
        </Panel>
      )}

      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-line bg-white p-1">
        {(["all", "open", "under_review", "escalated", "resolved", "closed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f ? "bg-pine text-white" : "text-slate hover:bg-mist"
            }`}
          >
            {f === "all" ? "All" : LABEL[f]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {rows.map((d) => (
          <Panel key={d.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Info label="Worker" value={d.workerName || "—"} />
              <Info label="Business" value={store.businessLabel(d.businessId)} mono />
              <Info label="Issue" value={d.issueType} />
              <Info label="Raised" value={formatDate(d.raised)} />
              {d.assignedTo && <Info label="Assigned" value={d.assignedTo} />}
              <Pill tone={TONE[d.status]}>{LABEL[d.status]}</Pill>
            </div>
            <button
              onClick={() => setEditing(d)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-mist"
            >
              <Pencil size={15} /> Manage
            </button>
          </Panel>
        ))}
        {rows.length === 0 && (
          <Panel>
            <p className="py-6 text-center text-sm text-slate">No disputes in this view.</p>
          </Panel>
        )}
      </div>

      <DisputeDrawer dispute={editing} open={!!editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate">{label}</p>
      <p className={`text-sm font-medium text-ink ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
