import { createFileRoute } from "@tanstack/react-router";
import { Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill, statusTone } from "@/components/console/ui";
import { ConsoleTable, type Col } from "@/components/console/ConsoleTable";
import { useAdminStore, type Match } from "@/data/adminStore";

export const Route = createFileRoute("/console/matches")({
  head: () => ({ meta: [{ title: "Matches — Shiftinger admin" }] }),
  component: MatchesPage,
});

function MatchesPage() {
  const store = useAdminStore();

  const columns: Col<Match>[] = [
    { key: "id", label: "Match", value: (m) => m.id, render: (m) => <span className="font-mono text-xs">{m.id}</span> },
    { key: "worker", label: "Worker", value: (m) => m.workerName },
    {
      key: "business",
      label: "Business",
      value: (m) => store.businessLabel(m.businessId, m.status === "confirmed"),
      render: (m) => <span className="font-mono text-ink">{store.businessLabel(m.businessId, m.status === "confirmed")}</span>,
    },
    { key: "role", label: "Role", value: (m) => m.role },
    { key: "date", label: "Date", value: (m) => m.date },
    {
      key: "score",
      label: "Match score",
      value: (m) => m.score,
      render: (m) => (
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-mist">
            <span className="block h-full rounded-full bg-pine" style={{ width: `${m.score}%` }} />
          </span>
          <span className="text-xs font-medium text-ink">{m.score}%</span>
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      value: (m) => m.status,
      render: (m) => <Pill tone={statusTone(m.status)}>{m.status}</Pill>,
    },
    {
      key: "actions",
      label: "Actions",
      value: () => "",
      csv: false,
      render: (m) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => { store.upsertMatch({ ...m, status: "confirmed" }); toast.success(`${m.id} confirmed`); }}
            className="rounded-lg p-1.5 text-slate hover:bg-pine-soft hover:text-pine-dark"
            title="Confirm"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => { store.upsertMatch({ ...m, status: "declined" }); toast.error(`${m.id} declined`); }}
            className="rounded-lg p-1.5 text-slate hover:bg-amber-soft hover:text-amber-dark"
            title="Decline"
          >
            <X size={16} />
          </button>
          <button
            onClick={() => { store.removeMatch(m.id); toast.success(`${m.id} deleted`); }}
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
      <PageHeader title="Matches" subtitle="Worker-to-shift pairings and their match quality" />
      <ConsoleTable
        rows={store.matches}
        columns={columns}
        rowKey={(m) => m.id}
        csvName="matches"
        searchPlaceholder="Search by worker or match…"
        search={(m) => `${m.id} ${m.workerName} ${m.role}`}
        filters={[{ key: "status", label: "Status", field: (m) => m.status, options: ["pending", "confirmed", "declined"] }]}
      />
    </div>
  );
}
