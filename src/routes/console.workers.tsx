import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Star, Plus } from "lucide-react";
import { PageHeader, Pill, statusTone } from "@/components/console/ui";
import { ConsoleTable, type Col } from "@/components/console/ConsoleTable";
import { WorkerDrawer } from "@/components/console/WorkerDrawer";
import { useAdminStore, emptyWorker, type Worker } from "@/data/adminStore";

export const Route = createFileRoute("/console/workers")({
  head: () => ({ meta: [{ title: "Workers — Shiftinger admin" }] }),
  component: WorkersPage,
});

function WorkersPage() {
  const store = useAdminStore();
  const [editing, setEditing] = useState<Worker | null>(null);

  const columns: Col<Worker>[] = [
    {
      key: "name",
      label: "Name",
      value: (w) => w.name,
      render: (w) => (
        <span className="flex items-center gap-2 font-medium text-ink">
          <span>{w.flag}</span>
          {w.name}
        </span>
      ),
    },
    { key: "nationality", label: "Nationality", value: (w) => w.nationality },
    {
      key: "atividade",
      label: "Atividade",
      value: (w) => (w.atividade ? "Yes" : "No"),
      render: (w) => <Pill tone={w.atividade ? "pine" : "slate"}>{w.atividade ? "Yes" : "No"}</Pill>,
    },
    {
      key: "skills",
      label: "Skills",
      value: (w) => w.skills.join(" / "),
      render: (w) => (
        <span className="flex flex-wrap gap-1">
          {w.skills.slice(0, 2).map((s) => (
            <span key={s} className="rounded-md bg-mist px-1.5 py-0.5 text-xs text-slate">
              {s}
            </span>
          ))}
          {w.skills.length > 2 && <span className="text-xs text-slate">+{w.skills.length - 2}</span>}
        </span>
      ),
    },
    { key: "totalShifts", label: "Shifts", value: (w) => w.totalShifts, className: "text-center" },
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
      key: "status",
      label: "Status",
      value: (w) => w.status,
      render: (w) => <Pill tone={statusTone(w.status)}>{w.status}</Pill>,
    },
    {
      key: "actions",
      label: "Actions",
      value: () => "",
      csv: false,
      render: (w) => (
        <button
          onClick={() => setEditing(w)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-slate hover:bg-mist hover:text-ink"
          title="Edit"
        >
          <Pencil size={15} /> Edit
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Workers"
        subtitle={`${store.workers.length} registered workers`}
        action={
          <button
            onClick={() => setEditing(emptyWorker(store.newId()))}
            className="inline-flex items-center gap-1.5 rounded-xl bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-pine-dark"
          >
            <Plus size={15} /> Add worker
          </button>
        }
      />
      <ConsoleTable
        rows={store.workers}
        columns={columns}
        rowKey={(w) => w.id}
        csvName="workers"
        searchPlaceholder="Search by name or skill…"
        search={(w) => `${w.name} ${w.skills.join(" ")} ${w.nationality}`}
        filters={[
          { key: "nat", label: "Nationality", field: (w) => w.nationality, options: store.activeOptions("nationalities") },
          { key: "status", label: "Status", field: (w) => w.status, options: ["active", "inactive", "suspended"] },
        ]}
      />
      <WorkerDrawer worker={editing} open={!!editing} onClose={() => setEditing(null)} />
    </div>
  );
}
