import { createFileRoute } from "@tanstack/react-router";
import { Eye, BadgeCheck, Ban, Star } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill, statusTone } from "@/components/console/ui";
import { ConsoleTable, type Col } from "@/components/console/ConsoleTable";
import {
  BUSINESSES,
  CITY_FILTER,
  SECTOR_FILTER,
  maskBusiness,
  type AdminBusiness,
} from "@/data/adminMock";

export const Route = createFileRoute("/console/businesses")({
  head: () => ({ meta: [{ title: "Businesses — Shiftinger admin" }] }),
  component: BusinessesPage,
});

function BusinessesPage() {
  const columns: Col<AdminBusiness>[] = [
    {
      key: "name",
      label: "Business",
      value: (b) => maskBusiness(b.name, b.confirmed),
      render: (b) => (
        <span className="font-mono font-medium text-ink">{maskBusiness(b.name, b.confirmed)}</span>
      ),
    },
    { key: "city", label: "City", value: (b) => b.city },
    { key: "sector", label: "Sector", value: (b) => b.sector },
    { key: "shiftsPosted", label: "Shifts posted", value: (b) => b.shiftsPosted, className: "text-center" },
    {
      key: "avgRating",
      label: "Avg rating",
      value: (b) => b.avgRating,
      render: (b) => (
        <span className="inline-flex items-center gap-1">
          <Star size={13} className="fill-amber text-amber" />
          {b.avgRating.toFixed(1)}
        </span>
      ),
    },
    {
      key: "verified",
      label: "Verified",
      value: (b) => (b.verified ? "Yes" : "No"),
      render: (b) =>
        b.verified ? (
          <Pill tone="pine">
            <BadgeCheck size={12} /> Verified
          </Pill>
        ) : (
          <Pill tone="slate">Unverified</Pill>
        ),
    },
    {
      key: "status",
      label: "Status",
      value: (b) => b.status,
      render: (b) => <Pill tone={statusTone(b.status)}>{b.status}</Pill>,
    },
    {
      key: "actions",
      label: "Actions",
      value: () => "",
      csv: false,
      render: (b) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => toast.info("Opening business profile")}
            className="rounded-lg p-1.5 text-slate hover:bg-mist hover:text-ink"
            title="View"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => toast.success("Business verified")}
            className="rounded-lg p-1.5 text-slate hover:bg-pine-soft hover:text-pine-dark"
            title="Verify"
          >
            <BadgeCheck size={16} />
          </button>
          <button
            onClick={() => toast.success("Business suspended")}
            className="rounded-lg p-1.5 text-slate hover:bg-red-50 hover:text-red-600"
            title="Suspend"
          >
            <Ban size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Businesses"
        subtitle="Names shown as initials until a shift is mutually confirmed"
      />
      <ConsoleTable
        rows={BUSINESSES}
        columns={columns}
        rowKey={(b) => b.id}
        csvName="businesses"
        searchPlaceholder="Search by sector or city…"
        search={(b) => `${maskBusiness(b.name, b.confirmed)} ${b.sector} ${b.city}`}
        filters={[
          { key: "city", label: "City", field: (b) => b.city, options: CITY_FILTER },
          { key: "sector", label: "Sector", field: (b) => b.sector, options: SECTOR_FILTER },
        ]}
      />
    </div>
  );
}
