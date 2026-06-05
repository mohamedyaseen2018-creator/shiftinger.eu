import { createFileRoute } from "@tanstack/react-router";
import { Eye, Ban, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill, statusTone } from "@/components/console/ui";
import { ConsoleTable, type Col } from "@/components/console/ConsoleTable";
import { WORKERS, NATIONALITY_FILTER, type AdminWorker } from "@/data/adminMock";

export const Route = createFileRoute("/console/workers")({
  head: () => ({ meta: [{ title: "Workers — Shiftinger admin" }] }),
  component: WorkersPage,
});

function WorkersPage() {
  const columns: Col<AdminWorker>[] = [
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => toast.info(`Viewing ${w.name}`)}
            className="rounded-lg p-1.5 text-slate hover:bg-mist hover:text-ink"
            title="View"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => toast.success(`${w.name} suspended`)}
            className="rounded-lg p-1.5 text-slate hover:bg-amber-soft hover:text-amber-dark"
            title="Suspend"
          >
            <Ban size={16} />
          </button>
          <button
            onClick={() => toast.error(`${w.name} deleted`)}
            className="rounded-lg p-1.5 text-slate hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Workers" subtitle={`${WORKERS.length} registered workers`} />
      <ConsoleTable
        rows={WORKERS}
        columns={columns}
        rowKey={(w) => w.id}
        csvName="workers"
        searchPlaceholder="Search by name or skill…"
        search={(w) => `${w.name} ${w.skills.join(" ")} ${w.nationality}`}
        filters={[
          { key: "nat", label: "Nationality", field: (w) => w.nationality, options: NATIONALITY_FILTER },
          { key: "status", label: "Status", field: (w) => w.status, options: ["active", "inactive"] },
        ]}
      />
    </div>
  );
}
