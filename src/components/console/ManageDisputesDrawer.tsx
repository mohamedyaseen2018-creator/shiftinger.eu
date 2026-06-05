import { useState } from "react";
import { Plus, Pencil, Settings2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Pill } from "@/components/console/ui";
import { DisputeDrawer } from "@/components/console/DisputeDrawer";
import { ManagedList } from "@/components/console/ManagedList";
import { useAdminStore, type Dispute, type DisputeWorkflowStatus } from "@/data/adminStore";
import { formatDate } from "@/data/utils";

const STATUS_TONE: Record<DisputeWorkflowStatus, "amber" | "blue" | "pine" | "red" | "slate"> = {
  open: "amber",
  under_review: "blue",
  resolved: "pine",
  escalated: "red",
  closed: "slate",
};

const STATUS_LABEL: Record<DisputeWorkflowStatus, string> = {
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

export function ManageDisputesDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useAdminStore();
  const [editing, setEditing] = useState<Dispute | null>(null);
  const [showIssueTypes, setShowIssueTypes] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="flex w-full flex-col gap-0 bg-canvas p-0 sm:max-w-xl">
          <SheetHeader className="border-b border-line bg-white px-6 py-4">
            <SheetTitle className="font-sans">Disputes</SheetTitle>
            <SheetDescription>{store.disputes.filter((d) => d.status === "open").length} open of {store.disputes.length} total.</SheetDescription>
          </SheetHeader>

          <div className="flex items-center justify-between gap-2 border-b border-line bg-white px-6 py-3">
            <button
              onClick={() => setShowIssueTypes((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-mist"
            >
              <Settings2 size={15} /> {showIssueTypes ? "Hide issue types" : "Manage issue types"}
            </button>
            <button
              onClick={() => setEditing(emptyDispute(store.newId()))}
              className="inline-flex items-center gap-1.5 rounded-xl bg-pine px-3 py-2 text-sm font-medium text-white hover:bg-pine-dark"
            >
              <Plus size={15} /> New dispute
            </button>
          </div>

          {showIssueTypes && (
            <div className="border-b border-line bg-mist/40 px-6 py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate">Dispute issue types</p>
              <ManagedList listKey="disputeIssueTypes" label="issue type" />
            </div>
          )}

          <ul className="flex-1 divide-y divide-line overflow-y-auto">
            {store.disputes.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-6 py-3 hover:bg-mist/50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{d.issueType}</p>
                  <p className="truncate text-[11px] text-slate">
                    {d.id} · {d.workerName || "—"} · {store.businessLabel(d.businessId)} · {formatDate(d.raised)}
                  </p>
                </div>
                <Pill tone={STATUS_TONE[d.status]}>{STATUS_LABEL[d.status]}</Pill>
                <button onClick={() => setEditing(d)} className="rounded-lg p-1.5 text-slate hover:bg-mist hover:text-ink" title="Edit">
                  <Pencil size={15} />
                </button>
              </li>
            ))}
            {store.disputes.length === 0 && <li className="px-6 py-10 text-center text-sm text-slate">No disputes.</li>}
          </ul>
        </SheetContent>
      </Sheet>

      <DisputeDrawer dispute={editing} open={!!editing} onClose={() => setEditing(null)} />
    </>
  );
}
