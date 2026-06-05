import { createFileRoute } from "@tanstack/react-router";
import { Eye, Check, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill, statusTone } from "@/components/console/ui";
import { ConsoleTable, type Col } from "@/components/console/ConsoleTable";
import { MATCHES, businessById, maskBusiness, type AdminMatch } from "@/data/adminMock";

export const Route = createFileRoute("/console/matches")({
  head: () => ({ meta: [{ title: "Matches — Shiftinger admin" }] }),
  component: MatchesPage,
});

function MatchesPage() {
  const columns: Col<AdminMatch>[] = [
    { key: "id", label: "Match", value: (m) => m.id, render: (m) => <span className="font-mono text-xs">{m.id}</span> },
    { key: "worker", label: "Worker", value: (m) => m.workerName },
    {
      key: "business",
      label: "Business",
      value: (m) => {
        const b = businessById(m.businessId);
        return b ? maskBusiness(b.name, m.status === "confirmed") : "—";
      },
      render: (m) => {
        const b = businessById(m.businessId);
        return <span className="font-mono text-ink">{b ? maskBusiness(b.name, m.status === "confirmed") : "—"}</span>;
      },
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
            <span
              className="block h-full rounded-full bg-pine"
              style={{ width: `${m.score}%` }}
            />
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
            onClick={() => toast.info(`Opening ${m.id}`)}
            className="rounded-lg p-1.5 text-slate hover:bg-mist hover:text-ink"
            title="View"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => toast.success(`${m.id} confirmed`)}
            className="rounded-lg p-1.5 text-slate hover:bg-pine-soft hover:text-pine-dark"
            title="Confirm"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => toast.error(`${m.id} declined`)}
            className="rounded-lg p-1.5 text-slate hover:bg-red-50 hover:text-red-600"
            title="Decline"
          >
            <X size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Matches" subtitle="Worker-to-shift pairings and their match quality" />
      <ConsoleTable
        rows={MATCHES}
        columns={columns}
        rowKey={(m) => m.id}
        csvName="matches"
        searchPlaceholder="Search by worker or match…"
        search={(m) => `${m.id} ${m.workerName} ${m.role}`}
        filters={[
          { key: "status", label: "Status", field: (m) => m.status, options: ["pending", "confirmed", "declined"] },
        ]}
      />
    </div>
  );
}
