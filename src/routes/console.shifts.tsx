import { createFileRoute } from "@tanstack/react-router";
import { Eye, Lock, ShieldAlert, Clock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill, statusTone } from "@/components/console/ui";
import { ConsoleTable, type Col } from "@/components/console/ConsoleTable";
import {
  SHIFTS,
  CITY_FILTER,
  businessById,
  maskBusiness,
  isConfirmationWindowOpen,
  type AdminShift,
} from "@/data/adminMock";

export const Route = createFileRoute("/console/shifts")({
  head: () => ({ meta: [{ title: "Shifts — Shiftinger admin" }] }),
  component: ShiftsPage,
});

// A shift's confirmation window is "active" when it is awaiting confirmation
// and the platform-wide window (07:00–12:00 Lisbon) is currently open.
function windowActive(s: AdminShift): boolean {
  return s.status === "matched" && isConfirmationWindowOpen();
}

function dateBucket(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) return "Past";
  if (diffDays === 0) return "Today";
  if (diffDays <= 7) return "Next 7 days";
  return "Later";
}

function ShiftsPage() {
  const open = isConfirmationWindowOpen();

  const columns: Col<AdminShift>[] = [
    { key: "id", label: "Shift ID", value: (s) => s.id, render: (s) => <span className="font-mono text-xs">{s.id}</span> },
    {
      key: "business",
      label: "Business",
      value: (s) => {
        const b = businessById(s.businessId);
        return b ? maskBusiness(b.name, s.confirmed) : "—";
      },
      render: (s) => {
        const b = businessById(s.businessId);
        return <span className="font-mono text-ink">{b ? maskBusiness(b.name, s.confirmed) : "—"}</span>;
      },
    },
    { key: "role", label: "Role", value: (s) => s.role },
    { key: "date", label: "Date", value: (s) => s.date },
    {
      key: "time",
      label: "Time",
      value: (s) => `${s.startTime}–${s.endTime}`,
      render: (s) => (
        <span className="inline-flex items-center gap-2">
          {`${s.startTime}–${s.endTime}`}
          {windowActive(s) && (
            <Pill tone="amber">
              <Clock size={11} /> Window open
            </Pill>
          )}
        </span>
      ),
    },
    { key: "pay", label: "Pay", value: (s) => s.pay, render: (s) => `€${s.pay}/hr` },
    { key: "applications", label: "Apps", value: (s) => s.applications, className: "text-center" },
    {
      key: "status",
      label: "Status",
      value: (s) => s.status,
      render: (s) => <Pill tone={statusTone(s.status)}>{s.status}</Pill>,
    },
    {
      key: "actions",
      label: "Actions",
      value: () => "",
      csv: false,
      render: (s) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => toast.info(`Opening ${s.id}`)}
            className="rounded-lg p-1.5 text-slate hover:bg-mist hover:text-ink"
            title="View detail"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => toast.success(`${s.id} force-closed`)}
            className="rounded-lg p-1.5 text-slate hover:bg-amber-soft hover:text-amber-dark"
            title="Force-close"
          >
            <Lock size={16} />
          </button>
          <button
            onClick={() => toast.success(`Dispute resolution opened for ${s.id}`)}
            className="rounded-lg p-1.5 text-slate hover:bg-red-50 hover:text-red-600"
            title="Resolve dispute"
          >
            <ShieldAlert size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Shifts"
        subtitle="Manage every posted shift across Lisbon and Porto"
        action={
          <Pill tone={open ? "amber" : "slate"}>
            <Clock size={12} />
            Confirmation window {open ? "open (07:00–12:00 Lisbon)" : "closed"}
          </Pill>
        }
      />
      <ConsoleTable
        rows={SHIFTS}
        columns={columns}
        rowKey={(s) => s.id}
        csvName="shifts"
        searchPlaceholder="Search by shift ID or role…"
        search={(s) => `${s.id} ${s.role}`}
        rowClassName={(s) => (windowActive(s) ? "bg-amber-soft/60 hover:bg-amber-soft" : "")}
        filters={[
          {
            key: "status",
            label: "Status",
            field: (s) => s.status,
            options: ["open", "matched", "confirmed", "expired", "cancelled"],
          },
          { key: "city", label: "City", field: (s) => s.city, options: CITY_FILTER },
          {
            key: "when",
            label: "Date",
            field: (s) => dateBucket(s.date),
            options: ["Past", "Today", "Next 7 days", "Later"],
          },
        ]}
      />
    </div>
  );
}
