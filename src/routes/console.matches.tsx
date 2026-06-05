import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill, statusTone } from "@/components/console/ui";
import { ConsoleTable, type Col } from "@/components/console/ConsoleTable";
import { SelectInput } from "@/components/console/forms";
import {
  useAdminStore,
  maskBusiness,
  type Match,
  type ApplicationStatus,
} from "@/data/adminStore";

export const Route = createFileRoute("/console/matches")({
  head: () => ({ meta: [{ title: "Matches — Shiftinger admin" }] }),
  component: MatchesPage,
});

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "applied", label: "Applied" },
  { value: "matched", label: "Matched" },
  { value: "confirmed", label: "Confirmed" },
  { value: "working", label: "Working" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

function MatchesPage() {
  const store = useAdminStore();

  const change = async (id: string, status: ApplicationStatus) => {
    try {
      await store.setMatchStatus(id, status);
      toast.success("Status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update status");
    }
  };

  const columns: Col<Match>[] = [
    { key: "worker", label: "Worker", value: (m) => m.workerName },
    {
      key: "business",
      label: "Business",
      value: (m) => maskBusiness(m.businessName, m.businessVerified),
      render: (m) => <span className="font-mono text-ink">{maskBusiness(m.businessName, m.businessVerified)}</span>,
    },
    { key: "role", label: "Role", value: (m) => m.role || "—" },
    { key: "date", label: "Date", value: (m) => m.date ?? "—" },
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
      label: "Set status",
      value: () => "",
      csv: false,
      render: (m) => (
        <div onClick={(e) => e.stopPropagation()}>
          <SelectInput
            value={m.status}
            onChange={(v) => change(m.id, v as ApplicationStatus)}
            options={STATUS_OPTIONS}
            className="py-1 text-xs"
          />
        </div>
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
      <PageHeader title="Matches" subtitle={`${store.matches.length} applications`} />
      <ConsoleTable
        rows={store.matches}
        columns={columns}
        rowKey={(m) => m.id}
        csvName="matches"
        searchPlaceholder="Search by worker, business, role…"
        search={(m) => `${m.workerName} ${m.businessName} ${m.role}`}
        filters={[
          {
            key: "status",
            label: "Status",
            field: (m) => m.status,
            options: [...new Set(store.matches.map((m) => m.status))],
          },
        ]}
        empty="No applications yet."
      />
    </div>
  );
}
