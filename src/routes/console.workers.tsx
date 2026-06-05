import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Star, Loader2, BadgeCheck } from "lucide-react";
import { PageHeader, Pill } from "@/components/console/ui";
import { ConsoleTable, type Col } from "@/components/console/ConsoleTable";
import { WorkerDrawer } from "@/components/console/WorkerDrawer";
import {
  useAdminStore,
  STATUS_LABEL,
  statusToneFor,
  type Worker,
} from "@/data/adminStore";

export const Route = createFileRoute("/console/workers")({
  head: () => ({ meta: [{ title: "Workers — Shiftinger admin" }] }),
  component: WorkersPage,
});

function WorkersPage() {
  const store = useAdminStore();
  const [editing, setEditing] = useState<Worker | null>(null);

  const columns: Col<Worker>[] = [
    { key: "name", label: "Name", value: (w) => w.name, render: (w) => <span className="font-medium text-ink">{w.name}</span> },
    { key: "email", label: "Email", value: (w) => w.email },
    { key: "nationality", label: "Nationality", value: (w) => w.nationality },
    { key: "mainRole", label: "Main role", value: (w) => w.mainRole || "—" },
    {
      key: "atividade",
      label: "Atividade",
      value: (w) => (w.atividade ? "Yes" : "No"),
      render: (w) => <Pill tone={w.atividade ? "pine" : "slate"}>{w.atividade ? "Yes" : "No"}</Pill>,
    },
    { key: "shifts", label: "Shifts", value: (w) => w.shiftsCompleted, className: "text-center" },
    {
      key: "rating",
      label: "Rating",
      value: (w) => w.rating,
      render: (w) => (
        <span className="inline-flex items-center gap-1">
          <Star size={13} className="fill-amber text-amber" />
          {w.rating.toFixed(1)}
        </span>
      ),
    },
    {
      key: "cv",
      label: "CV",
      value: (w) => (w.hasCv ? "Yes" : "No"),
      className: "text-center",
      render: (w) => <Pill tone={w.hasCv ? "pine" : "red"}>{w.hasCv ? "Yes" : "No"}</Pill>,
    },
    {
      key: "docs",
      label: "Documents",
      value: (w) => (w.hasDocuments ? "Yes" : "No"),
      className: "text-center",
      render: (w) => <Pill tone={w.hasDocuments ? "pine" : "red"}>{w.hasDocuments ? "Yes" : "No"}</Pill>,
    },
    {
      key: "status",
      label: "Status",
      value: (w) => STATUS_LABEL[w.status],
      render: (w) => (
        <span className="inline-flex items-center gap-1.5">
          <Pill tone={statusToneFor(w.status)}>{STATUS_LABEL[w.status]}</Pill>
          {w.verified && <BadgeCheck size={14} className="text-pine" />}
        </span>
      ),
    },
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
      <PageHeader title="Workers" subtitle={`${store.workers.length} registered workers`} />
      <ConsoleTable
        rows={store.workers}
        columns={columns}
        rowKey={(w) => w.id}
        csvName="workers"
        searchPlaceholder="Search by name, email, role…"
        search={(w) => `${w.name} ${w.email} ${w.nationality} ${w.mainRole} ${w.subRoles.join(" ")}`}
        filters={[
          {
            key: "status",
            label: "Status",
            field: (w) => STATUS_LABEL[w.status],
            options: [...new Set(store.workers.map((w) => STATUS_LABEL[w.status]))],
          },
        ]}
        rowClassName={() => "cursor-pointer"}
        empty="No workers yet."
        onRowClick={(w) => setEditing(w)}
      />
      <WorkerDrawer worker={editing} open={!!editing} onClose={() => setEditing(null)} />
    </div>
  );
}
