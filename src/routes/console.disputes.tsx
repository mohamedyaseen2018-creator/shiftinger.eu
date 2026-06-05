import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Plus, Pencil } from "lucide-react";
import { PageHeader, Pill } from "@/components/console/ui";
import { ConsoleTable, type Col } from "@/components/console/ConsoleTable";
import { PrimaryButton } from "@/components/console/forms";
import { DisputeModal } from "@/components/console/DisputeModal";
import { useAdminStore, DISPUTE_STATUS_LABEL, disputeStatusTone, type Dispute } from "@/data/adminStore";

export const Route = createFileRoute("/console/disputes")({
  head: () => ({ meta: [{ title: "Disputes — Shiftinger admin" }] }),
  component: DisputesPage,
});

function DisputesPage() {
  const store = useAdminStore();
  const [editing, setEditing] = useState<Dispute | null>(null);
  const [creating, setCreating] = useState(false);

  const columns: Col<Dispute>[] = [
    { key: "title", label: "Title", value: (d) => d.title, render: (d) => <span className="font-medium text-ink">{d.title}</span> },
    { key: "issue", label: "Issue type", value: (d) => d.issueType || "—" },
    { key: "business", label: "Business", value: (d) => d.businessLabel || "—" },
    { key: "worker", label: "Worker", value: (d) => d.workerLabel || "—" },
    {
      key: "priority",
      label: "Priority",
      value: (d) => d.priority,
      render: (d) => <Pill tone={d.priority === "high" ? "red" : d.priority === "medium" ? "amber" : "slate"}>{d.priority}</Pill>,
    },
    {
      key: "status",
      label: "Status",
      value: (d) => DISPUTE_STATUS_LABEL[d.status] ?? d.status,
      render: (d) => <Pill tone={disputeStatusTone(d.status)}>{DISPUTE_STATUS_LABEL[d.status] ?? d.status}</Pill>,
    },
    { key: "deadline", label: "Deadline", value: (d) => d.deadline ?? "—" },
    {
      key: "actions",
      label: "",
      value: () => "",
      csv: false,
      render: () => (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-pine-dark">
          <Pencil size={13} /> Edit
        </span>
      ),
    },
  ];

  if (store.loading) {
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="animate-spin text-pine" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Disputes"
        subtitle={`${store.disputes.length} disputes`}
        action={
          <PrimaryButton onClick={() => setCreating(true)}>
            <Plus size={15} /> New dispute
          </PrimaryButton>
        }
      />
      <ConsoleTable
        rows={store.disputes}
        columns={columns}
        rowKey={(d) => d.id}
        csvName="disputes"
        searchPlaceholder="Search disputes…"
        search={(d) => `${d.title} ${d.issueType} ${d.businessLabel} ${d.workerLabel}`}
        filters={[
          {
            key: "status",
            label: "Status",
            field: (d) => DISPUTE_STATUS_LABEL[d.status] ?? d.status,
            options: [...new Set(store.disputes.map((d) => DISPUTE_STATUS_LABEL[d.status] ?? d.status))],
          },
        ]}
        rowClassName={() => "cursor-pointer"}
        empty="No disputes yet."
        onRowClick={(d) => setEditing(d)}
      />
      <DisputeModal dispute={editing} open={!!editing} onClose={() => setEditing(null)} />
      <DisputeModal dispute={null} open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
