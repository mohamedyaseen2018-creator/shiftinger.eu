import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ArrowUpRight, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill, Panel, statusTone } from "@/components/console/ui";
import { DISPUTES, businessById, maskBusiness, type AdminDispute } from "@/data/adminMock";
import { formatDate } from "@/data/utils";

export const Route = createFileRoute("/console/disputes")({
  head: () => ({ meta: [{ title: "Disputes — Shiftinger admin" }] }),
  component: DisputesPage,
});

function DisputesPage() {
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const rows = DISPUTES.filter((d) => filter === "all" || d.status === filter);
  const openCount = DISPUTES.filter((d) => d.status === "open").length;

  return (
    <div>
      <PageHeader
        title="Disputes"
        subtitle={`${openCount} open of ${DISPUTES.length} flagged shifts/matches`}
        action={
          <div className="flex gap-1 rounded-xl border border-line bg-white p-1">
            {(["all", "open", "resolved"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  filter === f ? "bg-pine text-white" : "text-slate hover:bg-mist"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      <div className="space-y-3">
        {rows.map((d) => (
          <DisputeRow key={d.id} dispute={d} />
        ))}
        {rows.length === 0 && (
          <Panel>
            <p className="py-6 text-center text-sm text-slate">No disputes in this view.</p>
          </Panel>
        )}
      </div>
    </div>
  );
}

function DisputeRow({ dispute }: { dispute: AdminDispute }) {
  const biz = businessById(dispute.businessId);
  return (
    <Panel className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div>
          <p className="text-xs text-slate">Worker</p>
          <p className="text-sm font-medium text-ink">{dispute.workerName}</p>
        </div>
        <div>
          <p className="text-xs text-slate">Business</p>
          <p className="font-mono text-sm font-medium text-ink">
            {biz ? maskBusiness(biz.name, false) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate">Issue</p>
          <p className="text-sm font-medium text-ink">{dispute.issueType}</p>
        </div>
        <div>
          <p className="text-xs text-slate">Raised</p>
          <p className="text-sm font-medium text-ink">{formatDate(dispute.raised)}</p>
        </div>
        <Pill tone={statusTone(dispute.status)}>{dispute.status}</Pill>
      </div>

      {dispute.status === "open" ? (
        <div className="flex gap-2">
          <button
            onClick={() => toast.success(`${dispute.id} resolved`)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-pine px-3 py-2 text-sm font-medium text-white hover:bg-pine-dark"
          >
            <Check size={15} /> Resolve
          </button>
          <button
            onClick={() => toast.info(`${dispute.id} escalated`)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-dark/40 bg-amber-soft px-3 py-2 text-sm font-medium text-amber-dark hover:bg-amber-soft/70"
          >
            <ArrowUpRight size={15} /> Escalate
          </button>
          <button
            onClick={() => toast(`${dispute.id} closed`)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-medium text-slate hover:bg-mist"
          >
            <XCircle size={15} /> Close
          </button>
        </div>
      ) : (
        <Pill tone="pine">
          <Check size={12} /> Handled
        </Pill>
      )}
    </Panel>
  );
}
